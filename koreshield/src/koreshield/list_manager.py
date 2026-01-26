"""
Blocklist and Allowlist Management API for KoreShield.
"""

from typing import Dict, List, Optional, Set, Any
import structlog
import json
import os
from datetime import datetime, timedelta
from enum import Enum

logger = structlog.get_logger(__name__)


class ListType(Enum):
    """Types of lists that can be managed."""
    BLOCKLIST = "blocklist"
    ALLOWLIST = "allowlist"


class ListEntry:
    """Represents an entry in a blocklist or allowlist."""

    def __init__(
        self,
        value: str,
        entry_type: str,
        reason: str = "",
        added_by: str = "system",
        expires_at: Optional[datetime] = None,
        metadata: Optional[Dict[str, Any]] = None,
    ):
        """
        Initialize a list entry.

        Args:
            value: The value to block/allow (IP, domain, keyword, etc.)
            entry_type: Type of entry (ip, domain, keyword, user, etc.)
            reason: Reason for adding to list
            added_by: Who added this entry
            expires_at: When this entry expires (None = never)
            metadata: Additional metadata
        """
        self.value = value
        self.entry_type = entry_type
        self.reason = reason
        self.added_by = added_by
        self.created_at = datetime.now()
        self.expires_at = expires_at
        self.metadata = metadata or {}
        self.is_active = True

    def to_dict(self) -> Dict[str, Any]:
        """Convert entry to dictionary."""
        return {
            "value": self.value,
            "entry_type": self.entry_type,
            "reason": self.reason,
            "added_by": self.added_by,
            "created_at": self.created_at.isoformat(),
            "expires_at": self.expires_at.isoformat() if self.expires_at else None,
            "metadata": self.metadata,
            "is_active": self.is_active,
        }

    @classmethod
    def from_dict(cls, data: Dict[str, Any]) -> "ListEntry":
        """Create entry from dictionary."""
        entry = cls(
            value=data["value"],
            entry_type=data["entry_type"],
            reason=data.get("reason", ""),
            added_by=data.get("added_by", "system"),
            expires_at=datetime.fromisoformat(data["expires_at"]) if data.get("expires_at") else None,
            metadata=data.get("metadata", {}),
        )
        entry.created_at = datetime.fromisoformat(data["created_at"])
        entry.is_active = data.get("is_active", True)
        return entry

    def is_expired(self) -> bool:
        """Check if this entry has expired."""
        if not self.expires_at:
            return False
        return datetime.now() > self.expires_at


