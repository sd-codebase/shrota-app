import os
import re
import shutil
from uuid import uuid4
from pathlib import Path
from fastapi import APIRouter, HTTPException, UploadFile, File, Form, status
from fastapi.responses import FileResponse
from config import UPLOAD_DIR

router = APIRouter(prefix="/files", tags=["Files"])

# Ensure upload directories exist
Path(UPLOAD_DIR).mkdir(parents=True, exist_ok=True)
THUMBNAILS_DIR = os.path.join(UPLOAD_DIR, "thumbnails")
Path(THUMBNAILS_DIR).mkdir(parents=True, exist_ok=True)
CHAPTER_IMAGES_DIR = os.path.join(UPLOAD_DIR, "chapter-images")
Path(CHAPTER_IMAGES_DIR).mkdir(parents=True, exist_ok=True)
GENRE_THUMBNAILS_DIR = os.path.join(UPLOAD_DIR, "genre-thumbnails")
Path(GENRE_THUMBNAILS_DIR).mkdir(parents=True, exist_ok=True)
AUTHOR_PHOTOS_DIR = os.path.join(UPLOAD_DIR, "author-photos")
Path(AUTHOR_PHOTOS_DIR).mkdir(parents=True, exist_ok=True)
ARTIST_PHOTOS_DIR = os.path.join(UPLOAD_DIR, "artist-photos")
Path(ARTIST_PHOTOS_DIR).mkdir(parents=True, exist_ok=True)
PUBLICATION_PHOTOS_DIR = os.path.join(UPLOAD_DIR, "publication-photos")
Path(PUBLICATION_PHOTOS_DIR).mkdir(parents=True, exist_ok=True)

ALLOWED_IMAGE_EXTENSIONS = {".jpg", ".jpeg", ".png", ".webp"}
ALLOWED_AUDIO_EXTENSIONS = {".m4a", ".aac", ".wav"}


@router.post("/upload/chapter", status_code=status.HTTP_201_CREATED)
async def upload_chapter_file(
    file: UploadFile = File(...),
    book_name: str = Form(...),
    chapter_order: int = Form(...)
):
    file_extension = Path(file.filename).suffix.lower() if file.filename else ""

    if file_extension not in ALLOWED_AUDIO_EXTENSIONS:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"Only audio files are allowed ({', '.join(ALLOWED_AUDIO_EXTENSIONS)})"
        )

    # Create book folder
    safe_book_name = sanitize_filename(book_name)
    book_dir = os.path.join(UPLOAD_DIR, safe_book_name)
    Path(book_dir).mkdir(parents=True, exist_ok=True)

    # Create chapter filename (chapter-1.m4a, chapter-2.m4a, etc.)
    file_name = f"chapter-{chapter_order + 1}{file_extension}"
    file_path = os.path.join(book_dir, file_name)

    # Remove existing file if re-uploading
    if os.path.exists(file_path):
        os.remove(file_path)

    try:
        with open(file_path, "wb") as buffer:
            shutil.copyfileobj(file.file, buffer)
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to save file: {str(e)}")

    # Return path relative to uploads dir: book-name/chapter-1.m4a
    stored_path = f"{safe_book_name}/{file_name}"

    return {
        "file_id": stored_path,
        "filename": file.filename,
        "stored_filename": file_name,
        "content_type": file.content_type,
    }


def sanitize_filename(name: str) -> str:
    """Convert book title to a safe filename."""
    # Remove special characters and replace spaces with hyphens
    sanitized = re.sub(r'[^\w\s-]', '', name.lower())
    sanitized = re.sub(r'[-\s]+', '-', sanitized).strip('-')
    return sanitized


@router.post("/upload/thumbnail", status_code=status.HTTP_201_CREATED)
async def upload_thumbnail(
    file: UploadFile = File(...),
    book_name: str = Form(...)
):
    file_extension = Path(file.filename).suffix.lower() if file.filename else ""

    if file_extension not in ALLOWED_IMAGE_EXTENSIONS:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"Only image files are allowed ({', '.join(ALLOWED_IMAGE_EXTENSIONS)})"
        )

    # Create filename from book name
    safe_name = sanitize_filename(book_name)
    file_name = f"{safe_name}{file_extension}"
    file_path = os.path.join(THUMBNAILS_DIR, file_name)

    # Remove existing thumbnail with same base name but different extension
    for ext in ALLOWED_IMAGE_EXTENSIONS:
        existing_file = os.path.join(THUMBNAILS_DIR, f"{safe_name}{ext}")
        if os.path.exists(existing_file):
            os.remove(existing_file)

    try:
        with open(file_path, "wb") as buffer:
            shutil.copyfileobj(file.file, buffer)
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to save thumbnail: {str(e)}")

    return {
        "filename": file_name,
        "book_name": book_name,
        "content_type": file.content_type,
    }


