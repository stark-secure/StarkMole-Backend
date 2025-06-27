export enum AnalyticsEvent {
  // User Events
  UserRegistered = 'user.registered',
  UserLoggedIn = 'user.logged_in',
  UserLoggedOut = 'user.logged_out',
  UserProfileUpdated = 'user.profile_updated',

  // Challenge Events
  ChallengeStarted = 'challenge.started',
  ChallengeCompleted = 'challenge.completed',
  ChallengeFailed = 'challenge.failed',
  ChallengeAbandoned = 'challenge.abandoned',

  // Claim Events
  ClaimSubmitted = 'claim.submitted',
  ClaimApproved = 'claim.approved',
  ClaimRejected = 'claim.rejected',
  ClaimWithdrawn = 'claim.withdrawn',

  // Token Events
  TokenMinted = 'token.minted',
  TokenTransferred = 'token.transferred',
  TokenBurned = 'token.burned',
  TokenStaked = 'token.staked',

  // Game Events
  GameSessionStarted = 'game.session_started',
  GameSessionEnded = 'game.session_ended',
  GameLevelCompleted = 'game.level_completed',
  GameAchievementUnlocked = 'game.achievement_unlocked',

  // System Events
  ApiError = 'api_error',
  DatabaseError = 'system.database_error',
  ExternalServiceError = 'system.external_service_error',
}
