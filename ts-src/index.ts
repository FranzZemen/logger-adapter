export {
  ExecutionContext, isExecutionContext, validate as validateExecutionContext
} from '@franzzemen/execution-context';
export {
  AppExecutionContext, isAppExecutionContext, validate as validateAppExecutionContext
} from '@franzzemen/app-execution-context';

export * from './logger-config.js';
export * from './color-constants.js';

import {loadFromModule} from '@franzzemen/module-factory';
import deepmerge from 'deepmerge';
import {createRequire} from 'module';
import {inspect} from 'util';
import {isPromise} from 'util/types';
import {FgCyan, FgGreen, FgMagenta, FgRed, FgYellow, Reset} from './color-constants.js';
import {ConsoleLogger} from './console-logger.js';
import {LogExecutionContext, LoggingOptions, LogLevel, LogLevelManagement, validate} from './logger-config.js';

const requireModule = createRequire(import.meta.url);
const moment = requireModule('moment');
const utc = moment.utc;


/**
 * Logger - any object that provides the following interface
 */
export interface Logger {
  error(): boolean;

  error(err, ...params);

  warn(): boolean;

  warn(data, message?: string, ...params);

  info(): boolean;

  info(data, message?: string, ...params);

  debug(): boolean;

  debug(data, message?: string, ...params);

  trace(): boolean;
  trace(data, message?: string, ...params);

  setLevel(logLevel: LogLevel | string);
}


export class LoggerAdapter implements Logger {
  protected static _noLogging = 0;
  protected static _error = 1;
  protected static _warn = 2;
  protected static _info = 3;
  protected static _debug = 4;
  protected static _trace = 5;

  protected static levels: (LogLevel | string)[] = [LogLevel.none, LogLevel.error, LogLevel.warn, LogLevel.info, LogLevel.debug, LogLevel.trace];

  protected levelLabels: string[];

  protected level: number;

  protected ec: LogExecutionContext;

  private timingContext = '';
  private start: number = undefined;
  private interim: number = undefined;

  private attributesAsString: string;

  private nativeLogger: Logger;

  private pendingEsLoad = false;


  /**
   * All parameters optional.
   * @param ec The context. It will default to LogDefaults.
   * @param repo Provides logging info that the log event occurred in this repo
   * @param source Provides logging info that the log event occurred in this source file
   * @param method Provides logging info that the log event occurred in this method
   * @param nativeLogger  If passed, will use this over the native nativeLogger or a module definition
   */
  constructor(ec: LogExecutionContext = {}, public repo = '', public source = '', public method = '', nativeLogger?: Logger) {
    if (!ec.validated) {
      const result = validate(ec);
      if (isPromise(result)) {
        let localLogger = nativeLogger;
        if (!localLogger) {
          localLogger = new ConsoleLogger();
        }
        const err = new Error('LogExecutionContext validation should not result in async behavior');
        localLogger.error(err);
        throw err;
      }
      if (result !== true) {
        let localLogger = nativeLogger;
        if (!localLogger) {
          localLogger = new ConsoleLogger();
        }
        const msg = 'LogExecutionContext failed validation';
        localLogger.warn(inspect(result, false, 5), msg);
        const err = new Error(msg);
        localLogger.error(err);
        throw err;
      }
    }
    this.ec = deepmerge({}, ec);
    // Use the console nativeLogger unless another one is provided, or later loaded by module
    if (nativeLogger) {
      this.nativeLogger = nativeLogger;
      // Set level based on level management
      this.setLevel(this.ec.log.options.level);
    } else {
      this.nativeLogger = new ConsoleLogger();
      const module = this.ec.log.nativeLogger?.module;
      if (module && module.moduleName && (module.constructorName || module.functionName)) {
        const impl = loadFromModule<Logger>(module, this.nativeLogger);
        if (isPromise(impl)) {
          this.pendingEsLoad = true;
          this.nativeLogger.warn(this.ec.log.nativeLogger, 'Detected ES module as nativeLogger implementation, using native nativeLogger until it loads');
          // Not returning promise.  When it's done, we switch loggers.
          impl
            .then(logger => {
              this.nativeLogger.warn('ES module as nativeLogger implementation loaded dynamically');
              this.nativeLogger = logger;
              this.pendingEsLoad = false;
              // Set level based on level management
              this.setLevel(this.ec.log.options.level);
            });
        } else {
          this.nativeLogger = impl;
          // Set level based on level management
          this.setLevel(this.ec.log.options.level);
        }
      }
    }


    this.initializeOverrides();
    // Overrides could have overridden, and need to recalculate
    this.setLevel(this.ec.log.options.level);
    this.attributesAsString = ''
      + (this.ec.log.options.hideAppContext === false ? '; appContext: ' + this.ec.appContext : '')
      + (this.ec.log.options.hideRepo === false ? '; repo: ' + this.repo : '')
      + (this.ec.log.options.hideSourceFile === false ? '; sourceFile: ' + this.source : '')
      + (this.ec.log.options.hideMethod === false ? '; method: ' + this.method : '')
      + (this.ec.log.options.hideThread === false ? '; thread: ' + this.ec.execution.thread : '')
      + (this.ec.log.options.hideRequestId === false ? '; requestId: ' + this.ec.execution.requestId : '')
      + (this.ec.log.options.hideLevel === false ? '; logLevel: ' + LoggerAdapter.levels[this.level] : '');
  }

