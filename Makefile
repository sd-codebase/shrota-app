.PHONY: staging-up staging-down staging-build staging-deploy staging-logs staging-migrate \
        prod-up prod-down prod-build prod-deploy prod-logs prod-migrate \
        local-up local-down

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
	docker exec -it shrota-postgres-staging psql -U shrota -d shrota_staging -c "ALTER TABLE chapters ADD COLUMN IF NOT EXISTS image VARCHAR(500) NULL;"

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
	docker exec -it shrota-postgres psql -U shrota -d shrota -c "ALTER TABLE chapters ADD COLUMN IF NOT EXISTS image VARCHAR(500) NULL;"

# =============================================================================
# LOCAL COMMANDS
# =============================================================================
local-up:
	docker compose -f docker-compose.local.yml up -d

local-down:
	docker compose -f docker-compose.local.yml down
