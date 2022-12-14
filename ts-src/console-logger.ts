import {FgCyan, FgGreen, FgMagenta, FgRed, FgYellow, Reset} from './color-constants.js';
import {Logger, LogLevel} from './index.js';


export class ConsoleLogger implements Logger {
  error(): boolean
  error(err, data?: any, color?: string);
  error(err?, data?: any, color: string = FgRed): boolean | void {
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
  warn(data, message?: string, color?: string);
  warn(data?, message?: string, color: string = FgYellow): boolean | void {
    if (!data && !message) {
      return true;
    }
    if (message) {
      console.warn(color, data, message);
    } else {
      console.warn(color, data);
    }
  }

  info(): boolean;
  info(data, message?: string, color?: string);
  info(data?, message?: string, color: string = FgGreen): boolean | void {
    if (!data && !message) {
      return true;
    }
    if (message) {
      console.info(color, data, message);
    } else {
      console.info(color, data);
    }
  }

  debug(): boolean;
  debug(data, message?: string, color?: string);
  debug(data?, message?: string, color: string = FgCyan): boolean | void {
    if (!data && !message) {
      return false;
    }
    if (message) {
      console.debug(color, data, message);
    } else {
      console.debug(color, data);
    }
  }

  trace(): boolean;
  trace(data, message?: string, color?: string);
  trace(data?, message?: string, color: string = FgMagenta): boolean | void {
    if (!data && !message) {
      return true;
    }
    if (message) {
      console.trace(color, data, message);
    } else {
      console.trace(color, data);
    }
  }

  setLevel(logLevel: LogLevel | string) {
    // Do nothing...use LoggerAdapter in 'adapter' mode.
  }
}

