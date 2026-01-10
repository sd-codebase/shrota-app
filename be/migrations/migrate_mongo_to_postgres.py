"""
MongoDB to PostgreSQL Migration Script

This script migrates all data from MongoDB to PostgreSQL.
Run this after setting up PostgreSQL and updating the SQLAlchemy models.

Usage:
    cd be
    python -m migrations.migrate_mongo_to_postgres
"""

import asyncio
import uuid
from datetime import datetime
from motor.motor_asyncio import AsyncIOMotorClient
from sqlalchemy.ext.asyncio import create_async_engine, async_sessionmaker, AsyncSession

from config import DATABASE_URL, MONGODB_URL, DATABASE_NAME
from models.base import Base
from models import Author, Artist, Genre, Language, Publication, Book, Chapter
from models.book import book_authors, book_artists, book_genres


# Store ID mappings from MongoDB ObjectId (string) to PostgreSQL UUID
id_mappings = {
    "authors": {},
    "artists": {},
    "genres": {},
    "languages": {},
    "publications": {},
    "books": {},
    "chapters": {},
}


async def get_mongodb():
    """Connect to MongoDB."""
    client = AsyncIOMotorClient(MONGODB_URL)
    return client[DATABASE_NAME]


async def migrate_languages(mongo_db, pg_session: AsyncSession):
    """Migrate languages collection."""
    print("Migrating languages...")
    cursor = mongo_db.languages.find({})
    languages = await cursor.to_list(1000)

    count = 0
    for lang in languages:
        old_id = str(lang["_id"])
        new_id = uuid.uuid4()

        new_lang = Language(
            id=new_id,
            name=lang["name"],
            code=lang.get("code", ""),
            is_deleted=lang.get("is_deleted", False),
            created_at=lang.get("created_at", datetime.utcnow()),
            updated_at=lang.get("updated_at", datetime.utcnow()),
        )
        pg_session.add(new_lang)
        id_mappings["languages"][old_id] = new_id
        count += 1

    await pg_session.commit()
    print(f"  Migrated {count} languages")


async def migrate_genres(mongo_db, pg_session: AsyncSession):
    """Migrate genres collection."""
    print("Migrating genres...")
    cursor = mongo_db.genres.find({})
    genres = await cursor.to_list(1000)

    count = 0
    for genre in genres:
        old_id = str(genre["_id"])
        new_id = uuid.uuid4()

        new_genre = Genre(
            id=new_id,
            name=genre["name"],
            description=genre.get("description"),
            is_deleted=genre.get("is_deleted", False),
            created_at=genre.get("created_at", datetime.utcnow()),
            updated_at=genre.get("updated_at", datetime.utcnow()),
        )
        pg_session.add(new_genre)
        id_mappings["genres"][old_id] = new_id
        count += 1

    await pg_session.commit()
    print(f"  Migrated {count} genres")


async def migrate_publications(mongo_db, pg_session: AsyncSession):
    """Migrate publications collection."""
    print("Migrating publications...")
    cursor = mongo_db.publications.find({})
    publications = await cursor.to_list(1000)

    count = 0
    for pub in publications:
        old_id = str(pub["_id"])
        new_id = uuid.uuid4()

        new_pub = Publication(
            id=new_id,
            name=pub["name"],
            description=pub.get("description"),
            is_deleted=pub.get("is_deleted", False),
            created_at=pub.get("created_at", datetime.utcnow()),
            updated_at=pub.get("updated_at", datetime.utcnow()),
        )
        pg_session.add(new_pub)
        id_mappings["publications"][old_id] = new_id
        count += 1

    await pg_session.commit()
    print(f"  Migrated {count} publications")


async def migrate_authors(mongo_db, pg_session: AsyncSession):
    """Migrate authors collection."""
    print("Migrating authors...")
    cursor = mongo_db.authors.find({})
    authors = await cursor.to_list(1000)

    count = 0
    for author in authors:
        old_id = str(author["_id"])
        new_id = uuid.uuid4()

        new_author = Author(
            id=new_id,
            name=author["name"],
            bio=author.get("bio"),
            social_media=author.get("social_media"),
            is_deleted=author.get("is_deleted", False),
            created_at=author.get("created_at", datetime.utcnow()),
            updated_at=author.get("updated_at", datetime.utcnow()),
        )
        pg_session.add(new_author)
        id_mappings["authors"][old_id] = new_id
        count += 1

    await pg_session.commit()
    print(f"  Migrated {count} authors")


async def migrate_artists(mongo_db, pg_session: AsyncSession):
    """Migrate artists collection."""
    print("Migrating artists...")
    cursor = mongo_db.artists.find({})
    artists = await cursor.to_list(1000)

    count = 0
    for artist in artists:
        old_id = str(artist["_id"])
        new_id = uuid.uuid4()

        new_artist = Artist(
            id=new_id,
            name=artist["name"],
            bio=artist.get("bio"),
            social_media=artist.get("social_media"),
            is_deleted=artist.get("is_deleted", False),
            created_at=artist.get("created_at", datetime.utcnow()),
            updated_at=artist.get("updated_at", datetime.utcnow()),
        )
        pg_session.add(new_artist)
        id_mappings["artists"][old_id] = new_id
        count += 1

    await pg_session.commit()
    print(f"  Migrated {count} artists")


