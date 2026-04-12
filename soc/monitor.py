#!/usr/bin/env python3
"""
KoreShield SOC Internal Monitor
================================
Continuously monitors the KoreShield production stack and sends Telegram
alerts on any degradation or outage.

Usage:
    python monitor.py                     # Run once (cron-friendly)
    python monitor.py --daemon            # Run continuously (every 60s)
    python monitor.py --report            # Dump full health JSON and exit

Environment variables (set in .env or export):
    KS_API_BASE       API base URL, default https://api.koreshield.com
    TELEGRAM_BOT_TOKEN  Telegram bot token for alerts
    TELEGRAM_CHAT_ID    Telegram chat ID for alerts
    MONITOR_INTERVAL    Poll interval in seconds, default 60
    ALERT_COOLDOWN      Seconds between repeat alerts for same issue, default 300
"""

import os
import sys
import json
import time
import socket
import argparse
import subprocess
import urllib.request
import urllib.error
from datetime import datetime, timezone
from pathlib import Path

# ─── Configuration ────────────────────────────────────────────────────────────
API_BASE        = os.getenv("KS_API_BASE", "https://api.koreshield.com")
TELEGRAM_TOKEN  = os.getenv("TELEGRAM_BOT_TOKEN", "")
TELEGRAM_CHAT   = os.getenv("TELEGRAM_CHAT_ID", "")
INTERVAL        = int(os.getenv("MONITOR_INTERVAL", "60"))
ALERT_COOLDOWN  = int(os.getenv("ALERT_COOLDOWN", "300"))

# State file to track last alert times (avoids repeat spam)
STATE_FILE = Path("/tmp/koreshield_monitor_state.json")

# ─── Helpers ──────────────────────────────────────────────────────────────────
def now_iso() -> str:
    return datetime.now(timezone.utc).strftime("%Y-%m-%dT%H:%M:%SZ")

def load_state() -> dict:
    if STATE_FILE.exists():
        try:
            return json.loads(STATE_FILE.read_text())
        except Exception:
            pass
    return {}

def save_state(state: dict):
    STATE_FILE.write_text(json.dumps(state))

def send_telegram(message: str):
    if not TELEGRAM_TOKEN or not TELEGRAM_CHAT:
        print(f"[ALERT] {message}")
        return
    url = f"https://api.telegram.org/bot{TELEGRAM_TOKEN}/sendMessage"
    payload = json.dumps({
        "chat_id": TELEGRAM_CHAT,
        "text": message,
        "parse_mode": "Markdown",
    }).encode()
    try:
        req = urllib.request.Request(url, data=payload, headers={"Content-Type": "application/json"})
        urllib.request.urlopen(req, timeout=10)
    except Exception as e:
        print(f"[TELEGRAM ERROR] {e}")

def alert(key: str, message: str, state: dict):
    """Send alert if cooldown has expired for this key."""
    last_alert = state.get(f"last_alert_{key}", 0)
    if time.time() - last_alert > ALERT_COOLDOWN:
        send_telegram(message)
        state[f"last_alert_{key}"] = time.time()
        print(f"[ALERT SENT] {key}: {message[:80]}")
    else:
        print(f"[ALERT SUPPRESSED] {key} (cooldown)")

def resolve(key: str, state: dict):
    """Send resolve notification if we previously alerted."""
    if state.get(f"last_alert_{key}", 0) > 0:
        send_telegram(f"✅ *RESOLVED* `{key}` — KoreShield production back to normal.\n_{now_iso()}_")
        state.pop(f"last_alert_{key}", None)
        print(f"[RESOLVED] {key}")

def http_get(url: str, timeout: int = 10) -> tuple[int, dict | None]:
    try:
        req = urllib.request.Request(url, headers={"User-Agent": "KoreShield-Monitor/1.0"})
        with urllib.request.urlopen(req, timeout=timeout) as resp:
            body = json.loads(resp.read().decode())
            return resp.status, body
    except urllib.error.HTTPError as e:
        return e.code, None
    except Exception:
        return 0, None


# ─── Checks ────────────────────────────────────────────────────────────────────

