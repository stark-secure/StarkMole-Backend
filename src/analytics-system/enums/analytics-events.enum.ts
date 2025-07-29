export enum AnalyticsEvents {
  // Session Events
  SESSION_START = "session_start",
  SESSION_END = "session_end",

  // Game Events
  GAME_START = "game_start",
  GAME_END = "game_end",
  GAME_PAUSE = "game_pause",
  GAME_RESUME = "game_resume",

  // Reward Events
  REWARD_CLAIM = "reward_claim",
  REWARD_VIEW = "reward_view",
  REWARD_EARNED = "reward_earned",

  // Leaderboard Events
  LEADERBOARD_VIEW = "leaderboard_view",
  LEADERBOARD_FILTER = "leaderboard_filter",
  LEADERBOARD_SHARE = "leaderboard_share",

  // Interaction Events
  BUTTON_CLICK = "button_click",
  LINK_CLICK = "link_click",
  FORM_SUBMIT = "form_submit",
  MODAL_OPEN = "modal_open",
  MODAL_CLOSE = "modal_close",

  // Feature Events
  FEATURE_VIEW = "feature_view",
  FEATURE_INTERACTION = "feature_interaction",
  FEATURE_COMPLETION = "feature_completion",
}
