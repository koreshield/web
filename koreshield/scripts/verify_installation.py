#!/usr/bin/env python3
"""
Verification script to check if LLM Firewall is properly installed and configured.
"""

import sys
import os
from pathlib import Path

def check_python_version():
    """Check Python version."""
    if sys.version_info < (3, 10):
        print("✗ Python 3.10 or higher is required")
        print(f"  Current version: {sys.version}")
        return False
    print(f"✓ Python version: {sys.version.split()[0]}")
    return True


def check_dependencies():
    """Check if required dependencies are installed."""
    required = [
        "fastapi",
        "uvicorn",
        "pydantic",
        "httpx",
        "yaml",
        "structlog"
    ]
    
    missing = []
    for package in required:
        try:
            __import__(package.replace("-", "_"))
            print(f"✓ {package} installed")
        except ImportError:
            print(f"✗ {package} not installed")
            missing.append(package)
    
    if missing:
        print(f"\n  Install missing packages: pip install {' '.join(missing)}")
        return False
    return True


def check_config_file():
    """Check if configuration file exists."""
    config_path = Path("config/config.yaml")
    example_path = Path("config/config.example.yaml")
    
    if config_path.exists():
        print(f"✓ Configuration file found: {config_path}")
        return True
    elif example_path.exists():
        print(f"⚠ Configuration file not found, but example exists: {example_path}")
        print(f"  Copy it: cp {example_path} {config_path}")
        return False
    else:
        print("✗ No configuration file found")
        return False


def check_api_key():
    """Check if API key is set."""
    api_key = os.getenv("OPENAI_API_KEY")
    if api_key:
        print("✓ OPENAI_API_KEY environment variable is set")
        return True
    else:
        print("⚠ OPENAI_API_KEY environment variable not set")
        print("  Set it: export OPENAI_API_KEY=your-key-here")
        return False


def check_project_structure():
    """Check if project structure is correct."""
    required_dirs = [
        "src/firewall",
        "src/providers",
        "tests",
        "config"
    ]
    
    all_exist = True
    for dir_path in required_dirs:
        if Path(dir_path).exists():
            print(f"✓ {dir_path}/ exists")
        else:
            print(f"✗ {dir_path}/ missing")
            all_exist = False
    
    return all_exist


def main():
    """Run all verification checks."""
    print("LLM Firewall Community - Installation Verification")
    print("=" * 60)
    print()
    
    checks = [
        ("Python Version", check_python_version),
        ("Dependencies", check_dependencies),
        ("Project Structure", check_project_structure),
        ("Configuration File", check_config_file),
        ("API Key", check_api_key),
    ]
    
    results = []
    for name, check_func in checks:
        print(f"\n{name}:")
        result = check_func()
        results.append(result)
    
    print("\n" + "=" * 60)
    print("Summary:")
    
    if all(results):
        print("✓ All checks passed! Installation looks good.")
        print("\nYou can start the firewall with:")
        print("  python -m src.koreshield.main")
        print("\nOr use the CLI:")
        print("  python -m src.koreshield.cli start")
        return 0
    else:
        print("✗ Some checks failed. Please fix the issues above.")
        return 1


if __name__ == "__main__":
    sys.exit(main())

