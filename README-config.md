# Centralized Configuration Management

## Overview
This project uses a centralized configuration system based on `@nestjs/config`, `.env` files, and a strongly-typed config service. All environment variables are loaded, validated, and accessed through a single, injectable service for security, maintainability, and scalability.

## How It Works
- **Config files** are located in `src/common/config/`:
  - `configuration.ts`: Loads and maps all environment variables.
  - `validation.ts`: Joi schema for validating required variables.
  - `typed-config.service.ts`: Injectable, strongly-typed config service.
- **.env files**: Use `.env.development`, `.env.production`, and `.env` for environment-specific and default values.
- **AppModule**: Loads config globally, validates with Joi, and exposes the typed config service.

## Adding New Config Values
1. Add the variable to `.env` files.
2. Add it to `configuration.ts` and `validation.ts`.
3. Add a getter in `typed-config.service.ts` and update the `AppConfig` interface.
4. Inject and use `TypedConfigService` in your modules/services.

## How .env Files Are Selected
- The app uses `.env.production` if `NODE_ENV=production`, otherwise `.env.development`.
- `.env` is always loaded as a fallback.

## Environment Variables Reference
| Variable                          | Description                                 |
|------------------------------------|---------------------------------------------|
| NODE_ENV                          | Application environment (dev/prod/test)     |
| PORT                              | HTTP server port                            |
| DATABASE_URL                      | Database connection string                  |
| JWT_SECRET                        | JWT signing secret                          |
| BCRYPT_SALT_ROUNDS                | Bcrypt salt rounds for password hashing     |
| LEADERBOARD_RECALCULATION_STRATEGY| Leaderboard recalculation mode              |
| REDIS_HOST                        | Redis host for cache                        |
| REDIS_PORT                        | Redis port for cache                        |
| STARKNET_PRIVATE_KEY              | StarkNet private key                        |
| STARKNET_ACCOUNT_ADDRESS          | StarkNet account address                    |
| MINT_CONTRACT_ADDRESS             | Mint contract address                       |

## Security
- `.env*` files should be excluded from version control via `.gitignore`.
- Never hardcode secrets in code.

## Example Usage
```typescript
import { TypedConfigService } from 'src/common/config/typed-config.service';

@Injectable()
export class MyService {
  constructor(private readonly config: TypedConfigService) {}

  getSecret() {
    return this.config.jwtSecret;
  }
}
```
