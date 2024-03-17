export * from './logger-config.js';
export * from './color-constants.js';
export * from './console-logger.js';

import {App, Execution} from '@franzzemen/execution-context';
import {loadFromModule, ModuleDefinition} from '@franzzemen/module-factory';
import _ from 'lodash';
import moment from 'moment';
import {inspect} from 'util';
import {isPromise} from 'util/types';
import {FgCyan, FgGreen, FgMagenta, FgRed, FgYellow, Reset} from './color-constants.js';
import {ConsoleLogger} from './console-logger.js';
import {
  AttributesFormatOption,
  DataFormatOption,
  FormatOptions,
  InspectOptions,
  LogExecutionContext,
  Logger,
  LoggingOptions,
  LogLevel,
  LogLevelManagement,
  MessageFormatOption, OverrideOptions,
  validate
} from './logger-config.js';

const utc = moment.utc;


interface AdapterAttributes {
  app: App,
  execution: Execution,
  repo: string;
  source: string;
  method: string;
}

type DataContainer = {data: any};
type AttributesContainer = {attributes: any};

function isContainered<T>(obj: any, containedKey: string): obj is T {
  return obj.hasOwnProperty(containedKey);
}

function isDataContainer(obj: any): obj is DataContainer {
  return isContainered<DataContainer>(obj, 'data');
}

function isAttributesContainer(obj: any): obj is AttributesContainer {
  return isContainered<AttributesContainer>(obj, 'attributes');
}

export class LoggerAdapter implements Logger {
  protected static _noLogging = 0;
  protected static _error = 1;
  protected static _warn = 2;
  protected static _info = 3;
  protected static _debug = 4;
  protected static _trace = 5;

  protected static levels: (LogLevel | string)[] = [LogLevel.none, LogLevel.error, LogLevel.warn, LogLevel.info, LogLevel.debug, LogLevel.trace];

  protected levelLabels: string[] = []

  protected level: number = LoggerAdapter._info;

  protected ec: LogExecutionContext = {};

  private timingContext = '';
  private start: number | undefined;
  private interim: number | undefined;
  private pendingEsLoad = false;
  private attributes: AdapterAttributes =  {app: {}, execution: {}, method: "", repo: "", source: ""};

  private _nativeLogger: Logger;

  /**
   * All parameters optional.
   * @param ec The context. It will default to LogDefaults.
   * @param repo Provides logging info that the log event occurred in this repo
   * @param source Provides logging info that the log event occurred in this source file
   * @param method Provides logging info that the log event occurred in this method
   * @param nativeLogger  If passed, will use this over the native _nativeLogger or a module definition
   */
  constructor(ec: LogExecutionContext = {}, repo = '', source = '', method = '', nativeLogger?: Logger) {
    if (!ec.validated) {
      const result = validate(ec);
      if (isPromise(result)) {
        const localLogger = nativeLogger ? nativeLogger : ec?.log?.nativeLogger?.instance ? ec.log.nativeLogger.instance : new ConsoleLogger();
        const err = new Error('LogExecutionContext validation should not result in async behavior');
        localLogger.error(err);
        throw err;
      }
      if (result !== true) {
        const localLogger = nativeLogger ? nativeLogger : ec?.log?.nativeLogger?.instance ? ec.log.nativeLogger.instance : new ConsoleLogger();
        const msg = 'LogExecutionContext failed validation';
        localLogger.warn(inspect(result, false, 5), msg);
        const err = new Error(msg);
        localLogger.error(err);
        throw err;
      }
    }
    this.ec = _.merge<LogExecutionContext, LogExecutionContext>({}, ec);
    this.attributes = {
      repo,
      source,
      method,
      app: this.ec.app ?? {name: ''},
      execution: this.ec.execution ?? {thread: '', requestId: '', authorization: ''}
    };
    // Use the console _nativeLogger unless another one is provided, or later loaded by module
    if (nativeLogger) {
      this._nativeLogger = nativeLogger;
      // Set level based on level management
      this.setLevel(this.ec.log?.options?.level ?? LogLevel.info);
    } else {
      if (ec.log?.nativeLogger?.instance) {
        this._nativeLogger = ec.log.nativeLogger.instance;
        // Set level based on level management
        this.setLevel(this.ec.log?.options?.level ?? LogLevel.info);
      } else {
        this._nativeLogger = new ConsoleLogger();
        if(this.ec.log?.nativeLogger?.module) {
          const module: ModuleDefinition = this.ec?.log?.nativeLogger?.module;
          if (module && module.moduleName && (module.constructorName || module.functionName)) {
            const implPromise = loadFromModule<Logger>(module, this._nativeLogger);
            this.pendingEsLoad = true;
            // Not returning promise.  When it's done, we switch loggers.
            implPromise
              .then(logger => {
                this._nativeLogger.warn('ES module as _nativeLogger implementation loaded dynamically');
                this._nativeLogger = logger;
                this.pendingEsLoad = false;
                // Set level based on level management
                this.setLevel(this.ec.log?.options?.level ?? LogLevel.info);
              });
          }
        }
      }
    }
    this.initializeOverrides();
    // Overrides could have overridden, and need to recalculate
    this.setLevel(this.ec.log?.options?.level ?? LogLevel.info);
  }