def check_api_health(state: dict) -> dict:
    """Check /health and /v1/status endpoints."""
    results = {}

    # Basic health
    code, body = http_get(f"{API_BASE}/health")
    if code == 200 and body and body.get("status") in ("ok", "healthy"):
        results["api_health"] = {"status": "ok", "code": code}
        resolve("api_health", state)
    else:
        results["api_health"] = {"status": "CRITICAL", "code": code}
        alert(
            "api_health",
            f"🚨 *CRITICAL* KoreShield API health check failed!\n"
            f"URL: `{API_BASE}/health`\nHTTP: `{code}`\nTime: `{now_iso()}`",
            state,
        )

    # Provider health — response shape: {"providers": {"deepseek": {..."status": "healthy"}, ...}}
    code2, body2 = http_get(f"{API_BASE}/health/providers")
    if code2 == 200 and body2:
        # Unwrap outer "providers" key if present
        providers_dict = body2.get("providers") if isinstance(body2.get("providers"), dict) else body2
        degraded = [
            k for k, v in providers_dict.items()
            if isinstance(v, dict)
            and v.get("enabled", True)  # skip disabled providers
            and v.get("status") not in ("ok", "healthy", "disabled", "unknown")
        ]
        if degraded:
            results["providers"] = {"status": "DEGRADED", "degraded": degraded}
            alert(
                "providers",
                f"⚠️ *DEGRADED* Provider(s) unhealthy: `{', '.join(degraded)}`\nTime: `{now_iso()}`",
                state,
            )
        else:
            results["providers"] = {"status": "ok"}
            resolve("providers", state)
    else:
        results["providers"] = {"status": "UNKNOWN", "code": code2}

    return results


def check_docker_services() -> dict:
    """Check all Docker Compose services are running (local VPS only)."""
    results = {}
    try:
        out = subprocess.check_output(
            ["docker", "ps", "--format", "{{.Names}}\t{{.Status}}"],
            stderr=subprocess.DEVNULL, timeout=10,
        ).decode()
        services = {}
        for line in out.strip().splitlines():
            parts = line.split("\t", 1)
            if len(parts) == 2:
                services[parts[0]] = parts[1]

        required = ["koreshield-api", "koreshield-web", "koreshield-postgres", "koreshield-redis", "koreshield-caddy"]
        for svc in required:
            match = next((v for k, v in services.items() if svc in k), None)
            if match and "Up" in match:
                results[svc] = {"status": "ok", "docker_status": match}
            else:
                results[svc] = {"status": "DOWN", "docker_status": match or "not found"}
    except Exception as e:
        results["docker"] = {"status": "UNKNOWN", "error": str(e)}
    return results


def check_disk_usage() -> dict:
    """Check disk usage on VPS."""
    try:
        out = subprocess.check_output(["df", "-h", "/"], stderr=subprocess.DEVNULL, timeout=5).decode()
        lines = out.strip().splitlines()
        if len(lines) >= 2:
            parts = lines[1].split()
            used_pct = int(parts[4].rstrip("%"))
            return {"status": "ok" if used_pct < 80 else ("WARN" if used_pct < 90 else "CRITICAL"),
                    "used_pct": used_pct, "used": parts[2], "avail": parts[3]}
    except Exception as e:
        pass
    return {"status": "UNKNOWN"}


def check_response_time(state: dict) -> dict:
    """Measure API response time."""
    start = time.time()
    code, _ = http_get(f"{API_BASE}/health", timeout=5)
    elapsed_ms = int((time.time() - start) * 1000)
    status = "ok"
    if elapsed_ms > 2000:
        status = "CRITICAL"
        alert("latency", f"🐌 *SLOW* API response time `{elapsed_ms}ms` (threshold: 2000ms)\n_{now_iso()}_", state)
    elif elapsed_ms > 800:
        status = "WARN"
        alert("latency_warn", f"⚠️ *WARN* API response time `{elapsed_ms}ms` (threshold: 800ms)\n_{now_iso()}_", state)
    else:
        resolve("latency", state)
        resolve("latency_warn", state)
    return {"status": status, "response_ms": elapsed_ms}


