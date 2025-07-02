import { registerAs } from '@nestjs/config';

export default registerAs('app', () => ({
  port: parseInt(process.env.PORT, 10) || 3000,
  nodeEnv: process.env.NODE_ENV || 'development',
  databaseUrl: process.env.DATABASE_URL,
  jwtSecret: process.env.JWT_SECRET,
  bcryptSaltRounds: parseInt(process.env.BCRYPT_SALT_ROUNDS || '12', 10),
  leaderboardRecalculationStrategy: process.env.LEADERBOARD_RECALCULATION_STRATEGY || 'batch',
  redisHost: process.env.REDIS_HOST || 'localhost',
  redisPort: parseInt(process.env.REDIS_PORT || '6379', 10),
  starknetPrivateKey: process.env.STARKNET_PRIVATE_KEY,
  starknetAccountAddress: process.env.STARKNET_ACCOUNT_ADDRESS,
  mintContractAddress: process.env.MINT_CONTRACT_ADDRESS,
  // Add more config values as needed
}));
