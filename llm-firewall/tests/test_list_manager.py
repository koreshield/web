"""
Tests for the blocklist/allowlist manager.
"""

import pytest
import tempfile
import os
from datetime import datetime, timedelta
from koreshield.list_manager import ListManager, ListType, ListEntry


class TestListManager:
    """Test cases for the list manager."""

    def setup_method(self):
        """Set up test environment."""
        self.temp_dir = tempfile.mkdtemp()
        self.config = {"storage_path": self.temp_dir}

    def teardown_method(self):
        """Clean up test environment."""
        import shutil
        shutil.rmtree(self.temp_dir, ignore_errors=True)

    def test_list_manager_initialization(self):
        """Test list manager initializes correctly."""
        manager = ListManager(self.config)
        assert manager.lists[ListType.BLOCKLIST.value] == {}
        assert manager.lists[ListType.ALLOWLIST.value] == {}

    def test_add_entry_to_blocklist(self):
        """Test adding an entry to the blocklist."""
        manager = ListManager(self.config)

        success = manager.add_entry(
            ListType.BLOCKLIST,
            "malicious.com",
            "domain",
            "Known malicious domain",
            "admin",
            30,  # expires in 30 days
        )

        assert success
        entry = manager.check_entry(ListType.BLOCKLIST, "malicious.com")
        assert entry is not None
        assert entry.value == "malicious.com"
        assert entry.entry_type == "domain"
        assert entry.reason == "Known malicious domain"
        assert entry.added_by == "admin"
        assert not entry.is_expired()

    def test_add_entry_to_allowlist(self):
        """Test adding an entry to the allowlist."""
        manager = ListManager(self.config)

        success = manager.add_entry(
            ListType.ALLOWLIST,
            "trusted.com",
            "domain",
            "Trusted domain",
            "admin",
        )

        assert success
        entry = manager.check_entry(ListType.ALLOWLIST, "trusted.com")
        assert entry is not None
        assert entry.value == "trusted.com"

    def test_remove_entry(self):
        """Test removing an entry from lists."""
        manager = ListManager(self.config)

        # Add entry
        manager.add_entry(ListType.BLOCKLIST, "test.com", "domain", "Test")

        # Verify it exists
        assert manager.check_entry(ListType.BLOCKLIST, "test.com") is not None

        # Remove entry
        assert manager.remove_entry(ListType.BLOCKLIST, "test.com")

        # Verify it's gone
        assert manager.check_entry(ListType.BLOCKLIST, "test.com") is None

        # Try to remove non-existent entry
        assert not manager.remove_entry(ListType.BLOCKLIST, "nonexistent.com")

    def test_expired_entries(self):
        """Test handling of expired entries."""
        manager = ListManager(self.config)

        # Add entry that expires immediately
        past_time = datetime.now() - timedelta(days=1)
        entry = ListEntry(
            value="expired.com",
            entry_type="domain",
            reason="Expired entry",
            added_by="admin",
            expires_at=past_time,
        )
        manager.lists[ListType.BLOCKLIST.value]["expired.com"] = entry

        # Check that it's considered expired
        retrieved_entry = manager.check_entry(ListType.BLOCKLIST, "expired.com")
        assert retrieved_entry is None

    def test_list_entries(self):
        """Test listing entries with filters."""
        manager = ListManager(self.config)

        # Add various entries
        manager.add_entry(ListType.BLOCKLIST, "bad1.com", "domain", "Bad domain 1")
        manager.add_entry(ListType.BLOCKLIST, "bad2.com", "domain", "Bad domain 2")
        manager.add_entry(ListType.BLOCKLIST, "192.168.1.1", "ip", "Bad IP")

        # List all blocklist entries
        entries = manager.list_entries(ListType.BLOCKLIST)
        assert len(entries) == 3

        # List only domain entries
        domain_entries = manager.list_entries(ListType.BLOCKLIST, entry_type="domain")
        assert len(domain_entries) == 2
        assert all(e["entry_type"] == "domain" for e in domain_entries)

    def test_persistence(self):
        """Test that entries persist across manager instances."""
        # Create first manager and add entries
        manager1 = ListManager(self.config)
        manager1.add_entry(ListType.BLOCKLIST, "persistent.com", "domain", "Persistent entry")

        # Create second manager with same config
        manager2 = ListManager(self.config)

        # Second manager should load the entry
        entry = manager2.check_entry(ListType.BLOCKLIST, "persistent.com")
        assert entry is not None
        assert entry.value == "persistent.com"

    def test_bulk_add_entries(self):
        """Test bulk adding multiple entries."""
        manager = ListManager(self.config)

        entries = [
            {"value": "bulk1.com", "entry_type": "domain", "reason": "Bulk 1"},
            {"value": "bulk2.com", "entry_type": "domain", "reason": "Bulk 2"},
            {"value": "192.168.1.1", "entry_type": "ip", "reason": "Bulk IP"},
        ]

        result = manager.bulk_add_entries(ListType.BLOCKLIST, entries, "bulk_user")

        assert result["success"] == 3
        assert result["failure"] == 0

        # Verify entries were added
        assert manager.check_entry(ListType.BLOCKLIST, "bulk1.com") is not None
        assert manager.check_entry(ListType.BLOCKLIST, "bulk2.com") is not None
        assert manager.check_entry(ListType.BLOCKLIST, "192.168.1.1") is not None

    def test_bulk_add_with_failures(self):
        """Test bulk add with some failures."""
        manager = ListManager(self.config)

        entries = [
            {"value": "good.com", "entry_type": "domain", "reason": "Good entry"},
            {"invalid": "missing required fields"},  # This should fail
        ]

        result = manager.bulk_add_entries(ListType.BLOCKLIST, entries, "test_user")

        assert result["success"] == 1
        assert result["failure"] == 1

    def test_get_stats(self):
        """Test getting list statistics."""
        manager = ListManager(self.config)

        # Add some entries
        manager.add_entry(ListType.BLOCKLIST, "blocked1.com", "domain", "Blocked 1")
        manager.add_entry(ListType.BLOCKLIST, "blocked2.com", "domain", "Blocked 2")
        manager.add_entry(ListType.BLOCKLIST, "192.168.1.1", "ip", "Blocked IP")

        manager.add_entry(ListType.ALLOWLIST, "allowed.com", "domain", "Allowed")

        stats = manager.get_stats()

        assert stats[ListType.BLOCKLIST.value]["total_entries"] == 3
        assert stats[ListType.BLOCKLIST.value]["active_entries"] == 3
        assert stats[ListType.BLOCKLIST.value]["entry_types"]["domain"] == 2
        assert stats[ListType.BLOCKLIST.value]["entry_types"]["ip"] == 1

        assert stats[ListType.ALLOWLIST.value]["total_entries"] == 1
        assert stats[ListType.ALLOWLIST.value]["active_entries"] == 1

    def test_export_import_list(self):
        """Test exporting and importing lists."""
        manager = ListManager(self.config)

        # Add entries
        manager.add_entry(ListType.BLOCKLIST, "export1.com", "domain", "Export test 1")
        manager.add_entry(ListType.BLOCKLIST, "export2.com", "domain", "Export test 2")

        # Export
        exported_data = manager.export_list(ListType.BLOCKLIST)
        assert '"list_type": "blocklist"' in exported_data
        assert "export1.com" in exported_data
        assert "export2.com" in exported_data

        # Create new manager and import
        manager2 = ListManager({"storage_path": self.temp_dir + "/import"})
        result = manager2.import_list(ListType.BLOCKLIST, exported_data)

        assert result["success"] == 2
        assert result["failure"] == 0

        # Verify imported entries
        assert manager2.check_entry(ListType.BLOCKLIST, "export1.com") is not None
        assert manager2.check_entry(ListType.BLOCKLIST, "export2.com") is not None