async def migrate_books(mongo_db, pg_session: AsyncSession):
    """Migrate books collection with chapters and junction tables."""
    print("Migrating books...")
    cursor = mongo_db.books.find({})
    books = await cursor.to_list(1000)

    book_count = 0
    chapter_count = 0

    for book_doc in books:
        old_id = str(book_doc["_id"])
        new_id = uuid.uuid4()

        # Map foreign keys
        publisher_id = None
        if book_doc.get("publisher_id"):
            publisher_id = id_mappings["publications"].get(book_doc["publisher_id"])

        language_id = None
        if book_doc.get("language_id"):
            language_id = id_mappings["languages"].get(book_doc["language_id"])

        new_book = Book(
            id=new_id,
            title=book_doc["title"],
            information=book_doc.get("information", ""),
            thumbnail=book_doc.get("thumbnail"),
            total_duration=book_doc.get("total_duration", 0),
            is_published=book_doc.get("is_published", False),
            is_deleted=book_doc.get("is_deleted", False),
            publisher_id=publisher_id,
            language_id=language_id,
            created_at=book_doc.get("created_at", datetime.utcnow()),
            updated_at=book_doc.get("updated_at", datetime.utcnow()),
        )

        # Add author relationships
        # Handle backward compatibility: author_id -> author_ids
        author_ids = book_doc.get("author_ids", [])
        if not author_ids and book_doc.get("author_id"):
            author_ids = [book_doc["author_id"]]

        for author_id in author_ids:
            if author_id in id_mappings["authors"]:
                author = await pg_session.get(Author, id_mappings["authors"][author_id])
                if author:
                    new_book.authors.append(author)

        # Add artist relationships
        artist_ids = book_doc.get("artist_ids", [])
        for artist_id in artist_ids:
            if artist_id in id_mappings["artists"]:
                artist = await pg_session.get(Artist, id_mappings["artists"][artist_id])
                if artist:
                    new_book.artists.append(artist)

        # Add genre relationships
        # Handle backward compatibility: genre_id -> genre_ids
        genre_ids = book_doc.get("genre_ids", [])
        if not genre_ids and book_doc.get("genre_id"):
            genre_ids = [book_doc["genre_id"]]

        for genre_id in genre_ids:
            if genre_id in id_mappings["genres"]:
                genre = await pg_session.get(Genre, id_mappings["genres"][genre_id])
                if genre:
                    new_book.genres.append(genre)

        pg_session.add(new_book)
        id_mappings["books"][old_id] = new_id
        book_count += 1

        # Migrate chapters (embedded array to separate table)
        for ch in book_doc.get("chapters", []):
            old_chapter_id = ch.get("id")
            new_chapter_id = uuid.uuid4()

            new_chapter = Chapter(
                id=new_chapter_id,
                book_id=new_id,
                title=ch.get("title", "Untitled"),
                description=ch.get("description"),
                order=ch.get("order", 0),
                file_id=ch.get("file_id"),
                audio_url=ch.get("audio_url"),
                duration=ch.get("duration"),
                file_size=ch.get("file_size"),
                is_published=ch.get("is_published", False),
                is_deleted=ch.get("is_deleted", False),
            )
            pg_session.add(new_chapter)

            if old_chapter_id:
                id_mappings["chapters"][old_chapter_id] = new_chapter_id
            chapter_count += 1

    await pg_session.commit()
    print(f"  Migrated {book_count} books with {chapter_count} chapters")


async def main():
    """Main migration function."""
    print("=" * 50)
    print("MongoDB to PostgreSQL Migration")
    print("=" * 50)

    # Connect to MongoDB
    print("\nConnecting to MongoDB...")
    mongo_db = await get_mongodb()

    # Connect to PostgreSQL
    print("Connecting to PostgreSQL...")
    engine = create_async_engine(DATABASE_URL, echo=False)
    async_session = async_sessionmaker(engine, class_=AsyncSession, expire_on_commit=False)

    # Create tables if they don't exist
    print("Creating PostgreSQL tables...")
    async with engine.begin() as conn:
        await conn.run_sync(Base.metadata.create_all)

    # Run migrations in order (respecting foreign keys)
    async with async_session() as session:
        try:
            print("\nStarting data migration...\n")

            # 1. Languages (no foreign keys)
            await migrate_languages(mongo_db, session)

            # 2. Genres (no foreign keys)
            await migrate_genres(mongo_db, session)

            # 3. Publications (no foreign keys)
            await migrate_publications(mongo_db, session)

            # 4. Authors (no foreign keys)
            await migrate_authors(mongo_db, session)

            # 5. Artists (no foreign keys)
            await migrate_artists(mongo_db, session)

            # 6. Books with chapters and junction tables
            await migrate_books(mongo_db, session)

            print("\n" + "=" * 50)
            print("Migration completed successfully!")
            print("=" * 50)

            # Print summary
            print("\nMigration Summary:")
            print(f"  Languages:    {len(id_mappings['languages'])}")
            print(f"  Genres:       {len(id_mappings['genres'])}")
            print(f"  Publications: {len(id_mappings['publications'])}")
            print(f"  Authors:      {len(id_mappings['authors'])}")
            print(f"  Artists:      {len(id_mappings['artists'])}")
            print(f"  Books:        {len(id_mappings['books'])}")
            print(f"  Chapters:     {len(id_mappings['chapters'])}")

        except Exception as e:
            print(f"\nError during migration: {e}")
            raise
        finally:
            await engine.dispose()


if __name__ == "__main__":
    asyncio.run(main())