class ListManager:
    """
    Manages blocklists and allowlists for various types of entries.
    """

    def __init__(self, config: Optional[Dict] = None, storage_path: Optional[str] = None):
        """
        Initialize the list manager.

        Args:
            config: Configuration dictionary
            storage_path: Path to store list data (defaults to ./data/lists/)
        """
        self.config = config or {}
        self.storage_path = storage_path or self.config.get("storage_path", os.path.join(os.getcwd(), "data", "lists"))
        self.lists: Dict[str, Dict[str, ListEntry]] = {
            ListType.BLOCKLIST.value: {},
            ListType.ALLOWLIST.value: {},
        }

        # Create storage directory if it doesn't exist
        os.makedirs(self.storage_path, exist_ok=True)

        # Load existing lists
        self._load_lists()

        # Clean up expired entries on startup
        self._cleanup_expired_entries()

    def _get_list_file(self, list_type: ListType) -> str:
        """Get the file path for a list type."""
        return os.path.join(self.storage_path, f"{list_type.value}.json")

    def _load_lists(self):
        """Load lists from storage."""
        for list_type in [ListType.BLOCKLIST, ListType.ALLOWLIST]:
            file_path = self._get_list_file(list_type)
            if os.path.exists(file_path):
                try:
                    with open(file_path, 'r') as f:
                        data = json.load(f)
                        for entry_data in data.get("entries", []):
                            entry = ListEntry.from_dict(entry_data)
                            self.lists[list_type.value][entry.value] = entry
                    logger.info(f"Loaded {list_type.value}", count=len(self.lists[list_type.value]))
                except Exception as e:
                    logger.error(f"Failed to load {list_type.value}", error=str(e))

    def _save_list(self, list_type: ListType):
        """Save a list to storage."""
        file_path = self._get_list_file(list_type)
        try:
            data = {
                "list_type": list_type.value,
                "last_updated": datetime.now().isoformat(),
                "entries": [entry.to_dict() for entry in self.lists[list_type.value].values()],
            }
            with open(file_path, 'w') as f:
                json.dump(data, f, indent=2)
            logger.debug(f"Saved {list_type.value}", count=len(self.lists[list_type.value]))
        except Exception as e:
            logger.error(f"Failed to save {list_type.value}", error=str(e))

    def _cleanup_expired_entries(self):
        """Remove expired entries from all lists."""
        total_removed = 0
        for list_type in [ListType.BLOCKLIST, ListType.ALLOWLIST]:
            expired = [value for value, entry in self.lists[list_type.value].items() if entry.is_expired()]
            for value in expired:
                del self.lists[list_type.value][value]
                total_removed += 1
            if expired:
                self._save_list(list_type)

        if total_removed > 0:
            logger.info("Cleaned up expired entries", count=total_removed)

    def add_entry(
        self,
        list_type: ListType,
        value: str,
        entry_type: str,
        reason: str = "",
        added_by: str = "system",
        expires_in_days: Optional[int] = None,
        metadata: Optional[Dict[str, Any]] = None,
    ) -> bool:
        """
        Add an entry to a list.

        Args:
            list_type: Type of list (BLOCKLIST or ALLOWLIST)
            value: The value to add
            entry_type: Type of entry (ip, domain, keyword, etc.)
            reason: Reason for adding
            added_by: Who is adding this entry
            expires_in_days: Days until expiration (None = never expires)
            metadata: Additional metadata

        Returns:
            True if entry was added successfully
        """
        try:
            expires_at = None
            if expires_in_days:
                expires_at = datetime.now() + timedelta(days=expires_in_days)

            entry = ListEntry(
                value=value,
                entry_type=entry_type,
                reason=reason,
                added_by=added_by,
                expires_at=expires_at,
                metadata=metadata,
            )

            self.lists[list_type.value][value] = entry
            self._save_list(list_type)

            logger.info(
                "Entry added to list",
                list_type=list_type.value,
                value=value,
                entry_type=entry_type,
                added_by=added_by,
            )
            return True

        except Exception as e:
            logger.error("Failed to add entry", error=str(e))
            return False

    def remove_entry(self, list_type: ListType, value: str) -> bool:
        """
        Remove an entry from a list.

        Args:
            list_type: Type of list
            value: The value to remove

        Returns:
            True if entry was removed
        """
        if value in self.lists[list_type.value]:
            del self.lists[list_type.value][value]
            self._save_list(list_type)
            logger.info("Entry removed from list", list_type=list_type.value, value=value)
            return True
        return False

    def check_entry(self, list_type: ListType, value: str) -> Optional[ListEntry]:
        """
        Check if a value exists in a list.

        Args:
            list_type: Type of list to check
            value: The value to check

        Returns:
            The entry if found and active, None otherwise
        """
        entry = self.lists[list_type.value].get(value)
        if entry and entry.is_active and not entry.is_expired():
            return entry
        return None

    def list_entries(
        self,
        list_type: ListType,
        entry_type: Optional[str] = None,
        include_expired: bool = False,
    ) -> List[Dict[str, Any]]:
        """
        List entries in a list.

        Args:
            list_type: Type of list
            entry_type: Filter by entry type (optional)
            include_expired: Whether to include expired entries

        Returns:
            List of entry dictionaries
        """
        entries = []
        for entry in self.lists[list_type.value].values():
            if entry_type and entry.entry_type != entry_type:
                continue
            if not include_expired and entry.is_expired():
                continue
            entries.append(entry.to_dict())
        return entries

    def get_stats(self) -> Dict[str, Any]:
        """
        Get statistics about the lists.

        Returns:
            Dictionary with list statistics
        """
        stats = {}
        for list_type in [ListType.BLOCKLIST, ListType.ALLOWLIST]:
            list_name = list_type.value
            entries = self.lists[list_name]

            active_count = sum(1 for e in entries.values() if e.is_active and not e.is_expired())
            expired_count = sum(1 for e in entries.values() if e.is_expired())
            total_count = len(entries)

            entry_types: Dict[str, int] = {}
            for entry in entries.values():
                if entry.is_active and not entry.is_expired():
                    entry_types[entry.entry_type] = entry_types.get(entry.entry_type, 0) + 1

            stats[list_name] = {
                "total_entries": total_count,
                "active_entries": active_count,
                "expired_entries": expired_count,
                "entry_types": entry_types,
            }

        return stats

    def bulk_add_entries(
        self,
        list_type: ListType,
        entries: List[Dict[str, Any]],
        added_by: str = "system",
    ) -> Dict[str, int]:
        """
        Bulk add multiple entries to a list.

        Args:
            list_type: Type of list
            entries: List of entry dictionaries
            added_by: Who is adding these entries

        Returns:
            Dictionary with success/failure counts
        """
        success_count = 0
        failure_count = 0

        for entry_data in entries:
            try:
                expires_in_days = entry_data.get("expires_in_days")
                expires_at = None
                if expires_in_days:
                    expires_at = datetime.now() + timedelta(days=expires_in_days)

                entry = ListEntry(
                    value=entry_data["value"],
                    entry_type=entry_data["entry_type"],
                    reason=entry_data.get("reason", ""),
                    added_by=added_by,
                    expires_at=expires_at,
                    metadata=entry_data.get("metadata", {}),
                )

                self.lists[list_type.value][entry.value] = entry
                success_count += 1

            except Exception as e:
                logger.error("Failed to add bulk entry", error=str(e), entry=entry_data)
                failure_count += 1

        if success_count > 0:
            self._save_list(list_type)

        logger.info(
            "Bulk add completed",
            list_type=list_type.value,
            success=success_count,
            failure=failure_count,
        )

        return {"success": success_count, "failure": failure_count}

    def export_list(self, list_type: ListType, format_type: str = "json") -> str:
        """
        Export a list in the specified format.

        Args:
            list_type: Type of list to export
            format_type: Export format (currently only 'json' supported)

        Returns:
            Exported list as string
        """
        if format_type == "json":
            entries = self.list_entries(list_type, include_expired=True)
            data = {
                "list_type": list_type.value,
                "exported_at": datetime.now().isoformat(),
                "entries": entries,
            }
            return json.dumps(data, indent=2)
        else:
            raise ValueError(f"Unsupported export format: {format_type}")

    def import_list(self, list_type: ListType, data: str, format_type: str = "json", merge: bool = True) -> Dict[str, int]:
        """
        Import a list from data string.

        Args:
            list_type: Type of list to import into
            data: The data string to import
            format_type: Import format (currently only 'json' supported)
            merge: If True, merge with existing list; if False, replace

        Returns:
            Dictionary with import statistics
        """
        if format_type == "json":
            try:
                import_data = json.loads(data)
                entries = import_data.get("entries", [])

                if not merge:
                    # Clear existing list
                    self.lists[list_type.value].clear()

                # Convert to bulk add format
                bulk_entries = []
                for entry_data in entries:
                    bulk_entries.append({
                        "value": entry_data["value"],
                        "entry_type": entry_data["entry_type"],
                        "reason": entry_data.get("reason", ""),
                        "expires_in_days": None,  # Will be set from expires_at if present
                        "metadata": entry_data.get("metadata", {}),
                    })

                return self.bulk_add_entries(list_type, bulk_entries, added_by="import")
            except json.JSONDecodeError as e:
                logger.error("Failed to parse import data", error=str(e))
                return {"success": 0, "failure": 1}
        else:
            raise ValueError(f"Unsupported import format: {format_type}")
