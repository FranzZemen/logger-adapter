export * from './log-execution-context.js';
export * from './color-constants.js';
export * from './console-logger.js';
export * from './logger-validation.js';
export * from './logger.js';
import { LogLevel } from "./logger.js";
import { loadFromModule } from '@franzzemen/module-factory';
import _ from 'lodash';
import moment from 'moment';
import { inspect } from 'util';
import { isPromise } from 'util/types';
import { FgCyan, FgGreen, FgMagenta, FgRed, FgYellow, Reset } from './color-constants.js';
import { ConsoleLogger } from './console-logger.js';
import { AttributesFormatOption, DataFormatOption, LogLevelManagement, MessageFormatOption } from "./log-execution-context.js";
import { validate } from "./logger-validation.js";
const utc = moment.utc;
function isContainered(obj, containedKey) {
    return obj.hasOwnProperty(containedKey);
}
function isDataContainer(obj) {
    return isContainered(obj, 'data');
}
function isAttributesContainer(obj) {
    return isContainered(obj, 'attributes');
}
export class LoggerAdapter {
    static _noLogging = 0;
    static _error = 1;
    static _warn = 2;
    static _info = 3;
    static _debug = 4;
    static _trace = 5;
    static levels = [LogLevel.none, LogLevel.error, LogLevel.warn, LogLevel.info, LogLevel.debug, LogLevel.trace];
    levelLabels = [];
    level = LoggerAdapter._info;
    ec = {};
    timingContext = '';
    start;
    interim;
    pendingEsLoad = false;
    attributes = { app: {}, execution: {}, method: "", repo: "", source: "" };
    _nativeLogger;
    /**
     * All parameters optional.
     * @param ec The context. It will default to LogDefaults.
     * @param repo Provides logging info that the log event occurred in this repo
     * @param source Provides logging info that the log event occurred in this source file
     * @param method Provides logging info that the log event occurred in this method
     * @param nativeLogger  If passed, will use this over the native _nativeLogger or a module definition
     */
    constructor(ec = {}, repo = '', source = '', method = '', nativeLogger) {
        if (!ec.validated) {
            const result = validate(ec);
            if (isPromise(result)) {
                const localLogger = nativeLogger ? nativeLogger : ec?.logConfig?.nativeLogger?.instance ? ec.logConfig.nativeLogger.instance : new ConsoleLogger();
                const err = new Error('LogExecutionContext validation should not result in async behavior');
                localLogger.error(err);
                throw err;
            }
            if (result !== true) {
                const localLogger = nativeLogger ? nativeLogger : ec?.logConfig?.nativeLogger?.instance ? ec.logConfig.nativeLogger.instance : new ConsoleLogger();
                const msg = 'LogExecutionContext failed validation';
                localLogger.warn(inspect(result, false, 5), msg);
                const err = new Error(msg);
                localLogger.error(err);
                throw err;
            }
        }
        this.ec = _.merge({}, ec);
        this.attributes = {
            repo,
            source,
            method,
            app: this.ec.app ?? { name: '' },
            execution: this.ec.execution ?? { thread: '', requestId: '', authorization: '' }
        };
        // Use the console _nativeLogger unless another one is provided, or later loaded by module
        if (nativeLogger) {
            this._nativeLogger = nativeLogger;
            // Set level based on level management
            this.setLevel(this.ec.logConfig?.options?.level ?? LogLevel.info);
        }
        else {
            if (ec.logConfig?.nativeLogger?.instance) {
                this._nativeLogger = ec.logConfig.nativeLogger.instance;
                // Set level based on level management
                this.setLevel(this.ec.logConfig?.options?.level ?? LogLevel.info);
            }
            else {
                this._nativeLogger = new ConsoleLogger();
                if (this.ec.logConfig?.nativeLogger?.module) {
                    const module = this.ec?.logConfig?.nativeLogger?.module;
                    if (module && module.moduleName && (module.constructorName || module.functionName)) {
                        const implPromise = loadFromModule(module, this._nativeLogger);
                        this.pendingEsLoad = true;
                        // Not returning promise.  When it's done, we switch loggers.
                        implPromise
                            .then(logger => {
                            this._nativeLogger.warn('ES module as _nativeLogger implementation loaded dynamically');
                            this._nativeLogger = logger;
                            this.pendingEsLoad = false;
                            // Set level based on level management
                            this.setLevel(this.ec.logConfig?.options?.level ?? LogLevel.info);
                        });
                    }
                }
            }
        }
        this.initializeOverrides();
        // Overrides could have overridden, and need to recalculate
        this.setLevel(this.ec.logConfig?.options?.level ?? LogLevel.info);
    }
    get nativeLogger() {
        return this._nativeLogger;
    }
    get options() {
        return this.ec.logConfig?.options ?? {};
    }
    get inspectOptions() {
        return this.options.inspectOptions ?? {};
    }
    get formatOptions() {
        return this.options.formatOptions ?? {};
    }
    get doInspect() {
        return this.inspectOptions.enabled ?? false;
    }
    get inspectDepth() {
        return this.inspectOptions.depth ?? 0;
    }
    get inspectHidden() {
        return this.inspectOptions.showHidden ?? false;
    }
    get inspectColor() {
        return this.inspectOptions.color ?? false;
    }
    get hidePrefix() {
        return this.options.hidePrefix ?? false;
    }
    get hideTimestamp() {
        return this.options.hideTimestamp ?? false;
    }
    get hideSeverity() {
        return this.options.hideSeverity ?? false;
    }
    get hideAppContext() {
        return this.options.hideAppContext ?? false;
    }
    get hideRepo() {
        return this.options.hideRepo ?? false;
    }
    get hideSourceFile() {
        return this.options.hideSourceFile ?? false;
    }
    get hideMethod() {
        return this.options.hideMethod ?? false;
    }
    get hideThread() {
        return this.options.hideThread ?? false;
    }
    get hideRequestId() {
        return this.options.hideRequestId ?? false;
    }
    get hideAuthorization() {
        return this.options.hideAuthorization ?? false;
    }
    get timestampFormat() {
        return this.options.timestampFormat ?? 'YYYY-MM-DD HH:mm:ss.SSS';
    }
    get attributesFormat() {
        return this.formatOptions.attributes ?? AttributesFormatOption.Stringify;
    }
    get dataFormat() {
        return this.formatOptions.data ?? DataFormatOption.Default;
    }
    get messageFormat() {
        return this.formatOptions.message ?? MessageFormatOption.Default;
    }
    get colorize() {
        return this.options.colorize ?? false;
    }
    get attributesAsString() {
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
    setMethod(_method) {
        this.attributes.method = _method;
        return this;
    }
    error(err, data, color = FgRed) {
        if (err && this.isErrorEnabled()) {
            const logResult = this.log(err, undefined, color, 'ERROR:');
            this._nativeLogger.error(err, data);
        }
        else {
            return this.isErrorEnabled();
        }
    }
    warn(data, message, color = FgYellow) {
        if (data && this.isWarnEnabled()) {
            const logResult = this.log(data, message, color, 'WARN:');
            if (logResult.message) {
                this._nativeLogger.warn(logResult.data, logResult.message);
            }
            else {
                this._nativeLogger.warn(logResult.data);
            }
        }
        else {
            return this.isWarnEnabled();
        }
    }
    info(data, message, color = FgGreen) {
        if (data && this.isInfoEnabled()) {
            const logResult = this.log(data, message, color, 'INFO:');
            if (logResult.message) {
                this._nativeLogger.info(logResult.data, logResult.message);
            }
            else {
                this._nativeLogger.info(logResult.data);
            }
        }
        else {
            return this.isInfoEnabled();
        }
    }
    debug(data, message, color = FgCyan) {
        if (data && this.isDebugEnabled()) {
            const logResult = this.log(data, message, color, 'DEBUG:');
            if (logResult.message) {
                this._nativeLogger.debug(logResult.data, logResult.message);
            }
            else {
                this._nativeLogger.debug(logResult.data);
            }
        }
        else {
            return this.isDebugEnabled();
        }
    }
    trace(data, message, color = FgMagenta) {
        if (data && this.isTracingEnabled()) {
            const logResult = this.log(data, message, color, 'TRACE:');
            if (logResult.message) {
                this._nativeLogger.trace(logResult.data, logResult.message);
            }
            else {
                this._nativeLogger.trace(logResult.data);
            }
        }
        else {
            return this.isTracingEnabled();
        }
    }
    get logLevelManagement() {
        return this.ec.logConfig?.nativeLogger?.logLevelManagement ?? LogLevelManagement.Adapter;
    }
    setLevel(logLevel) {
        this.level = LoggerAdapter.levels.indexOf(logLevel);
        if (this.logLevelManagement === LogLevelManagement.Adapter) {
            this._nativeLogger.setLevel(logLevel);
        }
    }
    startTiming(context) {
        if (this.start) {
            this.stopTiming();
        }
        this.start = Date.now();
        this.interim = this.start;
        this.timingContext = context;
        this.trace({ timing: context, start: this.start }, 'Start Timing');
    }
    interimTiming(interimContext) {
        if (this.interim) {
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
            this.trace({ timing: this.timingContext, elapsed: (now - this.start) }, 'stopTiming');
            this.start = undefined;
            this.interim = undefined;
            this.timingContext = '';
        }
    }
    isErrorEnabled() {
        const mgmt = this.logLevelManagement;
        if (mgmt && mgmt === LogLevelManagement.Native) {
            return this._nativeLogger.error();
        }
        else {
            return this.level > LoggerAdapter._noLogging;
        }
    }
    isWarnEnabled() {
        const mgmt = this.logLevelManagement;
        if (mgmt && mgmt === LogLevelManagement.Native) {
            return this._nativeLogger.warn();
        }
        else {
            return this.level > LoggerAdapter._error;
        }
    }
    isInfoEnabled() {
        const mgmt = this.logLevelManagement;
        if (mgmt && mgmt === LogLevelManagement.Native) {
            return this._nativeLogger.info();
        }
        else {
            return this.level > LoggerAdapter._warn;
        }
    }
    isDebugEnabled() {
        const mgmt = this.logLevelManagement;
        if (mgmt && mgmt === LogLevelManagement.Native) {
            return this._nativeLogger.debug();
        }
        else {
            return this.level > LoggerAdapter._info;
        }
    }
    isTracingEnabled() {
        const mgmt = this.logLevelManagement;
        if (mgmt && mgmt === LogLevelManagement.Native) {
            return this._nativeLogger.trace();
        }
        else {
            return this.level > LoggerAdapter._debug;
        }
    }
    processPrefix(cwcPrefix) {
        let prefix = '';
        if (!this.hidePrefix) {
            if (!this.hideTimestamp) {
                prefix = utc().format(this.timestampFormat);
                if (!this.hideSeverity) {
                    prefix = `${prefix} ${cwcPrefix}`;
                }
            }
            else {
                prefix = cwcPrefix;
            }
        }
        return prefix;
    }
    log(inputData, inputMessage, inputColor, cwcPrefix) {
        let message = this.processMessage(inputData, inputMessage, inputColor);
        let inspect = this.processInspect(inputColor);
        let data = this.processData(inputData, inputMessage);
        let prefix = this.processPrefix(cwcPrefix);
        if (message) {
            if (this.colorize) {
                message = `${inputColor}${prefix}:${message}${Reset}`;
            }
            else {
                message = `${prefix}:${message}`;
            }
        }
        if (inspect) {
            if (message) {
                message = `${message}\r\n${inspect}`;
            }
            else {
                message = inspect;
            }
        }
        return { data, message };
    }
    processInspect(data) {
        let inspectObj;
        if (this.attributesFormat === AttributesFormatOption.Inspect) {
            inspectObj = { attributes: this.attributes };
        }
        if (typeof data === 'object' && this.dataFormat === DataFormatOption.Inspect) {
            if (inspectObj && isDataContainer(inspectObj)) {
                inspectObj.data = data;
            }
            else {
                inspectObj = { data };
            }
        }
        if (inspectObj) {
            return inspect(inspectObj, this.inspectHidden, this.inspectDepth, this.inspectColor);
        }
        else {
            return undefined;
        }
    }
    processData(data, message) {
        let _data;
        if (message && this.messageFormat === MessageFormatOption.Augment) {
            if (data && typeof data !== 'object') {
                message = `${message} - ${data}`;
            }
            _data = { message };
        }
        else if (data) {
            if (typeof data !== 'object') {
                _data = { message: data };
            }
        }
        if (this.attributesFormat === AttributesFormatOption.Augment) {
            if (_data && isAttributesContainer(_data)) {
                _data.attributes = this.attributes;
            }
            else {
                _data = {
                    attributes: this.attributes
                };
            }
        }
        if (data && typeof data === 'object' && this.dataFormat === DataFormatOption.Default) {
            if (_data && isDataContainer(_data)) {
                _data.data = data;
            }
            else {
                _data = {
                    data: data
                };
            }
        }
        if (_data) {
            if (this.ec.logConfig?.options?.dataAsJson) {
                _data = JSON.stringify(_data);
            }
        }
        return _data;
    }
    processMessage(data, message, inputColor) {
        let _message, color, reset;
        if (message && this.messageFormat === MessageFormatOption.Default) {
            _message = message;
        }
        if (typeof data !== 'object') {
            if (_message) {
                _message = `${_message} = ${data}`;
            }
            else {
                _message = `${data}`;
            }
        }
        return _message;
    }
    overrideMatches(override, mustMatch) {
        if (override) {
            if (typeof override === 'string') {
                return override === mustMatch;
            }
            else {
                return override.some(over => over === mustMatch);
            }
        }
        else {
            return 'no conflict';
        }
    }
    get overrides() {
        return this.ec.logConfig?.overrides ?? [];
    }
    initializeOverrides() {
        // Repos dominates.  If an override matches repo, and doesn't conflict on source or method, use it.
        // If no repo, if an override matches method with no repo, and doesn't conflict on method, use it.
        // If no repo and no source, if an override matches on method, with no repo or source, use it.
        const overrides = this.overrides?.find(override => {
            const repoMatch = this.overrideMatches(override.repo, this.attributes.repo);
            if (repoMatch === false) {
                return false;
            }
            else if (repoMatch === 'no conflict') {
                // Not fixed on repo
                const sourceMatch = this.overrideMatches(override.source, this.attributes.source);
                if (sourceMatch === false) {
                    return false;
                }
                else if (sourceMatch === 'no conflict') {
                    // Not fixed on source
                    const methodMatch = this.overrideMatches(override.method, this.attributes.method);
                    // Need method to be fixed
                    return !(methodMatch === false || methodMatch === 'no conflict');
                }
                else {
                    // Fixed on source
                    const methodMatch = this.overrideMatches(override.method, this.attributes.method);
                    // Need to be fixed or no conflict on method
                    return methodMatch !== false;
                }
            }
            else {
                // Repo match is fixed
                const sourceMatch = this.overrideMatches(override.source, this.attributes.source);
                // Source must be fixed or no conflict
                if (sourceMatch === false) {
                    return false;
                }
                else {
                    // Method must be fixed or no conflict
                    const methodMatch = this.overrideMatches(override.method, this.attributes.method);
                    return methodMatch !== false;
                }
            }
        });
        if (overrides) {
            if (this.ec.logConfig) {
                this.ec.logConfig.options = _.merge(this.ec.logConfig.options, overrides.options) ?? {};
            }
        }
    }
}
//# sourceMappingURL=index.js.map