// Stub for ResponseUtil
export class ResponseUtil {
  static success(data: any, message?: string) { return { success: true, data, message }; }
  static error(message: string, data?: any) { return { success: false, message, data }; }
}
