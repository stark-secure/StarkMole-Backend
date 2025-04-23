🎯 StarkMole Backend
StarkMole Backend is the core NestJS-based backend service for StarkMole — a decentralized, on-chain whack-a-mole game built on the StarkNet ecosystem. This backend provides the infrastructure for wallet-based player sessions, leaderboard management, real-time scoring, and reward tracking, all powered by smart contracts and blockchain data.

🌐 Project Overview
Framework: NestJS with TypeScript

Platform: StarkNet (Scalable ZK-Rollup L2)

Purpose: Backend service for on-chain game logic, player profiles, session tracking, and leaderboard updates

🕹️ Key Features
Decentralized Gameplay: Syncs with StarkNet smart contracts for game logic and scorekeeping

Smart Contract Integrations: Verifies moles hit, rewards earned, and scores submitted on-chain

On-chain Leaderboards: Maintains verifiable top scores and player rankings

Wallet-Based Sessions: Authenticates players using crypto wallets

Daily Challenges: Backend logic for challenge-of-the-day modes and cooldown tracking

Modular Codebase: Clean structure for scalable game feature additions

⚙️ Prerequisites
Node.js (v14 or above)

npm or yarn

NestJS CLI (optional but recommended)

🚀 Setup Instructions
1. Fork the Repository
Start by forking the repo on GitHub.

2. Clone the Repository
git clone https://github.com/StarkMole/StarkMole-Backend.git
cd StarkMole-Backend
Alternatively, to start from scratch:

nest new StarkMole-Backend
cd StarkMole-Backend
3. Configure TypeScript & Git
Edit tsconfig.json to match project needs

Create .gitignore to exclude node_modules, dist, and .env

📦 Install Dependencies
Core Dependencies
npm install @nestjs/config @nestjs/typeorm typeorm pg
npm install @nestjs/jwt @nestjs/passport passport
npm install @nestjs/swagger
Utility Packages
npm install class-validator class-transformer


▶️ Running the Application
npm run start:dev
The development server will be available at:
🔗 http://localhost:3000

🛠️ Development Structure
src/
  ├── config/         # Configuration services
  ├── modules/        # Feature modules
  │   ├── auth/       # Wallet login & sessions
  │   ├── game/       # Game logic, score handling
  │   ├── leaderboard/# Ranking, rewards
  │   └── user/       # Player profiles & history
  └── shared/         # Reusable utils & middleware
🛡️ About StarkMole
StarkMole is a next-gen arcade game experience brought to Web3. Powered by Cairo and the StarkNet network, it combines skill-based gameplay with the trustless nature of blockchain. Players compete in fast-paced mole-whacking matches, prove their performance on-chain, and earn crypto-based rewards — all while having fun.

🤝 Contribute
Join us in shaping the future of on-chain gaming. Read our CONTRIBUTING.md to get started.

