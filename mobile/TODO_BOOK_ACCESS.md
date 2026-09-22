# TODO: Book Access Type (Free / Subscriber / Prime) — Mobile

## Status: not started. Admin dashboard + backend are done; mobile enforcement is deferred.

## Background

Books now carry an `access_type` field, set by the admin when publishing:

- **`free`** — anyone can listen. (Default, and the only value that exists today.)
- **`subscriber_only`** — shown in book lists to everyone, but listening
  requires an active subscription.
- **`prime_only`** — shown in book lists to everyone, but listening requires
  buying that specific book at its `prime_price` (₹, pay-per-title — like
  Amazon Prime's Digital Rentals/Purchases).

The backend already exposes `access_type` and `prime_price` on every book
response the mobile app consumes (`/v1/mobile/...` endpoints and the
`/books/{id}` admin endpoint) — see `be/routes/mobile.py` and
`be/routes/books.py`. **Nothing currently enforces the paywall** — a
`subscriber_only` or `prime_only` book plays exactly like a free one right
now. This file tracks what's needed to actually enforce it.

## What's needed on mobile

1. **Book listing screens** (`BooksScreen`, `SectionListScreen`, `GenreDetailsScreen`,
   etc.): no change needed — all books show regardless of `access_type` (per
   product decision, paywalled books stay discoverable in the list).

2. **Book details screen** (`BookDetailsScreen.tsx`): show a badge/indicator
   for non-free books (e.g. "Prime" or "Subscriber" tag), similar to the
   admin dashboard's tag.

3. **Playback gating** (`PlayerScreen.tsx` / wherever playback starts):
   - `subscriber_only`: before starting playback, check the current user's
     subscription status. If not subscribed, show a "Subscribe to listen"
     prompt/paywall instead of starting playback.
   - `prime_only`: before starting playback, check whether the user has
     purchased *this specific book*. If not, show a "Purchase This Prime
     Book — ₹{prime_price}" prompt instead of starting playback.
   - `free`: no gate, current behavior.

4. **Backend work still needed for the above** (not yet built — mobile work
   is blocked on this too):
   - A subscription model (plans, user subscription status, payment
     integration) — doesn't exist yet.
   - A per-book purchase model (user → purchased prime books, payment
     integration) — doesn't exist yet.
   - Endpoints for both purchase flows, and a way for the mobile app to
     check "can this user listen to this book" before allowing playback.

5. **Payment integration**: whichever gateway is chosen (Razorpay is the
   common choice for INR), on both the backend (webhook/verification) and
   mobile (checkout UI) sides.

## Not yet decided

- Subscription pricing/plans (monthly? yearly?) — not set anywhere yet.
- Whether purchased Prime books are a one-time permanent unlock or time-limited
  (the "rental" half of Amazon's Rental/Purchase model was mentioned as
  inspiration, but the admin only captures a single `prime_price` today —
  no rental-vs-purchase distinction exists in the data model).

Revisit this file when mobile work on this feature actually starts.
