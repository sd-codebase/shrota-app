# Shrota Audiobook App - Developer Notes

## Quick Reference

### Docker Commands
```bash
make local-up      # Start all containers
make local-down    # Stop all containers
```

### Ports
| Service  | Port | URL                    |
|----------|------|------------------------|
| Frontend | 3000 | http://localhost:3000  |
| Website  | 3001 | http://localhost:3001  |
| Backend  | 8000 | http://localhost:8000  |
| CDN      | 8080 | http://localhost:8080  |
| Postgres | 5432 | localhost:5432         |

---

## Admin Authentication

### Register Admin User
```bash
curl -X POST http://localhost:8000/auth/register \
  -H "Content-Type: application/json" \
  -d '{
    "email": "admin@shrota.com",
    "username": "admin",
    "password": "admin123",
    "name": "Admin User"
  }'
```

### Login
```bash
curl -X POST http://localhost:8000/auth/login \
  -H "Content-Type: application/json" \
  -d '{
    "email": "admin",
    "password": "admin123"
  }'
```

### Get Current Admin (requires token)
```bash
curl http://localhost:8000/auth/me \
  -H "Authorization: Bearer <access_token>"
```

---

## API Endpoints

### Auth
- `POST /auth/register` - Register new admin
- `POST /auth/login` - Login and get JWT token
- `GET /auth/me` - Get current admin info (protected)

### Resources
- `/languages` - Language CRUD
- `/genres` - Genre CRUD
- `/authors` - Author CRUD
- `/artists` - Artist CRUD
- `/publications` - Publication CRUD
- `/books` - Book CRUD
- `/files` - File uploads
- `/notifications` - Push notifications (admin only)

---

## Mobile App

> **Uses local builds, NOT EAS.** See `mobile/BUILD.md` for full details.

### Commands (run from `mobile/` directory)

| Command | Description |
|---------|-------------|
| `npm start` | Start Metro bundler |
| `npm run android` | Run on emulator/device |
| `npm run prebuild:clean` | Clean prebuild (both platforms) |
| `npm run prebuild:android` | Clean prebuild Android only |
| `npm run build:aab` | Build release AAB for Google Play |
| `npm run build:apk` | Build release APK |

### Clean Build
```bash
rm -rf android && npm run build:aab
```

### Output Locations
- AAB: `android/app/build/outputs/bundle/release/app-release.aab`
- APK: `android/app/build/outputs/apk/release/app-release.apk`

---

## Push Notifications (FCM)

Push notifications use Firebase Cloud Messaging (FCM) to send notifications from admin dashboard to all app users.

### Setup

1. **Firebase Console Setup**:
   - Go to Firebase Console → Project Settings → Service accounts
   - Click "Generate new private key"
   - Save as `be/firebase-credentials.json`
   - Never commit this file (already in .gitignore)

2. **Environment Configuration**:
   - Set `NOTIFICATION_MODE=production` in production
   - Set `FIREBASE_CREDENTIALS_PATH` if using non-default path

### Admin Dashboard

Navigate to **Notifications** in the admin sidebar to:
- Send push notifications to all users
- View notification history with delivery status

### API Endpoints

```bash
# Send notification (requires admin auth)
curl -X POST http://localhost:8000/notifications/send \
  -H "Authorization: Bearer <token>" \
  -H "Content-Type: application/json" \
  -d '{
    "title": "New Audiobook!",
    "body": "Check out our latest release",
    "image_url": "https://example.com/image.png"
  }'

# List sent notifications
curl http://localhost:8000/notifications \
  -H "Authorization: Bearer <token>"
```

### Mobile App

The app automatically:
- Requests notification permission on first launch
- Subscribes to `all_users` topic
- Shows in-app alert for foreground notifications
- System notification for background notifications

---

## Feature Flags

Switch an app feature on for **all users** or for **specific users** from admin **Feature Flags** (full admins). Flags are defined in code in `be/services/feature_flags.FLAGS` (add a key there and a row via migration); state lives in `feature_flags` / `feature_flag_users`.

- App: `GET /v1/feature-flags` → `{"flags": {"payments": true}}` for the signed-in user. `mobile/src/context/FeatureFlagsContext.tsx` (`useFeatureFlags().isEnabled('payments')`) loads it at sign-in and whenever the app returns to the foreground; everything is off until the server says otherwise.
- Server: check with `feature_flags.is_enabled(db, key, user_id)` wherever a flag changes what a user may do — don't rely on the app hiding UI.
- Admin API: `GET /feature-flags`, `GET|PUT /feature-flags/{key}` (`enabled_for_all`), `POST /feature-flags/{key}/users`, `DELETE /feature-flags/{key}/users/{user_id}`.

| Flag | What it controls |
|------|------------------|
| `payments` | In-app purchases (paywall + Google Play Billing), see below |

