const colors = {
  reset: '\x1b[0m',
  red: '\x1b[31m',
  green: '\x1b[32m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  gray: '\x1b[90m',
};

function timestamp(): string {
  return new Date().toISOString().replace('T', ' ').substring(0, 19);
}

const logger = {
  info(message: string, ...args: any[]): void {
    console.log(
      `${colors.gray}${timestamp()}${colors.reset} ${colors.green}[INFO]${colors.reset} ${message}`,
      ...args
    );
  },

  error(message: string, ...args: any[]): void {
    console.error(
      `${colors.gray}${timestamp()}${colors.reset} ${colors.red}[ERROR]${colors.reset} ${message}`,
      ...args
    );
  },

  warn(message: string, ...args: any[]): void {
    console.warn(
      `${colors.gray}${timestamp()}${colors.reset} ${colors.yellow}[WARN]${colors.reset} ${message}`,
      ...args
    );
  },

  debug(message: string, ...args: any[]): void {
    if (process.env.NODE_ENV === 'development') {
      console.log(
        `${colors.gray}${timestamp()}${colors.reset} ${colors.blue}[DEBUG]${colors.reset} ${message}`,
        ...args
      );
    }
  },
};

export default logger;