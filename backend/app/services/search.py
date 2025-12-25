import logging
from typing import List, Optional, Dict, Any
from elasticsearch import AsyncElasticsearch
from config import settings

logger = logging.getLogger(__name__)

class SearchService:
    def __init__(self):
        self.client = AsyncElasticsearch(settings.ELASTICSEARCH_URL)
        self.index_name = "lumen_posts"

    async def initialize_index(self):
        """Create index with mappings if not exists"""
        exists = await self.client.indices.exists(index=self.index_name)
        if not exists:
            # Define mapping for posts
            mapping = {
                "mappings": {
                    "properties": {
                        "id": {"type": "keyword"},
                        "title": {
                            "type": "text",
                            "analyzer": "standard",
                            "fields": {
                                "keyword": {"type": "keyword"}
                            }
                        },
                        "subtitle": {"type": "text"},
                        "content_text": {"type": "text"},  # Flattened plain text content
                        "slug": {"type": "keyword"},
                        "author_id": {"type": "keyword"},
                        "author_username": {"type": "keyword"},
                        "author_full_name": {"type": "text"},
                        "tags": {"type": "keyword"},
                        "created_at": {"type": "date"},
                        "status": {"type": "keyword"}
                    }
                }
            }
            await self.client.indices.create(index=self.index_name, body=mapping)
            logger.info(f"Created Elasticsearch index: {self.index_name}")

    async def index_post(self, post: Dict[str, Any]):
        """Index or update a post document"""
        try:
            doc = {
                "id": str(post.get("id")),
                "title": post.get("title"),
                "subtitle": post.get("subtitle"),
                "content_text": post.get("content_text", ""), # Needs pre-processing to extract text from JSON blocks
                "slug": post.get("slug"),
                "author_id": str(post.get("author_id")),
                "author_username": post.get("author", {}).get("username"),
                "author_full_name": post.get("author", {}).get("full_name"),
                "tags": [tag.name for tag in post.get("tags", [])],
                "created_at": post.get("created_at"),
                "status": post.get("status")
            }
            
            await self.client.index(index=self.index_name, id=doc["id"], document=doc)
        except Exception as e:
            logger.error(f"Error indexing post {post.get('id')}: {e}")

    async def delete_post(self, post_id: str):
        """Remove post from index"""
        try:
            await self.client.delete(index=self.index_name, id=str(post_id), ignore=[404])
        except Exception as e:
            logger.error(f"Error deleting post {post_id} from index: {e}")

    async def search_posts(self, query: str = None, tag: str = None, size: int = 10, from_: int = 0) -> Dict[str, Any]:
        """Full-text search for posts with optional tag filtering"""
        must_clauses = [{"term": {"status": "published"}}]
        
        if query:
            must_clauses.append({
                "multi_match": {
                    "query": query,
                    "fields": ["title^3", "subtitle^2", "content_text", "author_full_name", "tags^2"],
                    "fuzziness": "AUTO"
                }
            })
            
        if tag:
            must_clauses.append({"term": {"tags": tag}})

        search_body = {
            "query": {
                "bool": {
                    "must": must_clauses
                }
            },
            "from": from_,
            "size": size,
            "highlight": {
                "fields": {
                    "title": {},
                    "content_text": {}
                }
            }
        }

        try:
            response = await self.client.search(index=self.index_name, body=search_body)
            hits = response["hits"]["hits"]
            total = response["hits"]["total"]["value"]
            
            results = []
            for hit in hits:
                source = hit["_source"]
                source["highlight"] = hit.get("highlight", {})
                results.append(source)
                
            return {"total": total, "hits": results}
        except Exception as e:
            logger.error(f"Error searching posts: {e}")
            return {"total": 0, "hits": []}
            
    async def close(self):
        await self.client.close()

search_service = SearchService()
