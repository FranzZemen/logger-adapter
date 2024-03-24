import { Logger, LogLevel } from "./logger.js";
import { AttributesFormatOption, DataFormatOption, FormatOptions, InspectOptions, LogExecutionContext, LoggingOptions, LogLevelManagement, MessageFormatOption } from "./log-execution-context.js";
export declare class LoggerAdapter implements Logger {
    protected static _noLogging: number;
    protected static _error: number;
    protected static _warn: number;
    protected static _info: number;
    protected static _debug: number;
    protected static _trace: number;
    protected static levels: (LogLevel | string)[];
    protected levelLabels: string[];
    protected level: number;
    protected ec: LogExecutionContext;
    private timingContext;
    private start;
    private interim;
    private attributes;
    private _nativeLogger;
    /**
     * All parameters optional.
     * @param ec The context. It will default to LogDefaults.
     * @param repo Provides logging info that the log event occurred in this repo
     * @param source Provides logging info that the log event occurred in this source file
     * @param method Provides logging info that the log event occurred in this method
     * @param nativeLogger  If passed, will use this over the native _nativeLogger or a module definition
     */
    constructor(ec: LogExecutionContext, repo?: string, source?: string, method?: string, nativeLogger?: Logger);
    get nativeLogger(): Logger;
    get options(): LoggingOptions;
    get inspectOptions(): InspectOptions;
    get formatOptions(): FormatOptions;
    get doInspect(): boolean;
    get inspectDepth(): number;
    get inspectHidden(): boolean;
    get inspectColor(): boolean;
    get hidePrefix(): boolean;
    get hideTimestamp(): boolean;
    get hideSeverity(): boolean;
    get hideAppContext(): boolean;
    get hideRepo(): boolean;
    get hideSourceFile(): boolean;
    get hideMethod(): boolean;
    get hideThread(): boolean;
    get hideRequestId(): boolean;
    get hideAuthorization(): boolean;
    get timestampFormat(): string;
    get attributesFormat(): AttributesFormatOption;
    get dataFormat(): DataFormatOption;
    get messageFormat(): MessageFormatOption;
    get colorize(): boolean;
    private get attributesAsString();
    setMethod(_method: string): LoggerAdapter;
    error(): boolean;
    error(err: unknown, data?: any, color?: string): void;
    warn(): boolean;
    warn(data: any, message?: string, color?: string): void;
    info(): boolean;
    info(data: any, message?: string, color?: string): void;
    debug(): boolean;
    debug(data: any, message?: string, color?: string): void;
    trace(): boolean;
    trace(data: any, message?: string, color?: string): void;
    get logLevelManagement(): LogLevelManagement;
    setLevel(logLevel: LogLevel | string): void;
    startTiming(context: string): void;
    interimTiming(interimContext: string): void;
    stopTiming(): void;
    isErrorEnabled(): boolean;
    isWarnEnabled(): boolean;
    isInfoEnabled(): boolean;
    isDebugEnabled(): boolean;
    isTracingEnabled(): boolean;
    protected processPrefix(cwcPrefix: string): string;
    protected log(inputData: any, inputMessage: string | undefined, inputColor: string, cwcPrefix: string): {
        data: any;
        message: string | undefined;
    };
    private processInspect;
    private processData;
    private processMessage;
    private overrideMatches;
    private get overrides();
    private initializeOverrides;
}
