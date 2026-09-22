import re


def slugify(text: str) -> str:
    """Convert text into a URL-safe, hyphen-separated slug."""
    slug = text.strip().lower()
    slug = re.sub(r"[^a-z0-9]+", "-", slug)
    slug = slug.strip("-")
    return slug or "news"


async def generate_unique_slug(title: str, is_taken) -> str:
    """
    Generate a hyphen-separated slug from `title`, appending `-2`, `-3`, ...
    until `is_taken(candidate)` (an async callable) returns False.
    """
    base = slugify(title)
    candidate = base
    suffix = 2
    while await is_taken(candidate):
        candidate = f"{base}-{suffix}"
        suffix += 1
    return candidate
