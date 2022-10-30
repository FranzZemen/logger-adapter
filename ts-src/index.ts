export * from './logger-config.js';
export * from './color-constants.js';

import deepmerge from 'deepmerge';
import {loadFromModule} from '@franzzemen/module-factory';
import {createRequire} from 'module';
import {inspect} from 'util';
import {isPromise} from 'util/types';
import {FgCyan, FgGreen, FgMagenta, FgRed, FgYellow, Reset} from './color-constants.js';
import {LogExecutionContext, LoggingOptions, InspectOptions, LogLevel, validate} from './logger-config.js';
import {NativeLogger} from './native-logger.js';

const requireModule = createRequire(import.meta.url);
const moment = requireModule('moment');
const utc = moment.utc;


/**
 * Logger - any object that provides the following interface
 */
export interface Logger {
  error(err, ...params);

  warn(data, message?: string, ...params);

  info(data, message?: string, ...params);

  debug(data, message?: string, ...params);

  trace(data, message?: string, ...params);
}


export class LoggerAdapter implements Logger {
  protected static  _noLogging = 0;
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

  private logger: Logger;

  private pendingEsLoad = false;


  constructor(ec?: LogExecutionContext, public repo = '', public source = '', public _method = '', loggerImpl?: undefined) {
    if(!ec.validated) {
      const result = validate(ec);
      if(result !== true) {
        throw new Error('LoggerAdapterOptions failed validation');
      }
    }
    this.ec = deepmerge({}, ec);
    this.level = LoggerAdapter.levels.indexOf(this.ec.log.options.level);
    this.initializeOverrides();
    this.attributesAsString = ''
      + (this.ec.log.options.hideAppContext === false ? '; appContext: ' + this.ec.appContext : '')
      + (this.ec.log.options.hideRepo === false ? '; repo: ' + this.repo : '')
      + (this.ec.log.options.hideSourceFile === false ? '; sourceFile: ' + this.source : '')
      + (this.ec.log.options.hideMethod === false ? '; method: ' + this._method : '')
      + (this.ec.log.options.hideThread === false ? '; thread: ' + this.ec.execution.thread : '')
      + (this.ec.log.options.hideRequestId === false ? '; requestId: ' + this.ec.execution.requestId : '')
      + (this.ec.log.options.hideLevel === false ? '; logLevel: ' + LoggerAdapter.levels[this.level] : '');

    if (loggerImpl) {
      this.logger = loggerImpl;
    } else {
      const module = this.ec.log.loggerModule;
      if (module && module.moduleName && (module.constructorName || module.functionName)) {
        const impl = loadFromModule<Logger>(module);
        if (isPromise(impl)) {
          this.pendingEsLoad = true;
          this.logger = new NativeLogger();
          this.logger.warn(this.ec.log.loggerModule, 'Detected ES module as logger implementation, using native logger until it loads');
          // Not returning promise.  When it's done, we switch loggers.
          impl
            .then(logger => {
              this.logger.warn('ES module as logger implementation loaded dynamically');
              this.logger = logger;
              this.pendingEsLoad = false;
            });
        } else {
          this.logger = impl;
        }
      } else {
        this.logger = new NativeLogger();
      }
    }
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
    return this.ec.log.options.hideLevel
  }

  get timestampFormat(): string {
    return this.ec.log.options.timestampFormat;
  }

  setMethod(_method: string): LoggerAdapter {
    this._method = _method;
    return this;
  }

  error(err, data?: any, color: string = FgRed) {
    this.log(this.logger.error, data, err, color, 'ERROR:');
  }

  warn(data, message?: string, color: string = FgYellow) {
    if (this.isWarnEnabled()) {
      this.log(this.logger.warn, data, message, color, 'WARN:');
    }
  }

  info(data, message?: string, color: string = FgGreen) {
    if (this.isInfoEnabled()) {
      this.log(this.logger.info, data, message, color, 'INFO:');
    }
  }

  debug(data, message?: string, color: string = FgCyan) {
    if (this.isDebugEnabled()) {
      this.log(this.logger.debug, data, message, color, 'DEBUG:');
    }
  }

  trace(data, message?: string, color: string = FgMagenta) {
    if (this.isTracingEnabled()) {
      this.log(this.logger.debug, data, message, color, 'TRACE:');
    }
  }

  log(logMethod: (color: string, logMessage: string) => void, data: any, message: string, color: string, cwcPrefix: string) {
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

  public isWarnEnabled(): boolean {
    return this.level > LoggerAdapter._error;
  }

  public isInfoEnabled(): boolean {
    return this.level > LoggerAdapter._warn;
  }

  public isDebugEnabled(): boolean {
    return this.level > LoggerAdapter._info;
  }

  public isTracingEnabled(): boolean {
    return this.level > LoggerAdapter._debug;
  }


  private overrideMatches(override: string | string[], mustMatch: string): true | false | 'no conflict' {
    if(override) {
      if(typeof override === 'string') {
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
          const methodMatch = this.overrideMatches(override.method, this._method);
          // Need method to be fixed
          if (methodMatch === false || methodMatch === 'no conflict') {
            return false;
          } else {
            return true;
          }
        } else {
          // Fixed on source
          const methodMatch = this.overrideMatches(override.method, this._method);
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
          const methodMatch = this.overrideMatches(override.method, this._method);
          if (methodMatch === false) {
            return false;
          } else {
            return true;
          }
        }
      }
    });
    if(overrides) {
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
        logObject['method'] = this._method;
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

