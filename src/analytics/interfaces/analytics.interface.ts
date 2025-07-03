export interface AnalyticsEventData {
  event: string;
  userId?: string;
  sessionId?: string;
  timestamp: Date;
  metadata?: Record<string, any>;
  ip?: string;
  userAgent?: string;
  source?: string;
}

export interface AnalyticsQueryParams {
  event?: string;
  userId?: string;
  from?: Date;
  to?: Date;
  page?: number;
  limit?: number;
  aggregation?: 'daily' | 'weekly' | 'monthly';
}

export interface AnalyticsAggregation {
  date: string;
  count: number;
  event: string;
}

export interface AnalyticsReport {
  totalEvents: number;
  events: AnalyticsEventData[];
  aggregations?: AnalyticsAggregation[];
  page: number;
  limit: number;
  totalPages: number;
}