  get doInspect(): boolean {
    return this.ec.log.options.inspectOptions.enabled;
  }

  get inspectDepth(): number {
    return this.ec.log.options.inspectOptions.depth;
  }

  get inspectHidden(): boolean {
    return this.ec.log.options.inspectOptions.showHidden;
  }

  get doFlattenAttribs(): boolean {
    return this.ec.log.options.flatten;
  }

  get hideTimestamp(): boolean {
    return this.ec.log.options.hideTimestamp;
  }

  get hideSevPrefix(): boolean {
    return this.ec.log.options.hideSeverityPrefix;
  }

  get hideAppContext(): boolean {
    return this.ec.log.options.hideAppContext;
  }

  get hideRepo(): boolean {
    return this.ec.log.options.hideRepo;
  }

  get hideSourceFile(): boolean {
    return this.ec.log.options.hideSourceFile;
  }

  get hideMethod(): boolean {
    return this.ec.log.options.hideMethod;
  }

  get hideThread(): boolean {
    return this.ec.log.options.hideThread;
  }

  get hideRequestId(): boolean {
    return this.ec.log.options.hideRequestId;
  }

  get hideLevel(): boolean {
    return this.ec.log.options.hideLevel;
  }

  get timestampFormat(): string {
    return this.ec.log.options.timestampFormat;
  }

  setMethod(_method: string): LoggerAdapter {
    this.method = _method;
    return this;
  }

  error(): boolean;
  error(err, data?: any, color?: string);
  error(err?, data?: any, color: string = FgRed): boolean | void {
    if(err && this.isErrorEnabled()) {
      this.log(this.nativeLogger.error, data, err, color, 'ERROR:');
    } else {
      return this.isErrorEnabled();
    }
  }

  warn(): boolean;
  warn(data, message?: string, color?: string);
  warn(data?, message?: string, color: string = FgYellow): boolean | void {
    if (this.isWarnEnabled()) {
      this.log(this.nativeLogger.warn, data, message, color, 'WARN:');
    }
  }

  info(): boolean;
  info(data, message?: string, color?: string);
  info(data?, message?: string, color: string = FgGreen): boolean | void {
    if (this.isInfoEnabled()) {
      this.log(this.nativeLogger.info, data, message, color, 'INFO:');
    }
  }

  debug(): boolean;
  debug(data, message?: string, color?: string);
  debug(data?, message?: string, color: string = FgCyan): boolean | void {
    if (this.isDebugEnabled()) {
      this.log(this.nativeLogger.debug, data, message, color, 'DEBUG:');
    }
  }

  trace(): boolean;
  trace(data, message?: string, color?: string);
  trace(data?, message?: string, color: string = FgMagenta): boolean | void {
    if (this.isTracingEnabled()) {
      this.log(this.nativeLogger.debug, data, message, color, 'TRACE:');
    }
  }

  setLevel(logLevel: LogLevel | string) {
    this.level = LoggerAdapter.levels.indexOf(logLevel);
    if(this.ec.log.nativeLogger.logLevelManagement === LogLevelManagement.Adapter) {
      this.nativeLogger.setLevel(logLevel);
    }
  }

  startTiming(context) {
    if (this.start) {
      this.stopTiming();
    }
    this.start = Date.now();
    this.interim = this.start;
    this.timingContext = context;
    this.trace({timing: context, start: this.start}, 'Start Timing');
  }

  interimTiming(interimContext) {
    if (this.start) {
      const now = Date.now();
      this.trace({
        timing: this.timingContext,
        subTiming: interimContext,
        elapsed: (now - this.start),
        interim: (now - this.interim)
      }, 'interimTiming');
      this.interim = now;
    }
  }

  stopTiming() {
    if (this.start) {
      const now = Date.now();
      this.trace({timing: this.timingContext, elapsed: (now - this.start)}, 'stopTiming');
      this.start = undefined;
      this.interim = undefined;
      this.timingContext = '';
    }
  }

  public isErrorEnabled(): boolean {
    const mgmt = this.ec.log.nativeLogger.logLevelManagement;
    if(mgmt && mgmt === LogLevelManagement.Native) {
      return this.nativeLogger.error();
    } else {
      return this.level > LoggerAdapter._noLogging;
    }
  }

  public isWarnEnabled(): boolean {
    const mgmt = this.ec.log.nativeLogger.logLevelManagement;
    if(mgmt && mgmt === LogLevelManagement.Native) {
      return this.nativeLogger.warn();
    } else {
      return this.level > LoggerAdapter._error;
    }
  }

  public isInfoEnabled(): boolean {
    const mgmt = this.ec.log.nativeLogger.logLevelManagement;
    if(mgmt && mgmt === LogLevelManagement.Native) {
      return this.nativeLogger.info();
    } else {
      return this.level > LoggerAdapter._warn;
    }
  }

