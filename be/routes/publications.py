from datetime import datetime
from uuid import UUID
from fastapi import APIRouter, HTTPException, status, Depends
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select
from database import get_db
from models import Publication
from schemas.publication import (
    PublicationCreate,
    PublicationUpdate,
    PublicationResponse,
    PublicationBulkCreate,
)

router = APIRouter(prefix="/publications", tags=["Publications"])


def publication_to_response(publication: Publication) -> dict:
    return {
        "id": str(publication.id),
        "name": publication.name,
        "description": publication.description,
        "is_deleted": publication.is_deleted,
        "created_at": publication.created_at,
        "updated_at": publication.updated_at,
    }


@router.get("", response_model=list[PublicationResponse])
async def get_publications(db: AsyncSession = Depends(get_db)):
    result = await db.execute(
        select(Publication).where(Publication.is_deleted == False).order_by(Publication.name)
    )
    publications = result.scalars().all()
    return [publication_to_response(p) for p in publications]


@router.get("/{publication_id}", response_model=PublicationResponse)
async def get_publication(publication_id: str, db: AsyncSession = Depends(get_db)):
    try:
        uuid_id = UUID(publication_id)
    except ValueError:
        raise HTTPException(status_code=400, detail="Invalid publication ID")

    publication = await db.get(Publication, uuid_id)
    if not publication:
        raise HTTPException(status_code=404, detail="Publication not found")
    return publication_to_response(publication)


@router.post("", response_model=PublicationResponse, status_code=status.HTTP_201_CREATED)
async def create_publication(publication: PublicationCreate, db: AsyncSession = Depends(get_db)):
    new_publication = Publication(
        name=publication.name,
        description=publication.description,
    )
    db.add(new_publication)
    await db.commit()
    await db.refresh(new_publication)
    return publication_to_response(new_publication)


@router.post("/bulk", response_model=list[PublicationResponse], status_code=status.HTTP_201_CREATED)
async def bulk_create_publications(data: PublicationBulkCreate, db: AsyncSession = Depends(get_db)):
    new_publications = [
        Publication(name=p.name, description=p.description)
        for p in data.publications
    ]
    db.add_all(new_publications)
    await db.commit()
    for p in new_publications:
        await db.refresh(p)
    return [publication_to_response(p) for p in new_publications]


@router.put("/{publication_id}", response_model=PublicationResponse)
async def update_publication(publication_id: str, publication: PublicationUpdate, db: AsyncSession = Depends(get_db)):
    try:
        uuid_id = UUID(publication_id)
    except ValueError:
        raise HTTPException(status_code=400, detail="Invalid publication ID")

    existing = await db.get(Publication, uuid_id)
    if not existing:
        raise HTTPException(status_code=404, detail="Publication not found")

    update_data = publication.model_dump(exclude_unset=True)
    if not update_data:
        raise HTTPException(status_code=400, detail="No fields to update")

    for key, value in update_data.items():
        setattr(existing, key, value)
    existing.updated_at = datetime.utcnow()

    await db.commit()
    await db.refresh(existing)
    return publication_to_response(existing)


@router.delete("/{publication_id}", status_code=status.HTTP_204_NO_CONTENT)
async def delete_publication(publication_id: str, db: AsyncSession = Depends(get_db)):
    """Soft delete a publication by setting is_deleted to true."""
    try:
        uuid_id = UUID(publication_id)
    except ValueError:
        raise HTTPException(status_code=400, detail="Invalid publication ID")

    existing = await db.get(Publication, uuid_id)
    if not existing:
        raise HTTPException(status_code=404, detail="Publication not found")

    existing.is_deleted = True
    existing.updated_at = datetime.utcnow()
    await db.commit()
    return None
