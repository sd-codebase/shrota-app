"""
Assign Random Thumbnails to Books

This script assigns existing thumbnail images randomly to books that don't have thumbnails.
It doesn't create or modify any image files - only updates the database.

Run: docker exec shrota-backend-dev python scripts/assign_thumbnails.py
"""

import asyncio
import os
import random
import sys

# Add parent directory to path for imports
sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

from sqlalchemy import select, or_
from database import async_session
from models import Book


THUMBNAILS_DIR = "./uploads/thumbnails"
VALID_EXTENSIONS = (".jpg", ".jpeg", ".png", ".webp")


def get_available_thumbnails() -> list[str]:
    """Get list of available thumbnail files."""
    if not os.path.exists(THUMBNAILS_DIR):
        print(f"Error: Thumbnails directory not found: {THUMBNAILS_DIR}")
        return []

    thumbnails = [
        f for f in os.listdir(THUMBNAILS_DIR)
        if f.lower().endswith(VALID_EXTENSIONS)
    ]
    return thumbnails


async def assign_random_thumbnails():
    """Assign random thumbnails to books without thumbnails."""
    print("=" * 60)
    print("Assign Random Thumbnails to Books")
    print("=" * 60)

    # 1. Get available thumbnails
    available = get_available_thumbnails()
    if not available:
        print("No thumbnail files found. Exiting.")
        return

    print(f"\nFound {len(available)} thumbnail files:")
    for thumb in available:
        print(f"  - {thumb}")

    # 2. Get books without thumbnails
    async with async_session() as db:
        result = await db.execute(
            select(Book).where(
                or_(Book.thumbnail == None, Book.thumbnail == "")
            ).where(Book.is_deleted == False)
        )
        books = result.scalars().all()

        if not books:
            print("\nNo books found without thumbnails. Nothing to update.")
            return

        print(f"\nFound {len(books)} books without thumbnails:")

        # 3. Assign random thumbnails
        updated_books = []
        for book in books:
            old_thumbnail = book.thumbnail
            book.thumbnail = random.choice(available)
            updated_books.append({
                "title": book.title,
                "thumbnail": book.thumbnail
            })
            print(f"  - '{book.title}' -> {book.thumbnail}")

        await db.commit()

        print("\n" + "=" * 60)
        print(f"Successfully updated {len(updated_books)} books with random thumbnails!")
        print("=" * 60)


if __name__ == "__main__":
    asyncio.run(assign_random_thumbnails())