def check_ssl_cert() -> dict:
    """Check SSL cert expiry (days until expiry)."""
    try:
        import ssl
        hostname = API_BASE.replace("https://", "").replace("http://", "").split("/")[0]
        ctx = ssl.create_default_context()
        with ctx.wrap_socket(socket.create_connection((hostname, 443), timeout=5), server_hostname=hostname) as s:
            cert = s.getpeercert()
            expire_str = cert["notAfter"]  # e.g. "Apr 30 12:00:00 2026 GMT"
            expire_dt = datetime.strptime(expire_str, "%b %d %H:%M:%S %Y %Z").replace(tzinfo=timezone.utc)
            days_left = (expire_dt - datetime.now(timezone.utc)).days
            return {"status": "ok" if days_left > 14 else "WARN", "days_until_expiry": days_left}
    except Exception as e:
        return {"status": "UNKNOWN", "error": str(e)}


# ─── Full health report ────────────────────────────────────────────────────────

def run_checks(state: dict) -> dict:
    ts = now_iso()
    report = {
        "timestamp": ts,
        "api_health": check_api_health(state),
        "response_time": check_response_time(state),
        "docker": check_docker_services(),
        "disk": check_disk_usage(),
        "ssl": check_ssl_cert(),
    }

    # Overall status
    all_statuses = []
    def collect(obj):
        if isinstance(obj, dict):
            if "status" in obj:
                all_statuses.append(obj["status"])
            for v in obj.values():
                collect(v)
    collect(report)

    if any(s == "CRITICAL" for s in all_statuses):
        report["overall"] = "CRITICAL"
    elif any(s in ("WARN", "DEGRADED", "DOWN") for s in all_statuses):
        report["overall"] = "WARN"
    elif any(s == "UNKNOWN" for s in all_statuses):
        report["overall"] = "UNKNOWN"
    else:
        report["overall"] = "HEALTHY"

    # Alert on any critical Docker service down
    for svc, info in report["docker"].items():
        if isinstance(info, dict) and info.get("status") == "DOWN":
            alert(
                f"docker_{svc}",
                f"🚨 *DOWN* Docker service `{svc}` is not running!\nTime: `{ts}`",
                state,
            )
        elif isinstance(info, dict) and info.get("status") == "ok":
            resolve(f"docker_{svc}", state)

    # Alert on disk
    disk = report["disk"]
    if disk.get("status") == "CRITICAL":
        alert("disk", f"💾 *DISK FULL* Usage at `{disk.get('used_pct')}%`!\nTime: `{ts}`", state)
    elif disk.get("status") == "WARN":
        alert("disk_warn", f"⚠️ *DISK WARN* Usage at `{disk.get('used_pct')}%`.\nTime: `{ts}`", state)

    # Alert on SSL
    ssl_info = report["ssl"]
    if ssl_info.get("days_until_expiry", 999) <= 14:
        alert("ssl", f"🔒 *SSL EXPIRING* Certificate expires in `{ssl_info.get('days_until_expiry')} days`!\nTime: `{ts}`", state)

    return report


# ─── Entrypoint ────────────────────────────────────────────────────────────────

def main():
    parser = argparse.ArgumentParser(description="KoreShield SOC Monitor")
    parser.add_argument("--daemon", action="store_true", help="Run continuously on MONITOR_INTERVAL")
    parser.add_argument("--report", action="store_true", help="Print full health JSON and exit")
    parser.add_argument("--test-alert", action="store_true", help="Send a test alert and exit immediately")
    args = parser.parse_args()

    if args.test_alert:
        test_message = f"✅ *KoreShield SOC Monitor Test* — This is a test alert.\nAPI Base: `{API_BASE}`\nTime: `{now_iso()}`"
        send_telegram(test_message)
        print("[OK] Test alert sent successfully")
        sys.exit(0)

    if args.daemon:
        print(f"[KoreShield Monitor] Starting daemon (interval={INTERVAL}s)")
        while True:
            state = load_state()
            report = run_checks(state)
            save_state(state)
            print(json.dumps({"overall": report["overall"], "ts": report["timestamp"]}))
            time.sleep(INTERVAL)
    else:
        state = load_state()
        report = run_checks(state)
        save_state(state)
        if args.report:
            print(json.dumps(report, indent=2))
        else:
            print(f"[{report['timestamp']}] Overall: {report['overall']}")


if __name__ == "__main__":
    main()
