"""Simple in-memory cache with TTL for fast data retrieval."""
from time import time
from typing import Any, Dict, Optional
from functools import wraps

_cache: Dict[str, tuple[Any, float]] = {}
DEFAULT_TTL = 60  # 60 seconds


def cache_get(key: str) -> Optional[Any]:
    """Get value from cache if not expired."""
    if key in _cache:
        value, expiry = _cache[key]
        if time() < expiry:
            return value
        else:
            del _cache[key]
    return None


def cache_set(key: str, value: Any, ttl: int = DEFAULT_TTL) -> None:
    """Set value in cache with TTL."""
    _cache[key] = (value, time() + ttl)


def cache_clear(key: str = None) -> None:
    """Clear cache entry or all cache."""
    if key:
        _cache.pop(key, None)
    else:
        _cache.clear()


def cached(ttl: int = DEFAULT_TTL):
    """Decorator for caching function results."""
    def decorator(func):
        @wraps(func)
        async def async_wrapper(*args, **kwargs):
            cache_key = f"{func.__name__}:{args}:{kwargs}"
            cached_result = cache_get(cache_key)
            if cached_result is not None:
                return cached_result
            result = await func(*args, **kwargs)
            cache_set(cache_key, result, ttl)
            return result
        return async_wrapper
    return decorator
