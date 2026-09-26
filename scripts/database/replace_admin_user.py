import sqlite3
import os

DB_PATH = os.path.join(os.path.dirname(__file__), "..", "..", "data", "webtoon_local.db")

def main():
    conn = sqlite3.connect(DB_PATH)
    cur = conn.cursor()
    cur.execute("PRAGMA foreign_keys = OFF")

    new_user_id = "user_admin_sonikoma"
    old_user_id = "user_cacfbef1"
    pw_hash = "$2b$12$MI9pPwCXwr4F4sEbUTzNZe/Or.T6iRXQbu2Ka3EKyK7CqXL6WrV6m"  # password123

    # Insert new user
    cur.execute("""
        INSERT OR REPLACE INTO users (
            id, username, email, password_hash, preferences, avatar_url,
            full_name, google_id, creator_role, bio, newsletter, language, portfolio_links,
            credits, credit_balance, last_claimed_date, unlocked_rewards, mfa_enabled,
            social_connections, created_at, updated_at
        ) VALUES (
            ?, ?, ?, ?, ?, ?,
            ?, NULL, ?, 'Platform Administrator', 1, 'en', '[]',
            9999, 9999, NULL, '["badge_pro_creator","badge_admin"]', 0,
            '{"google":true,"github":true,"discord":true}', datetime('now'), datetime('now')
        )
    """, (
        new_user_id,
        "Sonikoma_Admin",
        "admin@sonikoma.ai",
        pw_hash,
        '{"theme":"dark","autoSave":true,"volume":1.0}',
        "https://lh3.googleusercontent.com/a/default-user",
        "Sonikoma Admin",
        "admin"
    ))

    # Reassign all series, chapters, panels, etc. to new user
    cur.execute("UPDATE series SET user_id = ?", (new_user_id,))
    cur.execute("UPDATE user_audit_logs SET user_id = ?", (new_user_id,))
    cur.execute("UPDATE user_invoices SET user_id = ?", (new_user_id,))
    cur.execute("UPDATE credit_transactions SET user_id = ?", (new_user_id,))
    cur.execute("UPDATE token_usage_logs SET user_id = ?", (new_user_id,))
    cur.execute("UPDATE user_sessions SET user_id = ?", (new_user_id,))
    cur.execute("UPDATE user_api_keys SET user_id = ?", (new_user_id,))

    # Delete old user completely
    cur.execute("DELETE FROM users WHERE id = ?", (old_user_id,))
    cur.execute("DELETE FROM users WHERE email = 'dheenadayalan017@gmail.com'")
    cur.execute("DELETE FROM users WHERE id != ?", (new_user_id,))

    cur.execute("PRAGMA foreign_keys = ON")
    conn.commit()

    cur.execute("SELECT id, username, email, creator_role, credits FROM users")
    users = cur.fetchall()
    print("USERS:", users)
    cur.execute("SELECT id, user_id, title FROM series")
    series = cur.fetchall()
    print("SERIES:", series)

    conn.close()

if __name__ == "__main__":
    main()