  public isDebugEnabled(): boolean {
    const mgmt = this.ec.log.nativeLogger.logLevelManagement;
    if(mgmt && mgmt === LogLevelManagement.Native) {
      return this.nativeLogger.debug();
    } else {
      return this.level > LoggerAdapter._info;
    }
  }

  public isTracingEnabled(): boolean {
    const mgmt = this.ec.log.nativeLogger.logLevelManagement;
    if(mgmt && mgmt === LogLevelManagement.Native) {
      return this.nativeLogger.trace();
    } else {
      return this.level > LoggerAdapter._debug;
    }
  }

  protected log(logMethod: (color: string, logMessage: string) => void, data: any, message: string, color: string, cwcPrefix: string) {
    // TODO modify to support cloud watch format
    if (data && (typeof data === 'string')) {
      const str = `${this.hideTimestamp ? '' : utc().format(this.timestampFormat) + ' '}${this.hideSevPrefix ? '' : cwcPrefix + ' '}${(message ? message + ' ' + data + this.attributesAsString : data + this.attributesAsString)}`;
      logMethod(color + str + Reset, '');
    } else if (this.doFlattenAttribs) {
      const str = `${this.hideTimestamp ? '' : utc().format(this.timestampFormat) + ' '}${this.hideSevPrefix ? '' : cwcPrefix + ' '}${(message ? message + ' ' + this.attributesAsString : this.attributesAsString)}` + '\r\n' + Reset + inspect(this.getLogObject(data), this.inspectHidden, this.inspectDepth, true);
      logMethod(color + str + Reset, '');
    } else {
      const str = `${this.hideTimestamp ? '' : utc().format(this.timestampFormat) + ' '}${this.hideSevPrefix ? '' : cwcPrefix + ' '}` + '\r\n' + Reset + inspect(this.getLogObject(data, message), this.inspectHidden, this.inspectDepth, true);
      if (this.hideTimestamp && this.hideSevPrefix) {
        logMethod(Reset + str, '');
      } else {
        logMethod(color + str + Reset, '');
      }
    }
  }

  private overrideMatches(override: string | string[], mustMatch: string): true | false | 'no conflict' {
    if (override) {
      if (typeof override === 'string') {
        return override === mustMatch;
      } else {
        return override.some(over => over === mustMatch);
      }
    } else {
      return 'no conflict';
    }
  }

  private initializeOverrides() {
    // Repos dominates.  If an override matches repo, and doesn't conflict on source or method, use it.
    // If no repo, if an override matches method with no repo, and doesn't conflict on method, use it.
    // If no repo and no source, if an override matches on method, with no repo or source, use it.
    const overrides = this.ec.log.overrides?.find(override => {
      const repoMatch = this.overrideMatches(override.repo, this.repo);
      if (repoMatch === false) {
        return false;
      } else if (repoMatch === 'no conflict') {
        // Not fixed on repo
        const sourceMatch = this.overrideMatches(override.source, this.source);
        if (sourceMatch === false) {
          return false;
        } else if (sourceMatch === 'no conflict') {
          // Not fixed on source
          const methodMatch = this.overrideMatches(override.method, this.method);
          // Need method to be fixed
          if (methodMatch === false || methodMatch === 'no conflict') {
            return false;
          } else {
            return true;
          }
        } else {
          // Fixed on source
          const methodMatch = this.overrideMatches(override.method, this.method);
          // Need to be fixed or no conflict on method
          if (methodMatch === false) {
            return false;
          } else { // true or no conflict, since source is specified
            return true;
          }
        }
      } else {
        // Repo match is fixed
        const sourceMatch = this.overrideMatches(override.source, this.source);
        // Source must be fixed or no conflict
        if (sourceMatch === false) {
          return false;
        } else {
          // Method must be fixed or no conflict
          const methodMatch = this.overrideMatches(override.method, this.method);
          if (methodMatch === false) {
            return false;
          } else {
            return true;
          }
        }
      }
    });
    if (overrides) {
      this.ec.log.options = deepmerge<LoggingOptions>(this.ec.log.options, overrides.options);
    }
  }


  private getLogObject(data, message?: string): any {
    let logObject = {};
    if (message) {
      logObject['message'] = message;
    }
    if (!this.doFlattenAttribs) {
      if (!this.hideAppContext) {
        logObject['appContext'] = this.ec.appContext;
      }
      if (this.hideRepo) {
        logObject['repo'] = this.repo;
      }
      if (!this.hideSourceFile) {
        logObject['sourceFile'] = this.source;
      }
      if (!this.hideMethod) {
        logObject['method'] = this.method;
      }
      if (!this.hideThread) {
        logObject['thread'] = this.ec.execution.thread;
      }
      if (!this.hideRequestId) {
        logObject['requestid'] = this.ec.execution.requestId;
      }
      if (!this.hideLevel) {
        logObject['logLevel'] = LoggerAdapter.levels[this.level];
      }
    }
    if (data) {
      logObject['data'] = data;
    }
    return logObject;
  }
}

