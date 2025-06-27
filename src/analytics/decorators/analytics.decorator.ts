import { SetMetadata } from '@nestjs/common';
import { AnalyticsEvent } from '../analytics-event.enum';

export const TRACK_EVENT_KEY = 'trackEvent';

export interface TrackEventOptions {
  event: AnalyticsEvent;
  includeRequestData?: boolean;
  includeResponseData?: boolean;
  extractUserId?: (req: any) => string;
  extractMetadata?: (req: any, res?: any) => Record<string, any>;
}

export const TrackEvent = (options: TrackEventOptions) =>
  SetMetadata(TRACK_EVENT_KEY, options);

// Example usage:
// @TrackEvent({
//   event: AnalyticsEvent.UserLoggedIn,
//   extractUserId: (req) => req.user?.id,
//   extractMetadata: (req) => ({ loginMethod: req.body.method })
// })
