#!/usr/bin/env python3
"""Example demonstrating enhanced batch processing with progress tracking."""

import asyncio
import time
from koreshield_sdk import AsyncKoreShieldClient


async def progress_callback(current: int, total: int):
    """Progress callback for batch processing."""
    print(f"Processed {current}/{total} prompts ({current/total*100:.1f}%)")


async def main():
    """Demonstrate enhanced batch processing features."""
    # Initialize client with performance monitoring
    client = AsyncKoreShieldClient(
        api_key="your-api-key-here",
        enable_metrics=True
    )

    async with client:
        # Sample prompts for batch processing
        prompts = [
            "Hello, how are you?",
            "Write a Python function to calculate fibonacci numbers",
            "Explain quantum computing in simple terms",
            "What is the capital of France?",
            "Create a recipe for chocolate chip cookies",
            "Explain the theory of relativity",
            "Write a haiku about programming",
            "What are the benefits of exercise?",
            "Describe how photosynthesis works",
            "Write a SQL query to find duplicate records"
        ]

        print("🚀 Starting enhanced batch processing...")
        start_time = time.time()

        # Process batch with progress tracking and optimized concurrency
        results = await client.scan_batch(
            prompts=prompts,
            parallel=True,
            max_concurrent=5,
            batch_size=3,  # Process in smaller batches
            progress_callback=progress_callback
        )

        processing_time = time.time() - start_time

        # Analyze results
        safe_count = sum(1 for r in results if r.is_safe)
        unsafe_count = len(results) - safe_count

        print("
📊 Batch Processing Results:"        print(f"Total prompts: {len(prompts)}")
        print(f"Safe prompts: {safe_count}")
        print(f"Unsafe prompts: {unsafe_count}")
        print(".2f"        print(".2f"
        # Get performance metrics
        metrics = await client.get_performance_metrics()
        print("
📈 Performance Metrics:"        print(f"Total requests: {metrics.total_requests}")
        print(".2f"        print(".2f"        print(".2f"        print(".1f"
        # Show details of unsafe prompts
        if unsafe_count > 0:
            print("
⚠️  Unsafe Prompts Details:"            for i, (prompt, result) in enumerate(zip(prompts, results)):
                if not result.is_safe:
                    print(f"Prompt {i+1}: {prompt[:50]}...")
                    print(f"  Threat Level: {result.threat_level.value}")
                    print(f"  Confidence: {result.confidence:.2f}")
                    print(f"  Indicators: {len(result.indicators)}")
                    print()


if __name__ == "__main__":
    asyncio.run(main())