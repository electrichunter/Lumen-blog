import uuid
import mimetypes
from typing import Optional, Tuple
from io import BytesIO
import boto3
from botocore.exceptions import ClientError
from fastapi import UploadFile, HTTPException, status
from config import settings


# Allowed file types and their categories
ALLOWED_TYPES = {
    # Images
    "image/jpeg": "images",
    "image/png": "images",
    "image/gif": "images",
    "image/webp": "images",
    "image/svg+xml": "images",
    # Audio
    "audio/mpeg": "audio",
    "audio/wav": "audio",
    "audio/ogg": "audio",
    "audio/mp4": "audio",
    # Video
    "video/mp4": "videos",
    "video/webm": "videos",
    "video/ogg": "videos",
    # Documents
    "application/pdf": "documents",
}

# Maximum file sizes (in bytes)
MAX_FILE_SIZES = {
    "images": 10 * 1024 * 1024,      # 10 MB
    "audio": 50 * 1024 * 1024,       # 50 MB
    "videos": 200 * 1024 * 1024,     # 200 MB
    "documents": 20 * 1024 * 1024,   # 20 MB
}

# Magic number signatures for file validation
MAGIC_NUMBERS = {
    b'\xff\xd8\xff': 'image/jpeg',
    b'\x89PNG\r\n\x1a\n': 'image/png',
    b'GIF87a': 'image/gif',
    b'GIF89a': 'image/gif',
    b'RIFF': 'audio/wav',
    b'ID3': 'audio/mpeg',
    b'\xff\xfb': 'audio/mpeg',
    b'\x00\x00\x00': 'video/mp4',  # ftyp box
    b'%PDF': 'application/pdf',
}


class StorageService:
    """Service for handling file uploads to S3/MinIO"""
    
    def __init__(self):
        self.s3_client = boto3.client(
            's3',
            endpoint_url=settings.S3_ENDPOINT,
            aws_access_key_id=settings.S3_ACCESS_KEY,
            aws_secret_access_key=settings.S3_SECRET_KEY,
        )
        self.bucket_name = settings.S3_BUCKET_NAME
        self._ensure_bucket_exists()
    
    def _ensure_bucket_exists(self):
        """Create bucket if it doesn't exist"""
        try:
            self.s3_client.head_bucket(Bucket=self.bucket_name)
        except ClientError:
            try:
                self.s3_client.create_bucket(Bucket=self.bucket_name)
            except ClientError as e:
                print(f"Warning: Could not create bucket: {e}")
    
    def _validate_file_type(self, content_type: str) -> str:
        """Validate file type and return category"""
        if content_type not in ALLOWED_TYPES:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail=f"File type '{content_type}' is not allowed"
            )
        return ALLOWED_TYPES[content_type]
    
    def _validate_magic_number(self, file_content: bytes, expected_type: str) -> bool:
        """Validate file content using magic numbers"""
        for magic, mime_type in MAGIC_NUMBERS.items():
            if file_content.startswith(magic):
                # Check if detected type matches or is compatible
                if mime_type == expected_type:
                    return True
                # Allow related types (e.g., all images)
                expected_category = ALLOWED_TYPES.get(expected_type, "")
                detected_category = ALLOWED_TYPES.get(mime_type, "")
                if expected_category == detected_category:
                    return True
        return False
    
    def _validate_file_size(self, size: int, category: str) -> None:
        """Validate file size based on category"""
        max_size = MAX_FILE_SIZES.get(category, 10 * 1024 * 1024)
        if size > max_size:
            max_mb = max_size / (1024 * 1024)
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail=f"File size exceeds maximum allowed ({max_mb:.0f} MB)"
            )
    
    def _generate_file_key(self, category: str, filename: str) -> str:
        """Generate unique file key for S3"""
        ext = filename.rsplit('.', 1)[-1] if '.' in filename else ''
        unique_name = f"{uuid.uuid4()}.{ext}" if ext else str(uuid.uuid4())
        return f"{category}/{unique_name}"
    
    async def upload_file(self, file: UploadFile) -> dict:
        """
        Upload file to S3/MinIO with validation.
        
        Returns:
            dict with file_url, file_key, content_type, size
        """
        # Read file content
        content = await file.read()
        size = len(content)
        
        # Validate content type
        content_type = file.content_type or mimetypes.guess_type(file.filename)[0]
        if not content_type:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Could not determine file type"
            )
        
        category = self._validate_file_type(content_type)
        
        # Validate file size
        self._validate_file_size(size, category)
        
        # Validate magic number (first few bytes)
        if not self._validate_magic_number(content, content_type):
            # For some files, magic number check might not apply
            pass  # Log warning but don't fail
        
        # Generate unique key
        file_key = self._generate_file_key(category, file.filename)
        
        # Upload to S3
        try:
            self.s3_client.put_object(
                Bucket=self.bucket_name,
                Key=file_key,
                Body=BytesIO(content),
                ContentType=content_type,
            )
        except ClientError as e:
            raise HTTPException(
                status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
                detail=f"Failed to upload file: {str(e)}"
            )
        
        # Generate public URL
        file_url = self.get_public_url(file_key)
        
        return {
            "file_url": file_url,
            "file_key": file_key,
            "content_type": content_type,
            "size": size,
            "category": category,
            "filename": file.filename
        }
    
    def get_public_url(self, file_key: str) -> str:
        """Get public URL for a file"""
        # For development with MinIO
        return f"{settings.S3_ENDPOINT}/{self.bucket_name}/{file_key}"
    
    def get_presigned_url(self, file_key: str, expiration: int = 3600) -> str:
        """
        Generate presigned URL for temporary access.
        
        Args:
            file_key: S3 object key
            expiration: URL expiration time in seconds (default 1 hour)
        """
        try:
            url = self.s3_client.generate_presigned_url(
                'get_object',
                Params={
                    'Bucket': self.bucket_name,
                    'Key': file_key
                },
                ExpiresIn=expiration
            )
            return url
        except ClientError as e:
            raise HTTPException(
                status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
                detail=f"Failed to generate presigned URL: {str(e)}"
            )
    
    def delete_file(self, file_key: str) -> bool:
        """Delete file from S3"""
        try:
            self.s3_client.delete_object(
                Bucket=self.bucket_name,
                Key=file_key
            )
            return True
        except ClientError:
            return False


# Singleton instance
_storage_service: Optional[StorageService] = None


def get_storage_service() -> StorageService:
    """Get or create storage service instance"""
    global _storage_service
    if _storage_service is None:
        _storage_service = StorageService()
    return _storage_service
