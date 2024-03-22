/*
Created by Franz Zemen 03/22/2024
License Type: MIT
*/

import { AppExecutionContext } from '@franzzemen/execution-context';
import {ModuleDefinition} from "@franzzemen/module-factory";
import {Logger, LogLevel} from "./logger.js";


// Where are log levels determined?
export enum LogLevelManagement {
  Adapter = 'Adapter', // Log level management is driven by the adapter, if possible.
  Native = 'Native', // Log level management is driven by the native implementation, if possible.
  Independent = 'Independent' // Default, log level is driven independently, first by adapter, than by native.  Most restrictive wins.
}

export interface NativeLogger {
  module?: ModuleDefinition;
  logLevelManagement?: LogLevelManagement;
  instance?: Logger;
}

/**
 * Determines inspect() behavior
 */
export interface InspectOptions {
  // Object inspection will be enabled.  System default is true
  enabled?: boolean;
  // The object depth to log when logging object properties using inspect().  System default is 5
  depth?: number;
  // Whether node's inspect method should show hidden attributes.  System default is false
  showHidden?: boolean;
  // Pass color flag to inspect
  color?: boolean;
}

export enum AttributesFormatOption {
  Stringify = 'Stringify',
  Inspect = 'Inspect',
  Augment = 'Augment'
}

export enum DataFormatOption {
  Inspect = 'Inspect',
  Default = 'Default'
}

export enum MessageFormatOption {
  Default = 'Default',
  Augment = 'Augment'
}

export interface FormatOptions {
  attributes?: AttributesFormatOption,
  message?: MessageFormatOption,
  data?: DataFormatOption
}

/**
 * Determines behavior what is actually logged
 */
export interface LoggingOptions {
  // The log level to log.  Available levels are 'none', 'error', 'warn','info', 'debug' and 'trace' or one of LogLevel enum.  Default is LogLevel.info
  level?: LogLevel | string;
  // How inspect() behaves
  inspectOptions?: InspectOptions;
  // How attributes, message, and data are sent to logger
  formatOptions?: FormatOptions;
  // If false, same as both hideTimestamp, hideSeverity being false and overrides.  If true, hideTimestamp and hideSeverity override.
  hidePrefix?: boolean,
  // Hide timestamp, default is false
  hideTimestamp?: boolean;
  // Hide Severity Prefix (what's output for the level, default is false
  hideSeverity?: boolean;
  // If true or missing, logs the appContext from the Execution Context, defaults is false
  hideAppContext?: boolean,
  // If true or missing, logs the repo supplied to the LoggingAdapter constructor, default is false
  hideRepo?: boolean,
  // If true or missing, logs the source file supplied to the LoggingAdapter constructor, default is false
  hideSourceFile?: boolean,
  // If true or missing, logs the method supplied to the LoggingAdapter constructor, default is false
  hideMethod?: boolean,
  // If true or missing, logs thread from the Execution Context, default is false
  hideThread?: boolean,
  // If true or missing, logs requestId from the Execution Context, default is false
  hideRequestId?: boolean,
  // If true or missing, logs authorization from the Execution Context, default is false;
  hideAuthorization?: boolean,
  // If true, ise colors for text (may not be compatible with all loggers - no harm but inserts control characters
  colorize?: boolean,
  // Timestamp format (currently from moment.js)
  // It will be validated by stringifying a moment in this format and then using the format to build a moment back
  // and checking for equality.
  timestampFormat?: string,
  // Print data as JSON, default is false
  dataAsJson?: boolean
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
  // The repo to override logging for. If set, further constrains on the configured source, independent of source or method.
  // repo can be an array of repos
  repo?: string | string[];
  // The source to override logging for.  If set, further constrains on the configured source, independent of repo or method.
  // Source can be an array of sources
  source?: string | string[];
  // The method to override logging for (optional).  If set, further constrains on the method, independent of repo or source.
  // Method can be an array of methods
  method?: string | string[];
  // The logging options.  If not set or partially set, will assign defaults.
  options?: LoggingOptions;
}

export interface Log {
  // If present, loads the logger implementation pointed to by ModuleDefinition
  nativeLogger?: NativeLogger;
  // Logging options
  options?: LoggingOptions;
  // Logging overrides
  overrides?: OverrideOptions[];
}

// See configuration object for options
export interface LogExecutionContext extends AppExecutionContext {
  log?: Log;
}
