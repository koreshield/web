
# KoreShield Django Integration Example

This example demonstrates how to integrate KoreShield with **Django** using custom middleware.

## Setup

1.  Copy `middleware.py` to your Django app (e.g., `myapp/middleware.py`).
2.  Install dependencies:
    ```bash
    pip install django koreshield
    ```

## Configuration

Add the following to your `settings.py`:

```python
MIDDLEWARE = [
    # ... other middleware ...
    'myapp.middleware.KoreShieldMiddleware',
]

KORESHIELD_URL = "http://localhost:8000"
KORESHIELD_PROTECTED_PATHS = ["/api/chat", "/api/generate"]
```

## Usage

Any `POST` request to the paths listed in `KORESHIELD_PROTECTED_PATHS` will be automatically inspected. The middleware expects a JSON body with `message` or `prompt` keys.

## Async Views

For Django 3.1+ async views, you should implement an `__acall__` method in the middleware to avoid blocking the event loop. This example uses `asyncio.run` which is suitable for synchronous views but not optimal for high-performance async deployments.
