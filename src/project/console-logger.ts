import {FgCyan, FgGreen, FgMagenta, FgRed, FgYellow, Reset} from './color-constants.js';
import {Logger, LogLevel} from './index.js';


export class ConsoleLogger implements Logger {
  error(): boolean;
  error(err: any, data?: any, color?: string): boolean | void;
  error(err?:any, data?: any, color: string = FgRed): boolean | void {
    if (!err && !data) {
      return true;
    }
    if (data) {
      console.error(color, err, data);
    } else {
      console.error(color, err);
    }
  }

  warn(): boolean;
  warn(data: any, message?: string, color?: string): boolean;
  warn(data?: any, message?: string, color: string = FgYellow): boolean {
    if (!data && !message) {
      return true;
    }
    if (message) {
      console.warn(color, data, message);
    } else {
      console.warn(color, data);
    }
    return false;
  }

  info(): boolean;
  info(data: any, message?: string, color?: string): boolean;
  info(data?: any, message?: string, color: string = FgGreen): boolean {
    if (!data && !message) {
      return true;
    }
    if (message) {
      console.info(color, data, message);
    } else {
      console.info(color, data);
    }
    return false;
  }

  debug(): boolean;
  debug(data: any, message?: string, color?: string): boolean;
  debug(data?: any, message?: string, color: string = FgCyan): boolean {
    if (!data && !message) {
      return false;
    }
    if (message) {
      console.debug(color, data, message);
    } else {
      console.debug(color, data);
    }
    return false;
  }

  trace(): boolean;
  trace(data: any, message?: string, color?: string): boolean;
  trace(data?: any, message?: string, color: string = FgMagenta): boolean {
    if (!data && !message) {
      return true;
    }
    if (message) {
      console.trace(color, data, message);
    } else {
      console.trace(color, data);
    }
    return false;
  }

  setLevel(logLevel: LogLevel | string) {
    // Do nothing...use LoggerAdapter in 'adapter' mode.
  }
}

