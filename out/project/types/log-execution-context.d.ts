import { AppExecutionContext } from '@franzzemen/execution-context';
import { ModuleDefinition } from "@franzzemen/module-factory";
import { Logger, LogLevel } from "./logger.js";
export declare enum LogLevelManagement {
    Adapter = "Adapter",// Log level management is driven by the adapter, if possible.
    Native = "Native",// Log level management is driven by the native implementation, if possible.
    Independent = "Independent"
}
export type NativeLogger = {
    module?: ModuleDefinition;
    logLevelManagement?: LogLevelManagement;
    instance?: Logger;
};
/**
 * Determines inspect() behavior
 */
export type InspectOptions = {
    enabled?: boolean;
    depth?: number;
    showHidden?: boolean;
    color?: boolean;
};
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
export type FormatOptions = {
    attributes?: AttributesFormatOption;
    message?: MessageFormatOption;
    data?: DataFormatOption;
};
/**
 * Determines behavior what is actually logged
 */
export type LoggingOptions = {
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
};
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
export type OverrideOptions = {
    repo?: string | string[];
    source?: string | string[];
    method?: string | string[];
    options?: LoggingOptions;
};
export type LogConfig = {
    nativeLogger?: NativeLogger;
    options?: LoggingOptions;
    overrides?: OverrideOptions[];
};
export type LogExecutionContext = AppExecutionContext & {
    logConfig?: LogConfig;
};