@router.get("/thumbnail/{filename}")
async def get_thumbnail(filename: str):
    file_path = os.path.join(THUMBNAILS_DIR, filename)

    if not os.path.exists(file_path):
        raise HTTPException(status_code=404, detail="Thumbnail not found")

    return FileResponse(path=file_path, filename=filename)


@router.post("/upload/chapter-image", status_code=status.HTTP_201_CREATED)
async def upload_chapter_image(
    file: UploadFile = File(...),
    book_name: str = Form(...),
    chapter_order: int = Form(...)
):
    """Upload a chapter image. Filename format: {book-name}-chapter-{order}.{ext}"""
    file_extension = Path(file.filename).suffix.lower() if file.filename else ""

    if file_extension not in ALLOWED_IMAGE_EXTENSIONS:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"Only image files are allowed ({', '.join(ALLOWED_IMAGE_EXTENSIONS)})"
        )

    # Create filename from book name and chapter order
    safe_name = sanitize_filename(book_name)
    file_name = f"{safe_name}-chapter-{chapter_order + 1}{file_extension}"
    file_path = os.path.join(CHAPTER_IMAGES_DIR, file_name)

    # Remove existing chapter image with same base name but different extension
    base_name = f"{safe_name}-chapter-{chapter_order + 1}"
    for ext in ALLOWED_IMAGE_EXTENSIONS:
        existing_file = os.path.join(CHAPTER_IMAGES_DIR, f"{base_name}{ext}")
        if os.path.exists(existing_file):
            os.remove(existing_file)

    try:
        with open(file_path, "wb") as buffer:
            shutil.copyfileobj(file.file, buffer)
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to save chapter image: {str(e)}")

    return {
        "filename": file_name,
        "book_name": book_name,
        "chapter_order": chapter_order,
        "content_type": file.content_type,
    }


@router.get("/chapter-image/{filename}")
async def get_chapter_image(filename: str):
    """Get a chapter image by filename."""
    file_path = os.path.join(CHAPTER_IMAGES_DIR, filename)

    if not os.path.exists(file_path):
        raise HTTPException(status_code=404, detail="Chapter image not found")

    return FileResponse(path=file_path, filename=filename)


@router.post("/upload/genre-thumbnail", status_code=status.HTTP_201_CREATED)
async def upload_genre_thumbnail(
    file: UploadFile = File(...),
    genre_name: str = Form(...)
):
    """Upload a genre thumbnail. Filename format: {genre-name}.{ext}"""
    file_extension = Path(file.filename).suffix.lower() if file.filename else ""

    if file_extension not in ALLOWED_IMAGE_EXTENSIONS:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"Only image files are allowed ({', '.join(ALLOWED_IMAGE_EXTENSIONS)})"
        )

    # Create filename from genre name
    safe_name = sanitize_filename(genre_name)
    file_name = f"{safe_name}{file_extension}"
    file_path = os.path.join(GENRE_THUMBNAILS_DIR, file_name)

    # Remove existing genre thumbnail with same base name but different extension
    for ext in ALLOWED_IMAGE_EXTENSIONS:
        existing_file = os.path.join(GENRE_THUMBNAILS_DIR, f"{safe_name}{ext}")
        if os.path.exists(existing_file):
            os.remove(existing_file)

    try:
        with open(file_path, "wb") as buffer:
            shutil.copyfileobj(file.file, buffer)
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to save genre thumbnail: {str(e)}")

    return {
        "filename": file_name,
        "genre_name": genre_name,
        "content_type": file.content_type,
    }


@router.get("/genre-thumbnail/{filename}")
async def get_genre_thumbnail(filename: str):
    """Get a genre thumbnail by filename."""
    file_path = os.path.join(GENRE_THUMBNAILS_DIR, filename)

    if not os.path.exists(file_path):
        raise HTTPException(status_code=404, detail="Genre thumbnail not found")

    return FileResponse(path=file_path, filename=filename)


@router.post("/upload/author-photo", status_code=status.HTTP_201_CREATED)
async def upload_author_photo(
    file: UploadFile = File(...),
    author_name: str = Form(...)
):
    """Upload an author photo. Filename format: {author-name}.{ext}"""
    file_extension = Path(file.filename).suffix.lower() if file.filename else ""

    if file_extension not in ALLOWED_IMAGE_EXTENSIONS:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"Only image files are allowed ({', '.join(ALLOWED_IMAGE_EXTENSIONS)})"
        )

    safe_name = sanitize_filename(author_name)
    file_name = f"{safe_name}{file_extension}"
    file_path = os.path.join(AUTHOR_PHOTOS_DIR, file_name)

    for ext in ALLOWED_IMAGE_EXTENSIONS:
        existing_file = os.path.join(AUTHOR_PHOTOS_DIR, f"{safe_name}{ext}")
        if os.path.exists(existing_file):
            os.remove(existing_file)

    try:
        with open(file_path, "wb") as buffer:
            shutil.copyfileobj(file.file, buffer)
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to save author photo: {str(e)}")

    return {
        "filename": file_name,
        "author_name": author_name,
        "content_type": file.content_type,
    }


