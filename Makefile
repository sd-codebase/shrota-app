.PHONY: staging-up staging-down staging-build staging-logs prod-up prod-down prod-build prod-logs local-up local-down

# Staging commands
staging-up:
	docker compose --env-file .env.staging -f docker-compose.staging.yml up -d

staging-down:
	docker compose --env-file .env.staging -f docker-compose.staging.yml down

staging-build:
	docker compose --env-file .env.staging -f docker-compose.staging.yml up -d --build

staging-logs:
	docker compose --env-file .env.staging -f docker-compose.staging.yml logs -f

# Production commands
prod-up:
	docker compose --env-file .env.production -f docker-compose.prod.yml up -d

prod-down:
	docker compose --env-file .env.production -f docker-compose.prod.yml down

prod-build:
	docker compose --env-file .env.production -f docker-compose.prod.yml up -d --build

prod-logs:
	docker compose --env-file .env.production -f docker-compose.prod.yml logs -f

# Local commands
local-up:
	docker compose -f docker-compose.local.yml up -d

local-down:
	docker compose -f docker-compose.local.yml down
