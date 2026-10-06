"""
backend/app/repositories/interfaces/user.py
─────────────────────────────────────────────────────────────────────────────
Abstract interface contracts for User management, Sessions, and Credits repositories.
─────────────────────────────────────────────────────────────────────────────
"""

from abc import ABC, abstractmethod
from typing import List, Dict, Any, Optional

class IUserRepository(ABC):
    """Abstract interface contract for User CRUD, Profiles, Invoices, and API Keys."""

    @abstractmethod
    def create_user(self, email: str, password_hash: str, display_name: Optional[str] = None) -> Dict[str, Any]:
        """Creates a new user profile."""
        pass

    @abstractmethod
    def create_user_relational(self, email: str, password_hash: str, display_name: Optional[str] = None) -> Dict[str, Any]:
        """Creates a user using the relational DB schema flow."""
        pass

    @abstractmethod
    def get_user_by_email(self, email: str) -> Optional[Dict[str, Any]]:
        """Retrieves a user configuration by email address."""
        pass

    @abstractmethod
    def get_user_by_id(self, user_id: str) -> Optional[Dict[str, Any]]:
        """Retrieves a user configuration by internal ID."""
        pass

    @abstractmethod
    def get_all_users(self) -> List[Dict[str, Any]]:
        """Lists all registered user profiles."""
        pass

    @abstractmethod
    def update_user(self, user_id: str, updates: Dict[str, Any]) -> Dict[str, Any]:
        """Modifies selected fields on a user record."""
        pass

    @abstractmethod
    def delete_user(self, user_id: str) -> bool:
        """Removes a user profile from the database."""
        pass

    @abstractmethod
    def get_creator_analytics(self, user_id: str) -> Dict[str, Any]:
        """Gathers aggregate analytics for webtoon projects owned by a creator."""
        pass

    @abstractmethod
    def get_user_achievements_and_points(self, user_id: str) -> Dict[str, Any]:
        """Retrieves gamification features, points, and unlock achievements."""
        pass

    @abstractmethod
    def get_user_invoices(self, user_id: str) -> List[Dict[str, Any]]:
        """Retrieves payment invoices belonging to a user."""
        pass

    @abstractmethod
    def create_user_invoice(self, user_id: str, amount: float, description: str, status: str = "paid") -> Dict[str, Any]:
        """Generates a new invoice item."""
        pass

    @abstractmethod
    def seed_default_invoices_if_empty(self, user_id: str) -> None:
        """Utility to prepopulate sample transaction history if empty."""
        pass

    @abstractmethod
    def get_user_api_keys(self, user_id: str) -> List[Dict[str, Any]]:
        """Lists all active developer API keys registered to a user."""
        pass

    @abstractmethod
    def get_user_by_api_key(self, api_key: str) -> Optional[Dict[str, Any]]:
        """Looks up a user record matching a provided API key."""
        pass

    @abstractmethod
    def create_user_api_key(self, user_id: str, name: str, key_hash: str) -> Dict[str, Any]:
        """Registers a new developer API key."""
        pass

    @abstractmethod
    def delete_user_api_key(self, key_id: str, user_id: str) -> bool:
        """Revokes an API key."""
        pass


class ISessionRepository(ABC):
    """Abstract interface contract for active User Sessions and Audits."""

    @abstractmethod
    def create_user_session(self, user_id: str, token: str, expires_at: str, user_agent: Optional[str] = None, ip_address: Optional[str] = None) -> Dict[str, Any]:
        """Registers a new active session token."""
        pass

    @abstractmethod
    def get_user_sessions(self, user_id: str) -> List[Dict[str, Any]]:
        """Lists all active session records for a user."""
        pass

    @abstractmethod
    def terminate_user_session(self, token: str) -> bool:
        """Invalidates a session token (logs out user)."""
        pass

    @abstractmethod
    def write_audit_log(self, user_id: str, action: str, details: Optional[str] = None, ip_address: Optional[str] = None) -> None:
        """Writes a security or action audit log entry."""
        pass

    @abstractmethod
    def get_audit_logs(self, user_id: str) -> List[Dict[str, Any]]:
        """Retrieves audit trails for a specific user account."""
        pass


class ICreditRepository(ABC):
    """Abstract interface contract for credit checking, balance updates, and transaction history."""

    @abstractmethod
    def get_available_credits(self, user_id: str) -> int:
        """Retrieves the current remaining balance of creator credits."""
        pass

    @abstractmethod
    def record_credit_transaction(self, user_id: str, amount: int, transaction_type: str, description: Optional[str] = None) -> Dict[str, Any]:
        """Logs a credit adjustment transaction."""
        pass

    @abstractmethod
    def check_credits(self, user_id: str, required_amount: int) -> bool:
        """Checks if a user has sufficient credits to execute an operation."""
        pass

    @abstractmethod
    def deduct_credits(self, user_id: str, required_amount: int, description: Optional[str] = None) -> None:
        """Deducts credits from a user profile and logs the transaction. Raises balance error if insufficient."""
        pass

    @abstractmethod
    def get_credit_transactions(self, user_id: str) -> List[Dict[str, Any]]:
        """Retrieves transactional ledger logs showing history of credit updates."""
        pass
