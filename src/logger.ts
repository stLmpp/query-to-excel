export class Logger {
  static log: (...args: unknown[]) => void;
  static error: (...args: unknown[]) => void;
  static warn: (...args: unknown[]) => void;

  static {
    const methods = ['log', 'error', 'warn'] as const;
    for (const method of methods) {
      this[method] = (...args: unknown[]) => console[method](`[${new Date().toLocaleString()}]`, ...args);
    }
  }
}
