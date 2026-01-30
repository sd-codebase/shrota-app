from contextlib import asynccontextmanager
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from config import CORS_ORIGINS
from database import init_db, close_db
from routes import (
    languages_router,
    genres_router,
    authors_router,
    artists_router,
    publications_router,
    books_router,
    files_router,
    auth_router,
    user_auth_router,
    users_router,
    search_router,
    user_activity_router,
    content_promotion_router,
    user_preferences_router,
    mobile_router,
)


@asynccontextmanager
async def lifespan(app: FastAPI):
    await init_db()
    yield
    await close_db()


app = FastAPI(title="Shrota Audiobook API", lifespan=lifespan)

app.add_middleware(
    CORSMiddleware,
    allow_origins=CORS_ORIGINS,
    allow_credentials=True,
    allow_methods=["GET", "POST", "PUT", "DELETE", "OPTIONS", "PATCH"],
    allow_headers=["*"],
)

# Include routers
app.include_router(auth_router)
app.include_router(user_auth_router)
app.include_router(users_router)
app.include_router(user_activity_router)
app.include_router(search_router)
app.include_router(languages_router)
app.include_router(genres_router)
app.include_router(authors_router)
app.include_router(artists_router)
app.include_router(publications_router)
app.include_router(books_router)
app.include_router(files_router)
app.include_router(content_promotion_router)
app.include_router(user_preferences_router)
app.include_router(mobile_router)


@app.get("/")
async def root():
    return {"message": "Welcome to Shrota Audiobook API"}


@app.get("/health")
async def health_check():
    return {"status": "healthy"}
