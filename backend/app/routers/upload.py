from fastapi import APIRouter, Depends, UploadFile, File
from app.models.user import User
from app.schemas.post import FileUploadResponse
from app.services.storage import StorageService, get_storage_service
from app.auth.dependencies import get_current_active_user

router = APIRouter(prefix="/api/upload", tags=["Upload"])


@router.post("/", response_model=FileUploadResponse)
async def upload_file(
    file: UploadFile = File(...),
    current_user: User = Depends(get_current_active_user),
    storage: StorageService = Depends(get_storage_service)
):
    """
    Upload a file (image, audio, video, or document).
    
    Files are automatically categorized and validated:
    - Images: JPEG, PNG, GIF, WebP, SVG (max 10 MB)
    - Audio: MP3, WAV, OGG, M4A (max 50 MB)
    - Video: MP4, WebM, OGG (max 200 MB)
    - Documents: PDF (max 20 MB)
    
    Returns the public URL and file metadata.
    """
    result = await storage.upload_file(file)
    return FileUploadResponse(**result)


@router.post("/image", response_model=FileUploadResponse)
async def upload_image(
    file: UploadFile = File(...),
    current_user: User = Depends(get_current_active_user),
    storage: StorageService = Depends(get_storage_service)
):
    """
    Upload an image file specifically.
    
    Allowed formats: JPEG, PNG, GIF, WebP, SVG
    Maximum size: 10 MB
    """
    # Validate image type
    allowed_image_types = [
        "image/jpeg", "image/png", "image/gif", 
        "image/webp", "image/svg+xml"
    ]
    
    if file.content_type not in allowed_image_types:
        from fastapi import HTTPException, status
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"Only image files are allowed. Got: {file.content_type}"
        )
    
    result = await storage.upload_file(file)
    return FileUploadResponse(**result)


@router.post("/audio", response_model=FileUploadResponse)
async def upload_audio(
    file: UploadFile = File(...),
    current_user: User = Depends(get_current_active_user),
    storage: StorageService = Depends(get_storage_service)
):
    """
    Upload an audio file specifically.
    
    Allowed formats: MP3, WAV, OGG, M4A
    Maximum size: 50 MB
    """
    allowed_audio_types = [
        "audio/mpeg", "audio/wav", "audio/ogg", "audio/mp4"
    ]
    
    if file.content_type not in allowed_audio_types:
        from fastapi import HTTPException, status
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"Only audio files are allowed. Got: {file.content_type}"
        )
    
    result = await storage.upload_file(file)
    return FileUploadResponse(**result)
