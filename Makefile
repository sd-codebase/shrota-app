.PHONY: staging-up staging-down staging-build staging-deploy staging-logs staging-migrate \
        prod-up prod-down prod-build prod-deploy prod-logs prod-migrate \
        local-up local-down local-build local-logs \
        dev-up dev-down dev-build dev-logs dev-restart-be dev-restart-ui \
        dev-seed dev-seed-verify

# =============================================================================
# STAGING COMMANDS
# =============================================================================
staging-up:
	docker compose --env-file .env.staging -f docker-compose.staging.yml up -d

staging-down:
	docker compose --env-file .env.staging -f docker-compose.staging.yml down

staging-build:
	docker compose --env-file .env.staging -f docker-compose.staging.yml up -d --build

# Full deploy: stops containers, removes frontend volume, rebuilds fresh
staging-deploy:
	docker compose --env-file .env.staging -f docker-compose.staging.yml down
	docker volume rm -f shrota-app_frontend_dist_staging
	docker compose --env-file .env.staging -f docker-compose.staging.yml up -d --build

staging-logs:
	docker compose --env-file .env.staging -f docker-compose.staging.yml logs -f

staging-migrate:
	docker exec -it shrota-postgres-staging psql -U shrota -d shrota_staging -c "\
		ALTER TABLE authors ADD COLUMN IF NOT EXISTS photo VARCHAR(500) NULL; \
		ALTER TABLE artists ADD COLUMN IF NOT EXISTS photo VARCHAR(500) NULL; \
		ALTER TABLE publications ADD COLUMN IF NOT EXISTS photo VARCHAR(500) NULL; \
		ALTER TABLE genres ADD COLUMN IF NOT EXISTS thumbnail VARCHAR(500) NULL; \
		ALTER TABLE books ADD COLUMN IF NOT EXISTS is_adult BOOLEAN DEFAULT FALSE; \
		ALTER TABLE chapters ADD COLUMN IF NOT EXISTS image VARCHAR(500) NULL;"

# =============================================================================
# PRODUCTION COMMANDS
# =============================================================================
prod-up:
	docker compose --env-file .env.production -f docker-compose.prod.yml up -d

prod-down:
	docker compose --env-file .env.production -f docker-compose.prod.yml down

prod-build:
	docker compose --env-file .env.production -f docker-compose.prod.yml up -d --build

# Full deploy: stops containers, removes frontend volume, rebuilds fresh
prod-deploy:
	docker compose --env-file .env.production -f docker-compose.prod.yml down
	docker volume rm -f shrota-app_frontend_dist
	docker compose --env-file .env.production -f docker-compose.prod.yml up -d --build

prod-logs:
	docker compose --env-file .env.production -f docker-compose.prod.yml logs -f

prod-migrate:
	docker exec -it shrota-postgres psql -U shrota -d shrota -c "\
		ALTER TABLE authors ADD COLUMN IF NOT EXISTS photo VARCHAR(500) NULL; \
		ALTER TABLE artists ADD COLUMN IF NOT EXISTS photo VARCHAR(500) NULL; \
		ALTER TABLE publications ADD COLUMN IF NOT EXISTS photo VARCHAR(500) NULL; \
		ALTER TABLE genres ADD COLUMN IF NOT EXISTS thumbnail VARCHAR(500) NULL; \
		ALTER TABLE books ADD COLUMN IF NOT EXISTS is_adult BOOLEAN DEFAULT FALSE; \
		ALTER TABLE chapters ADD COLUMN IF NOT EXISTS image VARCHAR(500) NULL;"

# =============================================================================
# LOCAL COMMANDS
# =============================================================================
local-up:
	docker compose --env-file .env.local -f docker-compose.local.yml up -d

local-down:
	docker compose --env-file .env.local -f docker-compose.local.yml down

local-build:
	docker compose --env-file .env.local -f docker-compose.local.yml up -d --build

local-logs:
	docker compose --env-file .env.local -f docker-compose.local.yml logs -f

# =============================================================================
# DEV COMMANDS (with hot-reload)
# =============================================================================
dev-up:
	docker compose --env-file .env.dev -f docker-compose.dev.yml up -d

dev-down:
	docker compose --env-file .env.dev -f docker-compose.dev.yml down

dev-build:
	docker compose --env-file .env.dev -f docker-compose.dev.yml up -d --build

dev-logs:
	docker compose --env-file .env.dev -f docker-compose.dev.yml logs -f

dev-logs-be:
	docker compose --env-file .env.dev -f docker-compose.dev.yml logs -f backend

dev-logs-ui:
	docker compose --env-file .env.dev -f docker-compose.dev.yml logs -f frontend

dev-restart-be:
	docker compose --env-file .env.dev -f docker-compose.dev.yml restart backend

dev-restart-ui:
	docker compose --env-file .env.dev -f docker-compose.dev.yml restart frontend

dev-shell-be:
	docker exec -it shrota-backend-dev /bin/bash

dev-shell-db:
	docker exec -it shrota-postgres-dev psql -U shrota -d shrota

dev-seed:
	docker exec shrota-backend-dev python scripts/seed_data.py

dev-seed-verify:
	docker exec shrota-postgres-dev psql -U shrota -d shrota -c " \
		SELECT 'languages' as table_name, count(*) as count FROM languages \
		UNION ALL SELECT 'genres', count(*) FROM genres \
		UNION ALL SELECT 'authors', count(*) FROM authors \
		UNION ALL SELECT 'artists', count(*) FROM artists \
		UNION ALL SELECT 'publications', count(*) FROM publications \
		UNION ALL SELECT 'books', count(*) FROM books \
		UNION ALL SELECT 'chapters', count(*) FROM chapters;"
