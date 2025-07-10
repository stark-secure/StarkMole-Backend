export class ResponseUtil {
  static success(data: any, message?: string) {
    return {
      success: true,
      data,
      message: message || 'Operation successful',
      timestamp: new Date().toISOString(),
    };
  }

  static error(message: string, code?: string, details?: any) {
    return {
      success: false,
      error: {
        message,
        code: code || 'UNKNOWN_ERROR',
        details,
      },
      timestamp: new Date().toISOString(),
    };
  }

  static paginated(data: any[], total: number, page: number, limit: number) {
    return {
      success: true,
      data,
      pagination: {
        total,
        page,
        limit,
        totalPages: Math.ceil(total / limit),
      },
      timestamp: new Date().toISOString(),
    };
  }
}
