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
