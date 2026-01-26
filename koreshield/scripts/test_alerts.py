#!/usr/bin/env python3
"""
Alert Delivery Test Script for KoreShield

This script tests alert delivery across all configured channels.
Run this after configuring your alert channels in config.yaml.
"""

import asyncio
import sys
import os
from pathlib import Path

# Add src to path for imports
sys.path.insert(0, str(Path(__file__).parent.parent / "src"))

from koreshield.monitoring import AlertManager, AlertRule
from koreshield.config import Config
import structlog

logger = structlog.get_logger()

async def run_alert_delivery_test():
    """Test alert delivery for all configured channels."""

    print("Loading KoreShield configuration...")
    try:
        config = Config()
        config.load()
    except Exception as e:
        print(f"Failed to load config: {e}")
        return False

    if not config.monitoring.alerts.enabled:
        print("Alerting is not enabled in configuration")
        return False

    print("Initializing AlertManager...")
    alert_manager = AlertManager(config.monitoring.alerts)

    # Test alert
    test_alert = {
        "name": "Test Alert",
        "message": "This is a test alert from KoreShield monitoring system",
        "severity": "info",
        "timestamp": "2024-01-01T00:00:00Z",
        "metrics": {
            "request_rate": 10.5,
            "error_rate": 0.02,
            "avg_latency": 2.1
        }
    }

    print("Testing alert delivery...")

    channels_tested = []
    channels_successful = []

    # Test each channel
    channels = config.monitoring.alerts.channels

    if channels.email.enabled:
        print("Testing Email delivery...")
        channels_tested.append("email")
        try:
            await alert_manager._send_email_alert(test_alert)
            channels_successful.append("email")
            print("Email alert sent successfully")
        except Exception as e:
            print(f"Email alert failed: {e}")

    if channels.slack.enabled:
        print("Testing Slack delivery...")
        channels_tested.append("slack")
        try:
            await alert_manager._send_slack_alert(test_alert)
            channels_successful.append("slack")
            print("Slack alert sent successfully")
        except Exception as e:
            print(f"Slack alert failed: {e}")

    if channels.teams.enabled:
        print("Testing Microsoft Teams delivery...")
        channels_tested.append("teams")
        try:
            await alert_manager._send_teams_alert(test_alert)
            channels_successful.append("teams")
            print("Teams alert sent successfully")
        except Exception as e:
            print(f"Teams alert failed: {e}")

    if channels.pagerduty.enabled:
        print("Testing PagerDuty delivery...")
        channels_tested.append("pagerduty")
        try:
            await alert_manager._send_pagerduty_alert(test_alert)
            channels_successful.append("pagerduty")
            print("PagerDuty alert sent successfully")
        except Exception as e:
            print(f"PagerDuty alert failed: {e}")

    if channels.webhook.enabled:
        print("Testing Webhook delivery...")
        channels_tested.append("webhook")
        try:
            await alert_manager._send_webhook_alert(test_alert)
            channels_successful.append("webhook")
            print("Webhook alert sent successfully")
        except Exception as e:
            print(f"Webhook alert failed: {e}")

    # Summary
    print("\nTest Results:")
    print(f"Channels tested: {len(channels_tested)}")
    print(f"Channels successful: {len(channels_successful)}")
    print(f"Success rate: {len(channels_successful)}/{len(channels_tested)}")

    if channels_successful:
        print(f"Successful channels: {', '.join(channels_successful)}")

    if len(channels_successful) < len(channels_tested):
        failed_channels = [ch for ch in channels_tested if ch not in channels_successful]
        print(f"Failed channels: {', '.join(failed_channels)}")
        print("\nTroubleshooting tips:")
        print("- Check your configuration in config.yaml")
        print("- Verify API keys, webhook URLs, and credentials")
        print("- Check KoreShield logs for detailed error messages")
        print("- Ensure network connectivity to external services")
        return False

    print("\nAll alert channels tested successfully!")
    return True

async def main():
    """Main test function."""
    print("KoreShield Alert Delivery Test")
    print("=" * 40)

    success = await run_alert_delivery_test()

    if success:
        print("\nAlert delivery test completed successfully!")
        sys.exit(0)
    else:
        print("\nAlert delivery test failed!")
        sys.exit(1)

if __name__ == "__main__":
    asyncio.run(main())