import { AppExecutionContext } from '@franzzemen/app-execution-context';
import { ModuleDefinition } from '@franzzemen/module-factory';
import { ValidationError, ValidationSchema } from 'fastest-validator';
/**
 * Logger - any object that provides the following interface
 */
export interface Logger {
    error(): boolean;
    error(err: any, ...params: any[]): boolean;
    warn(): boolean;
    warn(data: any, message?: string, ...params: any[]): boolean;
    info(): boolean;
    info(data: any, message?: string, ...params: any[]): boolean;
    debug(): boolean;
    debug(data: any, message?: string, ...params: any[]): boolean;
    trace(): boolean;
    trace(data: any, message?: string, ...params: any[]): boolean;
    setLevel(logLevel: LogLevel | string): void;
}
export declare enum LogLevel {
    none = "none",
    error = "error",
    warn = "warn",
    info = "info",
    debug = "debug",
    trace = "trace"
}
export declare enum AttributesFormatOption {
    Stringify = "Stringify",
    Inspect = "Inspect",
    Augment = "Augment"
}
export declare enum DataFormatOption {
    Inspect = "Inspect",
    Default = "Default"
}
export declare enum MessageFormatOption {
    Default = "Default",
    Augment = "Augment"
}
export declare enum LogLevelManagement {
    Adapter = "Adapter",// Log level management is driven by the adapter, if possible.
    Native = "Native",// Log level management is driven by the native implementation, if possible.
    Independent = "Independent"
}
export declare class LogExecutionContextDefaults {
    static InspectEnabled: boolean;
    static InspectDepth: number;
    static ShowHiddenInspectProperties: boolean;
    static InspectColor: boolean;
    static AttributesFormatOption: AttributesFormatOption;
    static DataFormatOption: DataFormatOption;
    static MessageFormatOption: MessageFormatOption;
    static HidePrefix: boolean;
    static HideAppContext: boolean;
    static HideRepo: boolean;
    static HideSourceFile: boolean;
    static HideMethod: boolean;
    static HideThread: boolean;
    static HideRequestId: boolean;
    static HideAuthorization: boolean;
    static HideTimestamp: boolean;
    static HideSeverity: boolean;
    static Colorize: boolean;
    static DefaultTimeStampFormat: string;
    static DataAsJson: boolean;
    static LogLevelManagement: LogLevelManagement;
    static Level: LogLevel;
    static InspectOptions: InspectOptions;
    static FormatOptions: FormatOptions;
    static LoggingOptions: LoggingOptions;
    static OverrideOptions: OverrideOptions;
    static NativeLogger: NativeLogger;
    static Log: Log;
    static LogExecutionContext: LogExecutionContext;
    static Instance(): Logger;
}
/**
 * Determines inspect() behavior
 */
export interface InspectOptions {
    enabled?: boolean;
    depth?: number;
    showHidden?: boolean;
    color?: boolean;
}
export interface FormatOptions {
    attributes?: AttributesFormatOption;
    message?: MessageFormatOption;
    data?: DataFormatOption;
}
/**
 * Determines behavior what is actually logged
 */
export interface LoggingOptions {
    level?: LogLevel | string;
    inspectOptions?: InspectOptions;
    formatOptions?: FormatOptions;
    hidePrefix?: boolean;
    hideTimestamp?: boolean;
    hideSeverity?: boolean;
    hideAppContext?: boolean;
    hideRepo?: boolean;
    hideSourceFile?: boolean;
    hideMethod?: boolean;
    hideThread?: boolean;
    hideRequestId?: boolean;
    hideAuthorization?: boolean;
    colorize?: boolean;
    timestampFormat?: string;
    dataAsJson?: boolean;
}
/**
 * Overrides to logging options, which can be specified by any combination of repo, source and/or method.  At least one
 * must be defined.  If more than one override matches, the most specific one (repo, source, method defined) is merged into the others, in order of
 * specificity at run time.
 *
 * Specificity (in decreasing order) for an override entry match
 *    1. repo, source, and method match
 *    2. repo, source match, and no method provided in override (or no method in provided array)
 *    3. repo matches and no source or method provided in override (or no source/method in provided arrays)
 *    4. no repo provided, and matching source and method
 *    5. no repo and matching source
 *    6. no repo or source and matching method
 */
export interface OverrideOptions {
    repo?: string | string[];
    source?: string | string[];
    method?: string | string[];
    options?: LoggingOptions;
}
export interface NativeLogger {
    module?: ModuleDefinition;
    logLevelManagement?: LogLevelManagement;
    instance?: Logger;
}
export interface Log {
    nativeLogger?: NativeLogger;
    options?: LoggingOptions;
    overrides?: OverrideOptions[];
}
export interface LogExecutionContext extends AppExecutionContext {
    log?: Log;
}
export declare const inspectOptionsSchema: ValidationSchema;
export declare const inspectOptionsSchemaWrapper: ValidationSchema;
export declare const formatOptionsSchema: ValidationSchema;
export declare const formatOptionsSchemaWrapper: {
    type: string;
    optional: boolean;
    default: FormatOptions;
    props: ValidationSchema;
};
export declare const optionsSchema: ValidationSchema;
export declare const optionsSchemaWrapper: ValidationSchema;
export declare const overrideOptionsSchema: ValidationSchema;
export declare const overrideOptionsSchemaWrapper: ValidationSchema;
export declare const nativeLoggerSchema: ValidationSchema;
export declare const nativeLoggerSchemaWrapper: ValidationSchema;
export declare const logSchema: ValidationSchema;
export declare const logSchemaWrapper: ValidationSchema;
export declare const logExecutionContextSchema: ValidationSchema;
export declare const logExecutionContextSchemaWrapper: ValidationSchema;
export declare function isLogExecutionContext(options: any | LogExecutionContext): options is LogExecutionContext;
export declare function validate(context: LogExecutionContext): true | ValidationError[];
