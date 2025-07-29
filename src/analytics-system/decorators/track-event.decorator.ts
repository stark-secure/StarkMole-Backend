import { SetMetadata } from "@nestjs/common"

export const TRACK_EVENT_KEY = "track_event"

export interface TrackEventOptions {
  event: string
  properties?: Record<string, any>
}

export const TrackEvent = (options: TrackEventOptions) => SetMetadata(TRACK_EVENT_KEY, options)
