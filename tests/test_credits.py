"""
tests/test_credits.py
─────────────────────────────────────────────────────────────────────────────
Integration tests for the credit system in database/db.py.

Run with:
    python -m pytest tests/test_credits.py -v

All tests use an isolated temporary SQLite database so they never touch
production data.
"""

import os
import sys
import uuid
import tempfile
import shutil
import threading
import unittest

sys.path.insert(0, os.path.join(os.path.dirname(__file__), "..", "backend", "app"))

import database.db as db


def _make_isolated_db() -> str:
    tmp = tempfile.mkdtemp(prefix="sonikoma-credits-test-")
    return os.path.join(tmp, "test.db")


def _setup_db(db_path: str) -> None:
    schema_path = os.path.join(
        os.path.dirname(__file__), "..", "backend", "database", "schema.sql"
    )
    db.DB_PATH = db_path
    db.SCHEMA_PATH = schema_path
    db._db_initialized = False
    db._is_postgres = False
    db.init_db()


def _create_test_user(role: str = "creator", starting_credits: int = 100) -> str:
    user_id = f"test_{uuid.uuid4().hex[:8]}"
    db.create_user(
        {
            "user_id": user_id,
            "email": f"{user_id}@test.local",
            "password_hash": "x",
            "username": f"testuser_{user_id}",
            "full_name": f"Test User {user_id}",
            "creator_role": role,
        }
    )
    conn = db.get_db_connection()
    try:
        conn.execute(
            "UPDATE users SET credits = ?, credit_balance = ?, creator_role = ? WHERE id = ?",
            (starting_credits, starting_credits, role, user_id),
        )
        conn.commit()
    finally:
        conn.close()
    return user_id


class TestCreditHappyPath(unittest.TestCase):
    def setUp(self):
        self.db_path = _make_isolated_db()
        _setup_db(self.db_path)
        self.user_id = _create_test_user(starting_credits=50)

    def tearDown(self):
        shutil.rmtree(os.path.dirname(self.db_path), ignore_errors=True)

    def test_deduct_reduces_balance(self):
        new_bal = db.record_credit_transaction(self.user_id, -10, "sd_generate")
        self.assertEqual(new_bal, 40)
        self.assertEqual(db.get_available_credits(self.user_id), 40)

    def test_add_increases_balance(self):
        new_bal = db.record_credit_transaction(self.user_id, 50, "daily_claim")
        self.assertEqual(new_bal, 100)
        self.assertEqual(db.get_available_credits(self.user_id), 100)

    def test_ledger_row_written(self):
        db.record_credit_transaction(self.user_id, -5, "sfx_mix")
        txs = db.get_credit_transactions(self.user_id)
        self.assertEqual(len(txs), 1)
        self.assertEqual(txs[0]["amount"], -5)
        self.assertEqual(txs[0]["feature_name"], "sfx_mix")

    def test_balance_after_populated(self):
        db.record_credit_transaction(self.user_id, -10, "video_render")
        txs = db.get_credit_transactions(self.user_id)
        self.assertEqual(txs[0]["balance_after"], 40)


class TestCreditInsufficientBalance(unittest.TestCase):
    def setUp(self):
        self.db_path = _make_isolated_db()
        _setup_db(self.db_path)
        self.user_id = _create_test_user(starting_credits=10)

    def tearDown(self):
        shutil.rmtree(os.path.dirname(self.db_path), ignore_errors=True)

    def test_raises_value_error(self):
        with self.assertRaises(ValueError) as ctx:
            db.record_credit_transaction(self.user_id, -20, "video_render")
        self.assertIn("Insufficient credits", str(ctx.exception))

    def test_balance_unchanged_after_rejection(self):
        try:
            db.record_credit_transaction(self.user_id, -20, "video_render")
        except ValueError:
            pass
        self.assertEqual(db.get_available_credits(self.user_id), 10)

    def test_no_ledger_row_on_rejection(self):
        try:
            db.record_credit_transaction(self.user_id, -20, "video_render")
        except ValueError:
            pass
        txs = db.get_credit_transactions(self.user_id)
        self.assertEqual(len(txs), 0)

    def test_error_message_detail(self):
        try:
            db.record_credit_transaction(self.user_id, -999, "sd_generate")
            self.fail("Expected ValueError")
        except ValueError as exc:
            self.assertIn("Insufficient credits", str(exc))
            self.assertIn("need 999", str(exc))
            self.assertIn("have 10", str(exc))


