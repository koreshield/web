#!/usr/bin/env python3
"""
Example: Using KoreShield with DeepSeek
"""

import os
from koreshield_sdk import KoreShieldClient

def main():
    # Set up API keys
    koreshield_key = os.getenv("KORESHIELD_API_KEY", "demo-key")
    deepseek_key = os.getenv("DEEPSEEK_API_KEY", "your-deepseek-key-here")

    # Initialize KoreShield client
    client = KoreShieldClient(
        api_key=koreshield_key,
        base_url="http://localhost:8000"  # Your KoreShield API URL
    )

    print("🛡️  KoreShield + DeepSeek Integration Demo")
    print("=" * 50)

    # Test prompt scanning
    test_prompt = "Hello, can you help me write a Python function?"

    try:
        print(f" Scanning prompt: '{test_prompt}'")
        result = client.scan_prompt(test_prompt)

        print("✅ Scan Result:"        print(f"   Safe: {result.is_safe}")
        print(f"   Threats detected: {len(result.threats)}")
        print(f"   Confidence: {result.confidence}")

        if result.threats:
            print("🚨 Threats found:")
            for threat in result.threats:
                print(f"   - {threat.type}: {threat.description}")

    except Exception as e:
        print(f"❌ Error: {e}")

    print("\n🔧 To use with actual DeepSeek API:")
    print("1. Set DEEPSEEK_API_KEY environment variable")
    print("2. Configure KoreShield to use DeepSeek (already done in config.yaml)")
    print("3. Restart KoreShield API")
    print("4. Your requests will be scanned and proxied to DeepSeek!")

if __name__ == "__main__":
    main()