from contextlib import asynccontextmanager
from fastapi import FastAPI, Request
from fastapi.middleware.cors import CORSMiddleware
from fastapi.exceptions import RequestValidationError
from fastapi.responses import JSONResponse

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
    admin_users_router,
    notifications_router,
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
app.include_router(admin_users_router)
app.include_router(notifications_router)


@app.exception_handler(RequestValidationError)
async def validation_exception_handler(request: Request, exc: RequestValidationError):
    body = None
    try:
        body = await request.json()
    except Exception:
        pass
    print(f"\n{'='*50}")
    print(f"[VALIDATION ERROR] {request.method} {request.url.path}")
    print(f"[VALIDATION ERROR] Body: {body}")
    print(f"[VALIDATION ERROR] Errors: {exc.errors()}")
    print(f"{'='*50}\n")
    return JSONResponse(
        status_code=422,
        content={"detail": exc.errors()},
    )


@app.get("/")
async def root():
    return {"message": "Welcome to Shrota Audiobook API"}


@app.get("/health")
async def health_check():
    return {"status": "healthy"}