  get nativeLogger(): Logger {
    return this._nativeLogger;
  }

  get options(): LoggingOptions {
    return this.ec.log?.options ?? {};
  }

  get inspectOptions(): InspectOptions {
    return this.options.inspectOptions ?? {};
  }

  get formatOptions(): FormatOptions {
    return this.options.formatOptions ?? {};
  }

  get doInspect(): boolean {
    return this.inspectOptions.enabled ?? false;
  }

  get inspectDepth(): number {
    return this.inspectOptions.depth ?? 0;
  }

  get inspectHidden(): boolean {
    return this.inspectOptions.showHidden ?? false;
  }

  get inspectColor(): boolean {
    return this.inspectOptions.color ?? false;
  }

  get hidePrefix(): boolean {
    return this.options.hidePrefix ?? false;
  }

  get hideTimestamp(): boolean {
    return this.options.hideTimestamp ?? false;
  }

  get hideSeverity(): boolean {
    return this.options.hideSeverity ?? false;
  }

  get hideAppContext(): boolean {
    return this.options.hideAppContext ?? false;
  }

  get hideRepo(): boolean {
    return this.options.hideRepo ?? false;
  }

  get hideSourceFile(): boolean {
    return this.options.hideSourceFile ?? false;
  }

  get hideMethod(): boolean {
    return this.options.hideMethod ?? false;
  }

  get hideThread(): boolean {
    return this.options.hideThread ?? false;
  }

  get hideRequestId(): boolean {
    return this.options.hideRequestId ?? false;
  }

  get hideAuthorization(): boolean {
    return this.options.hideAuthorization ?? false;
  }

  get timestampFormat(): string {
    return this.options.timestampFormat ?? 'YYYY-MM-DD HH:mm:ss.SSS';
  }

  get attributesFormat(): AttributesFormatOption {
    return this.formatOptions.attributes ?? AttributesFormatOption.Stringify
  }

  get dataFormat(): DataFormatOption {
    return this.formatOptions.data ?? DataFormatOption.Default
  }

  get messageFormat(): MessageFormatOption {
    return this.formatOptions.message ?? MessageFormatOption.Default;
  }

  get colorize(): boolean {
    return this.options.colorize ?? false;
  }

