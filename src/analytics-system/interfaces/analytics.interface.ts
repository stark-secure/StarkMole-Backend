export interface AnalyticsEvent {
  event: string
  userId?: string
  sessionId: string
  timestamp: Date
  properties: Record<string, any>
  metadata?: {
    userAgent?: string
    ip?: string
    country?: string
    device?: string
    browser?: string
  }
}

export interface SessionEvent extends AnalyticsEvent {
  event: "session_start" | "session_end"
  properties: {
    duration?: number
    pageViews?: number
    actions?: number
  }
}

export interface GameEvent extends AnalyticsEvent {
  event: "game_start" | "game_end" | "game_pause" | "game_resume"
  properties: {
    gameId: string
    gameType: string
    level?: number
    score?: number
    duration?: number
    outcome?: "win" | "lose" | "abandoned"
  }
}

export interface RewardEvent extends AnalyticsEvent {
  event: "reward_claim" | "reward_view" | "reward_earned"
  properties: {
    rewardId: string
    rewardType: string
    rewardValue: number
    source: string
  }
}

export interface LeaderboardEvent extends AnalyticsEvent {
  event: "leaderboard_view" | "leaderboard_filter" | "leaderboard_share"
  properties: {
    leaderboardType: string
    timeframe?: string
    position?: number
    category?: string
  }
}

export interface InteractionEvent extends AnalyticsEvent {
  event: "button_click" | "link_click" | "form_submit" | "modal_open" | "modal_close"
  properties: {
    elementId?: string
    elementType: string
    page: string
    section?: string
    value?: string
  }
}

export interface AnalyticsProvider {
  track(event: AnalyticsEvent): Promise<void>
  identify(userId: string, properties: Record<string, any>): Promise<void>
  flush(): Promise<void>
}

export interface DashboardMetrics {
  activeUsers: number
  sessionsToday: number
  gamesPlayed: number
  rewardsClaimed: number
  topEvents: Array<{ event: string; count: number }>
  conversionFunnel: Array<{ step: string; users: number; conversionRate: number }>
  retentionData: Array<{ period: string; retentionRate: number }>
}
