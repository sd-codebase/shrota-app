"""
Migration: Add new fields to Books and Chapters

Changes:
- Book: genre_id -> genre_ids (array), add artist_ids, language_id, total_duration, is_published
- Chapter: add duration, file_size, is_published

Run: python migrations/001_add_new_book_fields.py
"""

import asyncio
import os
import sys

# Add parent directory to path for imports
sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

from motor.motor_asyncio import AsyncIOMotorClient
from dotenv import load_dotenv

load_dotenv()


async def migrate():
    """Migrate existing book documents to new schema."""
    mongo_uri = os.getenv("MONGODB_URI", "mongodb://localhost:27017")
    db_name = os.getenv("DATABASE_NAME", "shrota")

    client = AsyncIOMotorClient(mongo_uri)
    db = client[db_name]

    print(f"Connected to database: {db_name}")
    print("Starting migration...")

    # Count documents to migrate
    total_books = await db.books.count_documents({})
    print(f"Found {total_books} books to check")

    migrated = 0
    skipped = 0

    async for book in db.books.find({}):
        update_fields = {}

        # Migrate genre_id to genre_ids if needed
        if "genre_id" in book and "genre_ids" not in book:
            update_fields["genre_ids"] = [book["genre_id"]]
            update_fields["$unset"] = {"genre_id": ""}

        # Add missing fields with defaults
        if "artist_ids" not in book:
            update_fields["artist_ids"] = []

        if "language_id" not in book:
            update_fields["language_id"] = None

        if "total_duration" not in book:
            # Calculate total_duration from chapters
            total_duration = sum(
                ch.get("duration", 0) or 0 for ch in book.get("chapters", [])
            )
            update_fields["total_duration"] = total_duration

        # Add is_published field to book if missing
        if "is_published" not in book:
            update_fields["is_published"] = False

        # Update chapters with missing fields
        chapters = book.get("chapters", [])
        updated_chapters = []
        chapters_changed = False

        for chapter in chapters:
            if "duration" not in chapter:
                chapter["duration"] = None
                chapters_changed = True
            if "file_size" not in chapter:
                chapter["file_size"] = None
                chapters_changed = True
            if "is_published" not in chapter:
                chapter["is_published"] = False
                chapters_changed = True
            updated_chapters.append(chapter)

        if chapters_changed:
            update_fields["chapters"] = updated_chapters

        # Apply updates if any
        if update_fields:
            unset_fields = update_fields.pop("$unset", None)

            update_query = {}
            if update_fields:
                update_query["$set"] = update_fields
            if unset_fields:
                update_query["$unset"] = unset_fields

            if update_query:
                await db.books.update_one(
                    {"_id": book["_id"]},
                    update_query
                )
                migrated += 1
                print(f"  Migrated: {book['title']}")
        else:
            skipped += 1

    print(f"\nMigration complete!")
    print(f"  Migrated: {migrated}")
    print(f"  Skipped (already up to date): {skipped}")

    client.close()


if __name__ == "__main__":
    asyncio.run(migrate())
