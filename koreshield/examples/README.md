# Examples

This directory contains example code showing how to use KoreShield.

## Basic Usage

See `basic_usage.py` for examples of:
- Sending safe requests through the firewall
- Testing attack detection (malicious requests)

## Running Examples

1. Start the firewall:
   ```bash
   python -m src.firewall.main
   ```

2. Set your OpenAI API key:
   ```bash
   export OPENAI_API_KEY=your-api-key-here
   ```

3. Run the example:
   ```bash
   python examples/basic_usage.py
   ```

## Testing Attack Detection

The firewall will block requests containing:
- "Ignore all previous instructions"
- "Forget everything"
- "You are now"
- Other common prompt injection patterns

Try modifying the examples to test different attack patterns!

