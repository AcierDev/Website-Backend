export class LoggerService {
  private static instance: LoggerService;

  public static getInstance(): LoggerService {
    if (!LoggerService.instance) {
      LoggerService.instance = new LoggerService();
    }
    return LoggerService.instance;
  }

  public info(message: string, context?: any): void {
    console.log(`[INFO] ${message}`, context || "");
  }

  public error(message: string, error?: Error): void {
    console.error(`[ERROR] ${message}`, error || "");
  }

  public warn(message: string, context?: any): void {
    console.warn(`[WARN] ${message}`, context || "");
  }
}
