"""
Shared HTTP client pool for memory optimization.
"""

import asyncio
from typing import Optional

import httpx


class SharedClientPool:
    """
    Shared HTTP client pool to optimize memory usage across providers.
    """

    def __init__(self, max_clients: int = 50, timeout: float = 30.0):
        """
        Initialize the shared client pool.

        Args:
            max_clients: Maximum number of clients in the pool
            timeout: Request timeout in seconds
        """
        self.max_clients = max_clients
        self.timeout = timeout
        self._clients: dict[str, httpx.AsyncClient] = {}
        self._lock = asyncio.Lock()

    async def get_client(self, client_id: str) -> httpx.AsyncClient:
        """
        Get or create a client for the given ID.

        Args:
            client_id: Unique identifier for the client

        Returns:
            HTTP client instance
        """
        async with self._lock:
            if client_id not in self._clients:
                if len(self._clients) >= self.max_clients:
                    # Remove oldest client if at capacity
                    oldest_id = next(iter(self._clients))
                    await self._clients[oldest_id].aclose()
                    del self._clients[oldest_id]

                # Create new optimized client
                self._clients[client_id] = httpx.AsyncClient(
                    timeout=httpx.Timeout(self.timeout, connect=10.0),
                    limits=httpx.Limits(
                        max_keepalive_connections=10,
                        max_connections=50,
                        keepalive_expiry=30.0
                    ),
                    headers={"Connection": "keep-alive"}
                )

            return self._clients[client_id]

    async def close_all(self):
        """Close all clients in the pool."""
        async with self._lock:
            close_tasks = [client.aclose() for client in self._clients.values()]
            await asyncio.gather(*close_tasks, return_exceptions=True)
            self._clients.clear()


# Global client pool instance
_shared_pool: Optional[SharedClientPool] = None


def get_shared_client_pool() -> SharedClientPool:
    """Get the global shared client pool instance."""
    global _shared_pool
    if _shared_pool is None:
        _shared_pool = SharedClientPool()
    return _shared_pool