@router.get("/author-photo/{filename}")
async def get_author_photo(filename: str):
    """Get an author photo by filename."""
    file_path = os.path.join(AUTHOR_PHOTOS_DIR, filename)

    if not os.path.exists(file_path):
        raise HTTPException(status_code=404, detail="Author photo not found")

    return FileResponse(path=file_path, filename=filename)


@router.post("/upload/artist-photo", status_code=status.HTTP_201_CREATED)
async def upload_artist_photo(
    file: UploadFile = File(...),
    artist_name: str = Form(...)
):
    """Upload an artist photo. Filename format: {artist-name}.{ext}"""
    file_extension = Path(file.filename).suffix.lower() if file.filename else ""

    if file_extension not in ALLOWED_IMAGE_EXTENSIONS:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"Only image files are allowed ({', '.join(ALLOWED_IMAGE_EXTENSIONS)})"
        )

    safe_name = sanitize_filename(artist_name)
    file_name = f"{safe_name}{file_extension}"
    file_path = os.path.join(ARTIST_PHOTOS_DIR, file_name)

    for ext in ALLOWED_IMAGE_EXTENSIONS:
        existing_file = os.path.join(ARTIST_PHOTOS_DIR, f"{safe_name}{ext}")
        if os.path.exists(existing_file):
            os.remove(existing_file)

    try:
        with open(file_path, "wb") as buffer:
            shutil.copyfileobj(file.file, buffer)
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to save artist photo: {str(e)}")

    return {
        "filename": file_name,
        "artist_name": artist_name,
        "content_type": file.content_type,
    }


@router.get("/artist-photo/{filename}")
async def get_artist_photo(filename: str):
    """Get an artist photo by filename."""
    file_path = os.path.join(ARTIST_PHOTOS_DIR, filename)

    if not os.path.exists(file_path):
        raise HTTPException(status_code=404, detail="Artist photo not found")

    return FileResponse(path=file_path, filename=filename)


@router.post("/upload/publication-photo", status_code=status.HTTP_201_CREATED)
async def upload_publication_photo(
    file: UploadFile = File(...),
    publication_name: str = Form(...)
):
    """Upload a publication photo. Filename format: {publication-name}.{ext}"""
    file_extension = Path(file.filename).suffix.lower() if file.filename else ""

    if file_extension not in ALLOWED_IMAGE_EXTENSIONS:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"Only image files are allowed ({', '.join(ALLOWED_IMAGE_EXTENSIONS)})"
        )

    safe_name = sanitize_filename(publication_name)
    file_name = f"{safe_name}{file_extension}"
    file_path = os.path.join(PUBLICATION_PHOTOS_DIR, file_name)

    for ext in ALLOWED_IMAGE_EXTENSIONS:
        existing_file = os.path.join(PUBLICATION_PHOTOS_DIR, f"{safe_name}{ext}")
        if os.path.exists(existing_file):
            os.remove(existing_file)

    try:
        with open(file_path, "wb") as buffer:
            shutil.copyfileobj(file.file, buffer)
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to save publication photo: {str(e)}")

    return {
        "filename": file_name,
        "publication_name": publication_name,
        "content_type": file.content_type,
    }


@router.get("/publication-photo/{filename}")
async def get_publication_photo(filename: str):
    """Get a publication photo by filename."""
    file_path = os.path.join(PUBLICATION_PHOTOS_DIR, filename)

    if not os.path.exists(file_path):
        raise HTTPException(status_code=404, detail="Publication photo not found")

    return FileResponse(path=file_path, filename=filename)


@router.get("/chapter/{book_name}/{filename}")
async def get_chapter_file(book_name: str, filename: str):
    file_path = os.path.join(UPLOAD_DIR, book_name, filename)

    if not os.path.exists(file_path):
        raise HTTPException(status_code=404, detail="File not found")

    return FileResponse(path=file_path, filename=filename)


@router.delete("/{file_id}", status_code=status.HTTP_204_NO_CONTENT)
async def delete_file(file_id: str):
    upload_path = Path(UPLOAD_DIR)
    matching_files = list(upload_path.glob(f"{file_id}*"))

    if not matching_files:
        raise HTTPException(status_code=404, detail="File not found")

    try:
        os.remove(matching_files[0])
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to delete file: {str(e)}")

    return None