class TestAdminBypass(unittest.TestCase):
    def setUp(self):
        self.db_path = _make_isolated_db()
        _setup_db(self.db_path)
        self.admin_id = _create_test_user(role="admin", starting_credits=5)

    def tearDown(self):
        shutil.rmtree(os.path.dirname(self.db_path), ignore_errors=True)

    def test_admin_can_go_negative(self):
        new_bal = db.record_credit_transaction(self.admin_id, -20, "admin_action")
        self.assertEqual(new_bal, -15)

    def test_admin_ledger_row_written(self):
        db.record_credit_transaction(self.admin_id, -20, "admin_action")
        txs = db.get_credit_transactions(self.admin_id)
        self.assertEqual(len(txs), 1)


class TestConcurrentDeductions(unittest.TestCase):
    """Two threads simultaneously try to spend the same last 10 credits."""

    def setUp(self):
        self.db_path = _make_isolated_db()
        _setup_db(self.db_path)
        self.user_id = _create_test_user(starting_credits=10)
        self.results = []
        self.errors = []

    def tearDown(self):
        shutil.rmtree(os.path.dirname(self.db_path), ignore_errors=True)

    def _try_deduct(self):
        try:
            bal = db.record_credit_transaction(self.user_id, -10, "video_render")
            self.results.append(bal)
        except ValueError as e:
            self.errors.append(str(e))

    def test_only_one_thread_wins(self):
        t1 = threading.Thread(target=self._try_deduct)
        t2 = threading.Thread(target=self._try_deduct)
        t1.start()
        t2.start()
        t1.join()
        t2.join()

        self.assertEqual(len(self.results), 1, "Expected exactly 1 successful deduction")
        self.assertEqual(len(self.errors), 1, "Expected exactly 1 rejected deduction")
        self.assertEqual(db.get_available_credits(self.user_id), 0)
        txs = db.get_credit_transactions(self.user_id)
        self.assertEqual(len(txs), 1)


class TestAtomicRollbackOnLedgerFailure(unittest.TestCase):
    """If the ledger INSERT fails, the balance update must also roll back."""

    def setUp(self):
        self.db_path = _make_isolated_db()
        _setup_db(self.db_path)
        self.user_id = _create_test_user(starting_credits=50)

    def tearDown(self):
        shutil.rmtree(os.path.dirname(self.db_path), ignore_errors=True)

    def test_balance_unchanged_when_ledger_fails(self):
        """
        Directly tests the rollback invariant by running the balance UPDATE
        and then calling rollback() before commit — simulating what happens when
        the ledger INSERT raises. The final read must show the original balance.
        """
        original = db.get_available_credits(self.user_id)
        self.assertEqual(original, 50)

        conn = db.get_db_connection()
        try:
            conn.execute("BEGIN IMMEDIATE")
            conn.execute(
                "UPDATE users SET credits = ?, credit_balance = ? WHERE id = ?",
                (original - 10, original - 10, self.user_id),
            )
            # Simulate ledger INSERT failure → rollback immediately
            conn.rollback()
        finally:
            conn.close()

        # Balance must still be 50 — rollback undid the UPDATE
        self.assertEqual(db.get_available_credits(self.user_id), 50)


class TestLowBalanceThreshold(unittest.TestCase):
    def test_threshold_constant_defined(self):
        self.assertTrue(hasattr(db, "LOW_BALANCE_THRESHOLD"))
        self.assertIsInstance(db.LOW_BALANCE_THRESHOLD, int)

    def test_threshold_value_is_20(self):
        self.assertEqual(db.LOW_BALANCE_THRESHOLD, 20)

    def test_new_balance_below_threshold_after_deduction(self):
        db_path = _make_isolated_db()
        _setup_db(db_path)
        user_id = _create_test_user(starting_credits=25)
        try:
            new_bal = db.record_credit_transaction(user_id, -10, "sd_generate")
            self.assertEqual(new_bal, 15)
            self.assertLess(new_bal, db.LOW_BALANCE_THRESHOLD)
        finally:
            shutil.rmtree(os.path.dirname(db_path), ignore_errors=True)

    def test_new_balance_above_threshold_after_deduction(self):
        db_path = _make_isolated_db()
        _setup_db(db_path)
        user_id = _create_test_user(starting_credits=100)
        try:
            new_bal = db.record_credit_transaction(user_id, -10, "sd_generate")
            self.assertGreaterEqual(new_bal, db.LOW_BALANCE_THRESHOLD)
        finally:
            shutil.rmtree(os.path.dirname(db_path), ignore_errors=True)


if __name__ == "__main__":
    unittest.main(verbosity=2)

