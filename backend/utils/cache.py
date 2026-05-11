import json
import logging
from flask import current_app

logger = logging.getLogger(__name__)

_redis_client = None


def get_redis_client():
    global _redis_client
    if _redis_client is not None:
        return _redis_client
    try:
        from upstash_redis import Redis
        url = current_app.config.get('UPSTASH_REDIS_REST_URL', '')
        token = current_app.config.get('UPSTASH_REDIS_REST_TOKEN', '')
        if not url or not token:
            return None
        _redis_client = Redis(url=url, token=token)
        return _redis_client
    except Exception as e:
        logger.warning(f"Redis init failed: {e}")
        return None


def cache_get(key):
    try:
        r = get_redis_client()
        if r is None:
            return None
        value = r.get(key)
        if value is None:
            return None
        return json.loads(value)
    except Exception as e:
        logger.warning(f"cache_get({key}) failed: {e}")
        return None


def cache_set(key, value, ttl=300):
    try:
        r = get_redis_client()
        if r is None:
            return False
        r.set(key, json.dumps(value, default=str), ex=ttl)
        return True
    except Exception as e:
        logger.warning(f"cache_set({key}) failed: {e}")
        return False


def cache_delete(key):
    try:
        r = get_redis_client()
        if r is None:
            return False
        r.delete(key)
        return True
    except Exception as e:
        logger.warning(f"cache_delete({key}) failed: {e}")
        return False


def cache_delete_pattern(pattern):
    try:
        r = get_redis_client()
        if r is None:
            return False
        keys = r.keys(pattern)
        if keys:
            for k in keys:
                r.delete(k)
        return True
    except Exception as e:
        logger.warning(f"cache_delete_pattern({pattern}) failed: {e}")
        return False
