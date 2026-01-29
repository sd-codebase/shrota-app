from datetime import date

MINIMUM_ADULT_AGE = 18


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
