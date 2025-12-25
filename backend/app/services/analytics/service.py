import aioredis
from datetime import datetime
from config import settings

class AnalyticsService:
    def __init__(self, redis_url: str):
        self.redis = aioredis.from_url(redis_url, encoding="utf8", decode_responses=True)

    async def increment_view_count(self, post_id: str, ip_address: str):
        """
        Increments unique view count for a post using HyperLogLog.
        Returns True if the view is unique, False otherwise.
        """
        key = f"post:{post_id}:views:hll"
        
        # Add IP to HyperLogLog
        # PFADD key element
        # Returns 1 if element was added (unique), 0 if already exists
        is_unique = await self.redis.pfadd(key, ip_address)
        
        return is_unique == 1

    async def get_unique_view_count(self, post_id: str) -> int:
        """
        Returns the estimated unique view count for a post.
        """
        key = f"post:{post_id}:views:hll"
        count = await self.redis.pfcount(key)
        return count

    async def record_visit(self, post_id: str):
        """
        Records a visit timestamp for daily stats (Sorted Set).
        """
        today = datetime.utcnow().strftime("%Y-%m-%d")
        key = f"post:{post_id}:visits:{today}"
        
        # Increment daily counter
        await self.redis.incr(key)
        # Set expiry for 30 days
        await self.redis.expire(key, 60*60*24*30)

analytics_service = AnalyticsService(settings.REDIS_URL)
