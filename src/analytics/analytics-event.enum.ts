export enum AnalyticsEvent {
  // General Events
  SESSION_STARTED = 'SESSION_STARTED',
  SESSION_ENDED = 'SESSION_ENDED',
  CHALLENGE_ATTEMPTED = 'CHALLENGE_ATTEMPTED',
  WALLET_CONNECTED = 'WALLET_CONNECTED',
  SCORE_SUBMITTED = 'SCORE_SUBMITTED',

  // User Events
  UserRegistered = 'user.registered',
  UserLoggedIn = 'user.logged_in',
  UserLoggedOut = 'user.logged_out',
  UserProfileUpdated = 'user.profile_updated',
  UserDeleted = 'user.deleted',

  // Challenge Events
  ChallengeStarted = 'challenge.started',
  ChallengeCompleted = 'challenge.completed',
  ChallengeFailed = 'challenge.failed',
  ChallengeAbandoned = 'challenge.abandoned',

  // Claim Events
  ClaimSubmitted = 'claim.submitted',
  ClaimApproved = 'claim.approved',
  ClaimRejected = 'claim.rejected',
  ClaimUpdated = 'claim.updated',

  // Token Events
  TokenMinted = 'token.minted',
  TokenTransferred = 'token.transferred',
  TokenBurned = 'token.burned',
  TokenStaked = 'token.staked',
  TokenUnstaked = 'token.unstaked',

  // Game Events
  GameStarted = 'game.started',
  GameCompleted = 'game.completed',
  GamePaused = 'game.paused',
  GameResumed = 'game.resumed',
  LevelCompleted = 'level.completed',
  AchievementUnlocked = 'achievement.unlocked',

  // System Events
  ErrorOccurred = 'system.error',
  ApiEndpointCalled = 'api.endpoint_called',
  DatabaseQuery = 'database.query',
  ExternalServiceCall = 'external.service_call',
}