  private get attributesAsString(): string {
    let started = false;
    let result = '';
    if (!this.hideAppContext) {
      result += `name:${this.attributes.app.name}`;
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
  error(err: unknown, data?: any, color?: string): void;
  error(err?: unknown, data?: any, color: string = FgRed): boolean | void {
    if (err && this.isErrorEnabled()) {
      const logResult = this.log(err, undefined, color, 'ERROR:');
      this._nativeLogger.error(err, data);
    } else {
      return this.isErrorEnabled();
    }
  }

  warn(): boolean;
  warn(data: any, message?: string, color?: string): void;
  warn(data?: any, message?: string, color: string = FgYellow): boolean | void {
    if (data && this.isWarnEnabled()) {
      const logResult = this.log(data, message, color, 'WARN:');
      if (logResult.message) {
        this._nativeLogger.warn(logResult.data, logResult.message);
      } else {
        this._nativeLogger.warn(logResult.data);
      }
    } else {
      return this.isWarnEnabled();
    }
  }

  info(): boolean;
  info(data: any, message?: string, color?: string): void;
  info(data?: any, message?: string, color: string = FgGreen): boolean | void {
    if (data && this.isInfoEnabled()) {
      const logResult = this.log(data, message, color, 'INFO:');
      if (logResult.message) {
        this._nativeLogger.info(logResult.data, logResult.message);
      } else {
        this._nativeLogger.info(logResult.data);
      }
    } else {
      return this.isInfoEnabled();
    }
  }

  debug(): boolean;
  debug(data: any, message?: string, color?: string): void;
  debug(data?: any, message?: string, color: string = FgCyan): boolean | void {
    if (data && this.isDebugEnabled()) {
      const logResult = this.log(data, message, color, 'DEBUG:');
      if (logResult.message) {
        this._nativeLogger.debug(logResult.data, logResult.message);
      } else {
        this._nativeLogger.debug(logResult.data);
      }
    } else {
      return this.isDebugEnabled();
    }
  }

  trace(): boolean;
  trace(data: any, message?: string, color?: string): void;
  trace(data?: any, message?: string, color: string = FgMagenta): boolean | void {
    if (data && this.isTracingEnabled()) {
      const logResult = this.log(data, message, color, 'TRACE:');
      if (logResult.message) {
        this._nativeLogger.trace(logResult.data, logResult.message);
      } else {
        this._nativeLogger.trace(logResult.data);
      }
    } else {
      return this.isTracingEnabled();
    }
  }


  get logLevelManagement(): LogLevelManagement {
    return this.ec.log?.nativeLogger?.logLevelManagement ?? LogLevelManagement.Adapter;
  }
  setLevel(logLevel: LogLevel | string) {
    this.level = LoggerAdapter.levels.indexOf(logLevel);
    if (this.logLevelManagement === LogLevelManagement.Adapter) {
      this._nativeLogger.setLevel(logLevel);
    }
  }

  startTiming(context: string) {
    if (this.start) {
      this.stopTiming();
    }
    this.start = Date.now();
    this.interim = this.start;
    this.timingContext = context;
    this.trace({timing: context, start: this.start}, 'Start Timing');
  }

  interimTiming(interimContext: string) {
    if(this.interim) {
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
    const mgmt = this.logLevelManagement;
    if (mgmt && mgmt === LogLevelManagement.Native) {
      return this._nativeLogger.error();
    } else {
      return this.level > LoggerAdapter._noLogging;
    }
  }

  public isWarnEnabled(): boolean {
    const mgmt = this.logLevelManagement;
    if (mgmt && mgmt === LogLevelManagement.Native) {
      return this._nativeLogger.warn();
    } else {
      return this.level > LoggerAdapter._error;
    }
  }

  public isInfoEnabled(): boolean {
    const mgmt = this.logLevelManagement;
    if (mgmt && mgmt === LogLevelManagement.Native) {
      return this._nativeLogger.info();
    } else {
      return this.level > LoggerAdapter._warn;
    }
  }

  public isDebugEnabled(): boolean {
    const mgmt = this.logLevelManagement;
    if (mgmt && mgmt === LogLevelManagement.Native) {
      return this._nativeLogger.debug();
    } else {
      return this.level > LoggerAdapter._info;
    }
  }

  public isTracingEnabled(): boolean {
    const mgmt = this.logLevelManagement;
    if (mgmt && mgmt === LogLevelManagement.Native) {
      return this._nativeLogger.trace();
    } else {
      return this.level > LoggerAdapter._debug;
    }
  }

  protected processPrefix(cwcPrefix: string): string {
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
    return prefix;
  }

  protected log(inputData: any, inputMessage: string | undefined, inputColor: string, cwcPrefix: string): { data: any, message: string | undefined} {
    let message = this.processMessage(inputData, inputMessage, inputColor);
    let inspect = this.processInspect(inputColor);
    let data = this.processData(inputData, inputMessage);
    let prefix = this.processPrefix(cwcPrefix);
    if (message) {
      if (this.colorize) {
        message = `${inputColor}${prefix}:${message}${Reset}`;
      } else {
        message = `${prefix}:${message}`;
      }
    }
    if (inspect) {
      if (message) {
        message = `${message}\r\n${inspect}`;
      } else {
        message = inspect;
      }
    }
    return {data, message};
  }

  private processInspect(data: any): string | undefined {
    let inspectObj;
    if (this.attributesFormat === AttributesFormatOption.Inspect) {
      inspectObj = {attributes: this.attributes};
    }
    if (typeof data === 'object' && this.dataFormat === DataFormatOption.Inspect) {
      if (inspectObj && isDataContainer(inspectObj)) {
        inspectObj.data = data;
      } else {
        inspectObj = {data};
      }
    }
    if (inspectObj) {
      return inspect(inspectObj, this.inspectHidden, this.inspectDepth, this.inspectColor);
    } else {
      return undefined;
    }
  }


  private processData(data: any, message: string | undefined): Object | undefined {
    let _data;
    if (message && this.messageFormat === MessageFormatOption.Augment) {
      if (data && typeof data !== 'object') {
        message = `${message} - ${data}`;
      }
      _data = {message};
    } else if (data) {
      if (typeof data !== 'object') {
        _data = {message: data};
      }
    }
    if (this.attributesFormat === AttributesFormatOption.Augment) {
      if (_data && isAttributesContainer(_data)) {
        _data.attributes = this.attributes;
      } else {
        _data = {
          attributes: this.attributes
        };
      }
    }
    if (data && typeof data === 'object' && this.dataFormat === DataFormatOption.Default) {
      if (_data && isDataContainer(_data)) {
        _data.data = data;
      } else {
        _data = {
          data: data
        };
      }
    }
    if (_data) {
      if (this.ec.log?.options?.dataAsJson) {
        _data = JSON.stringify(_data);
      }
    }
    return _data;
  }

  private processMessage(data: any, message: string | undefined, inputColor: string): string | undefined {
    let _message, color, reset;

    if (message && this.messageFormat === MessageFormatOption.Default) {
      _message = message;
    }
    if (typeof data !== 'object') {
      if (_message) {
        _message = `${_message} = ${data}`;
      } else {
        _message = `${data}`;
      }
    }
    return _message;
  }

  private overrideMatches(override: string | string[] | undefined, mustMatch: string): true | false | 'no conflict' {
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

  private get overrides(): OverrideOptions[] {
    return this.ec.log?.overrides ?? [];
  }

  private initializeOverrides() {
    // Repos dominates.  If an override matches repo, and doesn't conflict on source or method, use it.
    // If no repo, if an override matches method with no repo, and doesn't conflict on method, use it.
    // If no repo and no source, if an override matches on method, with no repo or source, use it.
    const overrides = this.overrides?.find(override => {
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
      if(this.ec.log) {
        this.ec.log.options = _.merge(this.ec.log.options, overrides.options) ?? {};
      }
    }
  }
}

