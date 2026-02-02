from datetime import date, timedelta

MINIMUM_ADULT_AGE = 18
MINIMUM_REGISTRATION_AGE = 13


def calculate_age(birth_date: date) -> int:
    """Calculate age in years from birth date."""
    today = date.today()
    age = today.year - birth_date.year
    if (today.month, today.day) < (birth_date.month, birth_date.day):
        age -= 1
    return age


def is_adult(birth_date: date) -> bool:
    """Check if user is 18 or older."""
    return calculate_age(birth_date) >= MINIMUM_ADULT_AGE


def is_eligible_for_registration(birth_date: date) -> bool:
    """
    Check if user is at least 13 years and 1 day old.
    Returns True if eligible, False otherwise.
    """
    today = date.today()
    # Calculate the date that is exactly 13 years and 1 day ago
    min_birth_date = date(today.year - MINIMUM_REGISTRATION_AGE, today.month, today.day) - timedelta(days=1)
    return birth_date <= min_birth_date
