"""
Redis-based caching for performance optimization.
"""

import hashlib
import json
import time
from typing import Any, Dict, Optional

import redis


class CacheManager:
    """
    Redis-based cache manager for LLM responses and other data.
    """

    def __init__(self, redis_client: Optional[redis.Redis] = None, ttl: int = 3600):
        """
        Initialize cache manager.

        Args:
            redis_client: Redis client instance
            ttl: Default time-to-live in seconds (1 hour)
        """
        self.redis = redis_client
        self.default_ttl = ttl

    def _get_cache_key(self, key_data: Dict[str, Any]) -> str:
        """Generate a deterministic cache key from request data."""
        # Sort keys for consistent hashing
        sorted_data = json.dumps(key_data, sort_keys=True)
        # MD5 is used here only as a fast, deterministic cache key fingerprint.
        # It is NOT used for any security or cryptographic purpose.
        return f"koreshield:cache:{hashlib.md5(sorted_data.encode(), usedforsecurity=False).hexdigest()}"

    async def get(self, key_data: Dict[str, Any]) -> Optional[Dict[str, Any]]:
        """
        Get cached response.

        Args:
            key_data: Dictionary containing request parameters

        Returns:
            Cached response or None
        """
        if not self.redis:
            return None

        try:
            cache_key = self._get_cache_key(key_data)
            cached_data = self.redis.get(cache_key)

            if cached_data:
                # Check if cache entry has expiry metadata
                try:
                    data = json.loads(cached_data)
                    if isinstance(data, dict) and "expires_at" in data:
                        if time.time() > data["expires_at"]:
                            # Cache expired, remove it
                            self.redis.delete(cache_key)
                            return None
                        return data.get("response")
                    else:
                        # Legacy format without expiry
                        return data
                except json.JSONDecodeError:
                    return None

        except Exception:
            # Cache miss on error
            pass

        return None

    async def set(self, key_data: Dict[str, Any], response: Dict[str, Any], ttl: Optional[int] = None):
        """
        Cache a response.

        Args:
            key_data: Dictionary containing request parameters
            response: Response to cache
            ttl: Time-to-live in seconds (uses default if None)
        """
        if not self.redis:
            return

        try:
            cache_key = self._get_cache_key(key_data)
            ttl_value = ttl or self.default_ttl

            # Store with expiry metadata for better control
            cache_data = {
                "response": response,
                "expires_at": time.time() + ttl_value,
                "cached_at": time.time()
            }

            self.redis.setex(cache_key, ttl_value, json.dumps(cache_data))

        except Exception:
            # Silently fail on cache write errors
            pass

    async def invalidate(self, key_data: Dict[str, Any]):
        """
        Invalidate a specific cache entry.

        Args:
            key_data: Dictionary containing request parameters
        """
        if not self.redis:
            return

        try:
            cache_key = self._get_cache_key(key_data)
            self.redis.delete(cache_key)
        except Exception:
            pass

    async def clear_all(self):
        """Clear all cached entries."""
        if not self.redis:
            return

        try:
            # Delete all keys matching the cache pattern
            cache_keys = self.redis.keys("koreshield:cache:*")
            if cache_keys:
                self.redis.delete(*cache_keys)
        except Exception:
            pass