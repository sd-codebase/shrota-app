import re
import unicodedata

# Slugs are the readable part of public website URLs (/book/<slug>,
# /category/<slug>, /news/<slug>). They are kept to plain lowercase English
# letters, digits and single hyphens so links stay readable when shared —
# Marathi titles can't be turned into one automatically, so admins type it.
SLUG_MAX_LENGTH = 100
SLUG_PATTERN = re.compile(r"^[a-z0-9]+(?:-[a-z0-9]+)*$")
# Would collide with fixed API/website paths like /news/public.
RESERVED_SLUGS = {"public", "mobile", "bulk", "new", "edit"}


def clean_slug(text: str) -> str:
    """
    Sanitize text into a slug: accents dropped, lowercased, every run of
    anything other than a-z / 0-9 turned into one hyphen, trimmed to
    SLUG_MAX_LENGTH (on a word boundary where possible). Returns "" when
    nothing usable is left (e.g. a title written only in Devanagari).
    """
    text = unicodedata.normalize("NFKD", text).encode("ascii", "ignore").decode("ascii")
    slug = re.sub(r"[^a-z0-9]+", "-", text.lower()).strip("-")
    if len(slug) > SLUG_MAX_LENGTH:
        slug = slug[:SLUG_MAX_LENGTH]
        if "-" in slug:
            slug = slug.rsplit("-", 1)[0]
        slug = slug.strip("-")
    return slug


def validate_slug_input(value):
    """
    Pydantic validator for an admin-supplied slug. None stays None (field not
    sent), blank becomes "" (generate from the title). Otherwise only English
    letters (lowercased), digits and single hyphens are accepted; anything
    else is rejected, not converted.
    """
    if value is None:
        return None
    slug = value.strip().lower()
    if not slug:
        return ""
    if not SLUG_PATTERN.fullmatch(slug):
        raise ValueError(
            "Slug can only contain letters (a-z), numbers (0-9) and single hyphens, "
            "and can't start or end with a hyphen"
        )
    if len(slug) > SLUG_MAX_LENGTH:
        raise ValueError(f"Slug can be at most {SLUG_MAX_LENGTH} characters")
    if slug in RESERVED_SLUGS:
        raise ValueError(f'"{slug}" is reserved, please choose another slug')
    return slug


def slugify(text: str, fallback: str) -> str:
    """Slug built from a title, or `fallback` when the title has no English letters."""
    slug = clean_slug(text)
    if not slug or slug in RESERVED_SLUGS:
        return fallback
    return slug


async def generate_unique_slug(title: str, is_taken, fallback: str) -> str:
    """
    Generate a hyphen-separated slug from `title`, appending `-2`, `-3`, ...
    until `is_taken(candidate)` (an async callable) returns False.
    """
    base = slugify(title, fallback)
    candidate = base
    suffix = 2
    while await is_taken(candidate):
        candidate = f"{base}-{suffix}"
        suffix += 1
    return candidate
