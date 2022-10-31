export {
  ExecutionContext, isExecutionContext, validate as validateExecutionContext
} from '@franzzemen/execution-context';
export {
  AppExecutionContext, isAppExecutionContext, validate as validateAppExecutionContext
} from '@franzzemen/app-execution-context';

export * from './logger-config.js';
export * from './color-constants.js';

import {App, AppExecutionContext} from '@franzzemen/app-execution-context';
import {Execution} from '@franzzemen/execution-context';
import {loadFromModule} from '@franzzemen/module-factory';
import deepmerge from 'deepmerge';
import {createRequire} from 'module';
import {inspect} from 'util';
import {isPromise} from 'util/types';
import {FgCyan, FgGreen, FgMagenta, FgRed, FgYellow, Reset} from './color-constants.js';
import {ConsoleLogger} from './console-logger.js';
import {
  AttributesFormatOption,
  DataFormatOption,
  LogExecutionContext,
  LoggingOptions,
  LogLevel,
  LogLevelManagement,
  MessageFormatOption,
  validate
} from './logger-config.js';

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

interface AdapterAttributes {
  app: App,
  execution: Execution,
  repo: string;
  source: string;
  method: string;
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

  private nativeLogger: Logger;

  private pendingEsLoad = false;

  private attributes: AdapterAttributes;


