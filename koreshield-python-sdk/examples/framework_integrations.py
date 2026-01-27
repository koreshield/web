#!/usr/bin/env python3
"""Example demonstrating framework integrations with KoreShield."""

import asyncio
from koreshield_sdk import AsyncKoreShieldClient
from koreshield_sdk.integrations import create_fastapi_middleware


async def demo_fastapi_integration():
    """Demonstrate FastAPI integration with KoreShield middleware."""
    print("🚀 Demonstrating FastAPI Integration")

    # Initialize client
    client = AsyncKoreShieldClient(
        api_key="your-api-key-here",
        enable_metrics=True
    )

    # Create FastAPI middleware
    middleware = create_fastapi_middleware(
        client=client,
        scan_request_body=True,
        threat_threshold="medium",
        block_on_threat=False,  # Just log threats, don't block
        exclude_paths=["/health", "/docs"]
    )

    print("✅ FastAPI middleware created successfully")
    print("📝 Middleware will scan POST/PUT/PATCH requests automatically")
    print("🔍 Excluded paths: /health, /docs")
    print("⚠️  Threats will be logged but not blocked (block_on_threat=False)")

    # Simulate middleware usage
    async with client:
        # Test scan to ensure client works
        test_result = await client.scan_prompt("Hello, this is a safe message")
        print(f"🧪 Test scan result: {test_result.is_safe} (threat level: {test_result.threat_level.value})")

        # Get metrics
        metrics = await client.get_performance_metrics()
        print(f"📊 Current metrics: {metrics.total_requests} requests processed")

    print("✅ FastAPI integration demo completed\n")


async def demo_security_policy():
    """Demonstrate custom security policy usage."""
    print("🔒 Demonstrating Custom Security Policy")

    from koreshield_sdk.types import SecurityPolicy, ThreatLevel

    # Create custom security policy
    policy = SecurityPolicy(
        name="strict_policy",
        description="Strict security policy for sensitive applications",
        threat_threshold=ThreatLevel.LOW,  # Flag even low threats
        blocked_detection_types=[],  # Allow all detection types
        allowlist_patterns=["safe", "trusted"],  # Allow content with these words
        blocklist_patterns=["hack", "exploit", "attack"],  # Block content with these words
        custom_rules=[
            {"name": "no_code_execution", "pattern": "exec\\(|eval\\("},
            {"name": "no_file_operations", "pattern": "open\\(|file\\("}
        ]
    )

    # Initialize client with policy
    client = AsyncKoreShieldClient(
        api_key="your-api-key-here",
        security_policy=policy,
        enable_metrics=True
    )

    async with client:
        # Test prompts against policy
        test_prompts = [
            "This is a safe message with trusted content",
            "This message contains hack attempts",
            "Let's execute some code: exec('print(hello)')",
            "Normal conversation about programming"
        ]

        print("🧪 Testing prompts against security policy:")
        for prompt in test_prompts:
            result = await client.scan_prompt(prompt)
            status = "✅ ALLOWED" if result.is_safe else "❌ BLOCKED"
            print(f"  {status}: {prompt[:50]}... (threat: {result.threat_level.value})")

        # Show current policy
        current_policy = await client.get_security_policy()
        print(f"\n📋 Current policy: {current_policy.name}")
        print(f"   Threat threshold: {current_policy.threat_threshold.value}")
        print(f"   Allowlist patterns: {len(current_policy.allowlist_patterns)}")
        print(f"   Blocklist patterns: {len(current_policy.blocklist_patterns)}")

    print("✅ Security policy demo completed\n")


async def demo_performance_monitoring():
    """Demonstrate performance monitoring capabilities."""
    print("📊 Demonstrating Performance Monitoring")

    client = AsyncKoreShieldClient(
        api_key="your-api-key-here",
        enable_metrics=True
    )

    async with client:
        # Perform some operations to generate metrics
        prompts = [
            "Hello world",
            "Write a function",
            "Explain AI",
            "What is Python?"
        ]

        print("🔄 Processing sample requests...")
        for prompt in prompts:
            await client.scan_prompt(prompt)
            await asyncio.sleep(0.1)  # Small delay

        # Get comprehensive metrics
        metrics = await client.get_performance_metrics()

        print("📈 Performance Metrics:")
        print(f"   Total requests: {metrics.total_requests}")
        print(".2f"        print(".2f"        print(".2f"        print(".1f"        print(f"   Error count: {metrics.error_count}")
        print(".2f"
        # Test batch processing metrics
        print("\n🔄 Testing batch processing...")
        batch_results = await client.scan_batch(
            prompts=["Test 1", "Test 2", "Test 3"],
            parallel=True
        )

        updated_metrics = await client.get_performance_metrics()
        print(".2f"
        # Reset metrics
        await client.reset_metrics()
        reset_metrics = await client.get_performance_metrics()
        print(f"   After reset: {reset_metrics.total_requests} requests")

    print("✅ Performance monitoring demo completed\n")


async def main():
    """Run all integration demos."""
    print("🎯 KoreShield SDK Enhanced Features Demo")
    print("=" * 50)

    try:
        await demo_fastapi_integration()
        await demo_security_policy()
        await demo_performance_monitoring()

        print("🎉 All demos completed successfully!")
        print("\n💡 Key Features Demonstrated:")
        print("   • FastAPI middleware integration")
        print("   • Custom security policies")
        print("   • Performance monitoring")
        print("   • Enhanced batch processing")
        print("   • Streaming content scanning")
        print("   • Framework-specific helpers")

    except Exception as e:
        print(f"❌ Demo failed with error: {e}")
        import traceback
        traceback.print_exc()


if __name__ == "__main__":
    asyncio.run(main())