---

## Payments (Google Play Billing)

Books have an `access_type`: `free`, `subscriber_only` (needs an active subscription), or `prime_only` (bought once per book at `prime_price`, owned forever). **All paid content is sold in the Android app through Google Play Billing** — no other payment provider, and the website doesn't sell anything. iOS (Apple in-app purchase) is planned later.

**Behind the `payments` feature flag (off by default).** Until an admin turns it on (admin **Feature Flags**: for all users, or for chosen users), a user can play every book, `/v1/payments/plans` returns nothing, and the app shows no Prime/Subscriber badges, buy buttons or Subscription section. `/google/verify` is never gated, so a purchase that did go through is always honoured.

### How it fits together

- **Prime book** → a Play **one-time product** `book_<book id hex>`. Saving a Prime book in the admin (create / title / price / publish changes) pushes it to Play automatically (`services/payment_service.sync_book_to_play`); unpublishing or leaving Prime stops new sales, buyers keep it.
- **Subscription plan** → a Play **auto-renewing subscription** `plan_<plan id hex>` with one base plan named after its period (`p1m`, `p3m`, `p6m`, `p1y`). Managed in admin **Billing → Subscription Plans**; billing period can't change after creation (Play rule).
- **Sync status** for both shows in admin **Billing** (`synced` / `pending` / `error` / `disabled`) with a re-sync button.
- **App purchase**: `expo-iap` (Play Billing Library 9) opens Google's payment sheet, passing the user's id (hex) as `obfuscatedAccountId`. The app sends the purchase token to `POST /v1/payments/google/verify`; the server reads it back from the Play Developer API, records it in `store_purchases`, unlocks it, and **acknowledges it** (Google refunds anything unacknowledged after 3 days). Then the app finishes the transaction.
- **Real-time developer notifications** (renewals, cancellations, account hold, refunds, purchases the app never reported) arrive via Cloud Pub/Sub push at `POST /v1/payments/google/rtdn`, authenticated by Google's OIDC token. State is always re-read from Google.
- **Entitlement**: Prime = a `book_purchases` row; subscription = a `store_purchases` row in `active` / `grace_period` / `canceled` with `expires_at` in the future (`on_hold`, `paused`, `expired`, `refunded` give no access).

Other endpoints: `GET /v1/payments/access/{book_id}` (checked before playback, includes the Play product id), `GET /v1/payments/plans`, `GET /v1/payments/subscription`. Admin: `/billing/plans` CRUD + `/sync`, `GET /billing/prime-books` + `/sync`, `GET /billing/purchases`.

### Setup (Play Console — one time)

1. **Payments profile** set up for the developer account.
2. Upload an app build that includes `expo-iap` to the **Internal testing** track (Play only allows products once a billing-enabled build exists).
3. **Google Cloud service account** with a JSON key → save as `be/secrets/google-play-service-account.json` (gitignored; `be/secrets/` is mounted into the backend container in every compose file). In Play Console → *Users and permissions*, invite its email with: *View financial data*, *Manage orders and subscriptions*, *Manage store presence*.
4. **RTDN**: create a Pub/Sub topic, grant `google-play-developer-notifications@system.gserviceaccount.com` *Publisher* on it, set it in Play Console → *Monetization setup*, and create a **push** subscription to `https://<api>/v1/payments/google/rtdn` with authentication enabled. Put the push audience in `GOOGLE_PLAY_RTDN_AUDIENCE` and the push service account email in `GOOGLE_PLAY_RTDN_SERVICE_ACCOUNT`.
5. **License testers** (Play Console → *License testing*) for test purchases without real charges.

Env: `GOOGLE_PLAY_PACKAGE_NAME`, `GOOGLE_PLAY_SERVICE_ACCOUNT_PATH`, `GOOGLE_PLAY_RTDN_AUDIENCE`, `GOOGLE_PLAY_RTDN_SERVICE_ACCOUNT`, `GOOGLE_PLAY_PRICE_REGIONS` (default `IN`; other regions get Google-converted prices), `GOOGLE_PLAY_LISTING_LANGUAGE` (default `en-GB`, must be the app's default Play listing language), `GOOGLE_PLAY_SYNC_ENABLED` (off by default for local dev).

### Testing purchases

Google Play Billing only works in a build **installed from a Play testing track** (or a build with the same package and signing key as one uploaded there), signed in on the device with a **license tester** account. Purchases are free for testers and show as *Test* in admin.

### Limits worth knowing

- The paywall is enforced in the app; chapter audio on the CDN is not access-controlled, so a determined user with a URL can still fetch it.
- Downloaded books keep playing offline after a subscription lapses.
- `list_price` in admin is Shrota's catalogue price; actual earnings (after Google's fee and tax) are in Play Console financial reports.