  /**
   * All parameters optional.
   * @param ec The context. It will default to LogDefaults.
   * @param repo Provides logging info that the log event occurred in this repo
   * @param source Provides logging info that the log event occurred in this source file
   * @param method Provides logging info that the log event occurred in this method
   * @param nativeLogger  If passed, will use this over the native nativeLogger or a module definition
   */
  constructor(ec: LogExecutionContext = {}, repo = '', source = '', method = '', nativeLogger?: Logger) {
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
    this.attributes = {
      repo,
      source,
      method,
      app: this.ec.app,
      execution: this.ec.execution
    };
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

  get inspectColor(): boolean {
    return this.ec.log.options.inspectOptions.color;
  }

  get hidePrefix(): boolean {
    return this.ec.log.options.hidePrefix;
  }

  get hideTimestamp(): boolean {
    return this.ec.log.options.hideTimestamp;
  }

  get hideSeverity(): boolean {
    return this.ec.log.options.hideSeverity;
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

  get hideAuthorization(): boolean {
    return this.ec.log.options.hideAuthorization;
  }

  get timestampFormat(): string {
    return this.ec.log.options.timestampFormat;
  }

  get attributesFormat(): AttributesFormatOption {
    return this.ec.log.options.formatOptions.attributes;
  }

  get dataFormat(): DataFormatOption {
    return this.ec.log.options.formatOptions.data;
  }

  get messageFormat(): MessageFormatOption {
    return this.ec.log.options.formatOptions.message;
  }

  get colorize(): boolean {
    return this.ec.log.options.colorize;
  }

  private get attributesAsString(): string {
    let started = false;
    let result = '';
    if (!this.hideAppContext) {
      result += `appContext:${this.attributes.app.appContext}`;
      started = true;
    }
    if (!this.hideRepo) {
      result += `${started ? '; ' : ''}repo:${this.attributes.repo}`;
      started = true;
    }
    if (!this.hideSourceFile) {
      result += `${started ? '; ' : ''}source:${this.attributes.source}`;
      started = true;
    }
    if (!this.hideMethod) {
      result += `${started ? '; ' : ''}method:${this.attributes.method}`;
      started = true;
    }
    if (!this.hideThread) {
      result += `${started ? '; ' : ''}thread:${this.attributes.execution.thread}`;
      started = true;
    }
    if (!this.hideRequestId) {
      result += `${started ? '; ' : ''}requestId:${this.attributes.execution.requestId}`;
      started = true;
    }
    if (!this.hideAuthorization) {
      result += `${started ? '; ' : ''}authorization:${this.attributes.execution.authorization}`;
      started = true;
    }
    return result;
  }

  setMethod(_method: string): LoggerAdapter {
    this.attributes.method = _method;
    return this;
  }

  error(): boolean;

  error(err, data?: any, color?: string);

  error(err?, data?: any, color: string = FgRed): boolean | void {
    if (err && this.isErrorEnabled()) {
      const logResult = this.log(data, err, color, 'ERROR:');
    } else {
      return this.isErrorEnabled();
    }
  }

  warn(): boolean;

  warn(data, message?: string, color?: string);

  warn(data?, message?: string, color: string = FgYellow): boolean | void {
    if (data && this.isWarnEnabled()) {
      const logResult = this.log(data, message, color, 'WARN:');
      if (logResult.message) {
        this.nativeLogger.warn(logResult.data, logResult.message);
      } else {
        this.nativeLogger.warn(logResult.data);
      }
    } else {
      return this.isWarnEnabled();
    }
  }

  info(): boolean;

  info(data, message?: string, color?: string);

  info(data?, message?: string, color: string = FgGreen): boolean | void {
    if (data && this.isInfoEnabled()) {
      const logResult = this.log(data, message, color, 'INFO:');
      if (logResult.message) {
        this.nativeLogger.info(logResult.data, logResult.message);
      } else {
        this.nativeLogger.info(logResult.data);
      }
    } else {
      return this.isInfoEnabled();
    }
  }

  debug(): boolean;

  debug(data, message?: string, color?: string);

  debug(data?, message?: string, color: string = FgCyan): boolean | void {
    if (data && this.isDebugEnabled()) {
      const logResult = this.log(data, message, color, 'DEBUG:');
      if (logResult.message) {
        this.nativeLogger.debug(logResult.data, logResult.message);
      } else {
        this.nativeLogger.debug(logResult.data);
      }
    } else {
      return this.isDebugEnabled();
    }
  }

  trace(): boolean;

  trace(data, message?: string, color?: string);

  trace(data?, message?: string, color: string = FgMagenta): boolean | void {
    if (data && this.isTracingEnabled()) {
      const logResult = this.log(data, message, color, 'TRACE:');
      if (logResult.message) {
        this.nativeLogger.trace(logResult.data, logResult.message);
      } else {
        this.nativeLogger.trace(logResult.data);
      }
    } else {
      return this.isTracingEnabled();
    }
  }

  setLevel(logLevel: LogLevel | string) {
    this.level = LoggerAdapter.levels.indexOf(logLevel);
    if (this.ec.log.nativeLogger.logLevelManagement === LogLevelManagement.Adapter) {
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
    if (mgmt && mgmt === LogLevelManagement.Native) {
      return this.nativeLogger.error();
    } else {
      return this.level > LoggerAdapter._noLogging;
    }
  }

  public isWarnEnabled(): boolean {
    const mgmt = this.ec.log.nativeLogger.logLevelManagement;
    if (mgmt && mgmt === LogLevelManagement.Native) {
      return this.nativeLogger.warn();
    } else {
      return this.level > LoggerAdapter._error;
    }
  }

  public isInfoEnabled(): boolean {
    const mgmt = this.ec.log.nativeLogger.logLevelManagement;
    if (mgmt && mgmt === LogLevelManagement.Native) {
      return this.nativeLogger.info();
    } else {
      return this.level > LoggerAdapter._warn;
    }
  }

  public isDebugEnabled(): boolean {
    const mgmt = this.ec.log.nativeLogger.logLevelManagement;
    if (mgmt && mgmt === LogLevelManagement.Native) {
      return this.nativeLogger.debug();
    } else {
      return this.level > LoggerAdapter._info;
    }
  }

  public isTracingEnabled(): boolean {
    const mgmt = this.ec.log.nativeLogger.logLevelManagement;
    if (mgmt && mgmt === LogLevelManagement.Native) {
      return this.nativeLogger.trace();
    } else {
      return this.level > LoggerAdapter._debug;
    }
  }

  protected log(inputData: any, inputMessage: string, inputColor: string, cwcPrefix: string): { data: any, message: string } {
    if(!inputData && !inputMessage) {
      return {data:  undefined, message:  undefined};
    }
    let prefix = '';
    if (!this.hidePrefix) {
      if (!this.hideTimestamp) {
        prefix = utc().format(this.timestampFormat);
        if (!this.hideSeverity) {
          prefix = `${prefix} ${cwcPrefix}`;
        }
      } else {
        prefix = cwcPrefix;
      }
    }
    let message;
    let objForInspect;
    let data;
    let color;
    let reset;
    if(this.messageFormat === MessageFormatOption.Default && this.colorize) {
      color = inputColor;
      reset = Reset;
    } else { //Augment
      color = '';
      reset = '';
    }
    if (this.attributesFormat === AttributesFormatOption.Inspect && this.doInspect) {
      objForInspect = {attributes: this.attributes};
    } else if (this.attributesFormat === AttributesFormatOption.Augment) {
      data = {attributes: this.attributes};
    } else { // Stringify
      message = `(${this.attributesAsString})`;
    }
    if (!inputData) {
      // There is inputMessage because of first check
      if(message) {
        // From attributes as string
        message = `${color}${prefix.length === 0 ? prefix : prefix + ': '}${inputMessage} ${message}${reset}`;
      } else {
        message = `${color}${prefix.length === 0 ? prefix : prefix + ': '}${inputMessage}${reset}`;
      }
      if(objForInspect) {
        message = `${message}\r\n${inspect(objForInspect, this.inspectHidden, this.inspectDepth, this.inspectColor)}`;
      }
      if(data) {
        return {data, message};
      } else {
        return {data: message, message: undefined};
      }
    } else {
      // inputData exists
      if (typeof inputData === 'string') {
        if (inputMessage) {
          if (message) {
            // Result from attributes as string
            message = `${inputMessage} ${message}`;
          } else {
            message = inputMessage;
          }
        }
        if (message) {
          message = `${color}${prefix.length === 0 ? prefix : prefix + ': '}${inputData} - ${message}${reset}`;
        } else {
          message = `${color}${prefix.length === 0 ? prefix : prefix + ': '}${inputData}${reset}`;
        }
        if(objForInspect) {
          message = `${message}\r\n${inspect(objForInspect, this.inspectHidden, this.inspectDepth, this.inspectColor)}`;
        }
        if(data) {
          return {data, message};
        } else {
          return {data: message, message: undefined};
        }
      }
      if (typeof inputData === 'object') {
        if (this.dataFormat === DataFormatOption.Inspect && this.doInspect) {
          if (objForInspect) {
            objForInspect.data = inputData;
          } else {
            objForInspect = {data: inputData};
          }
        } else { //if (this.dataFormat === DataFormatOption.Default) {
          if (data) {
            data.data = inputData;
          } else {
            data = {data: inputData};
          }
        }
        if(inputMessage) {
          if (message) {
            // Result from attributes as string
            message = `${inputMessage} ${message}`;
          } else {
            message = inputMessage;
          }
        }
        if (message) {
          message = `${color}${prefix.length === 0 ? prefix : prefix + ': '}${message}${reset}`;
        }
        if(objForInspect) {
          message = `${message ? message + '\r\n': ''}${inspect(objForInspect, this.inspectHidden, this.inspectDepth, this.inspectColor)}`;
        }
        if(data) {
          return {data, message};
        } else {
          return {data: message, message: undefined};
        }
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
      const repoMatch = this.overrideMatches(override.repo, this.attributes.repo);
      if (repoMatch === false) {
        return false;
      } else if (repoMatch === 'no conflict') {
        // Not fixed on repo
        const sourceMatch = this.overrideMatches(override.source, this.attributes.source);
        if (sourceMatch === false) {
          return false;
        } else if (sourceMatch === 'no conflict') {
          // Not fixed on source
          const methodMatch = this.overrideMatches(override.method, this.attributes.method);
          // Need method to be fixed
          return !(methodMatch === false || methodMatch === 'no conflict');
        } else {
          // Fixed on source
          const methodMatch = this.overrideMatches(override.method, this.attributes.method);
          // Need to be fixed or no conflict on method
          return methodMatch !== false;
        }
      } else {
        // Repo match is fixed
        const sourceMatch = this.overrideMatches(override.source, this.attributes.source);
        // Source must be fixed or no conflict
        if (sourceMatch === false) {
          return false;
        } else {
          // Method must be fixed or no conflict
          const methodMatch = this.overrideMatches(override.method, this.attributes.method);
          return methodMatch !== false;
        }
      }
    });
    if (overrides) {
      this.ec.log.options = deepmerge<LoggingOptions>(this.ec.log.options, overrides.options);
    }
  }
}

