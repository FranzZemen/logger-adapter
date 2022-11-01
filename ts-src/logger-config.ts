import _ from 'lodash';
import {
  AppExecutionContext,
  AppExecutionContextDefaults,
  appExecutionContextSchema
} from '@franzzemen/app-execution-context';
import {ExecutionContextDefaults} from '@franzzemen/execution-context';
import {ModuleDefinition, moduleDefinitionSchemaWrapper} from '@franzzemen/module-factory';
import Validator, {ValidationError, ValidationSchema} from 'fastest-validator';
import {createRequire} from 'node:module';
import {isPromise} from 'util/types';
import {ConsoleLogger} from './console-logger.js';
const requireModule = createRequire(import.meta.url);

const moment = requireModule('moment');


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

export enum LogLevel {
  none = 'none',
  error = 'error',
  warn = 'warn',
  info = 'info',
  debug = 'debug',
  trace = 'trace'
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

// Where are log levels determined?
export enum LogLevelManagement {
  Adapter= 'Adapter', // Log level management is driven by the adapter, if possible.
  Native = 'Native', // Log level management is driven by the native implementation, if possible.
  Independent = 'Independent' // Default, log level is driven independently, first by adapter, than by native.  Most restrictive wins.
}

// Default Values
export class LogExecutionContextDefaults {
  static InspectEnabled = true;
  static InspectDepth = 5;
  static ShowHiddenInspectProperties = false;
  static InspectColor = true;

  static AttributesFormatOption: AttributesFormatOption = AttributesFormatOption.Augment;
  static DataFormatOption: DataFormatOption = DataFormatOption.Default;
  static MessageFormatOption: MessageFormatOption = MessageFormatOption.Default;
  static HidePrefix = false;
  static HideAppContext = false;
  static HideRepo = false;
  static HideSourceFile = false;
  static HideMethod = false;
  static HideThread = false;
  static HideRequestId = false;
  static HideAuthorization = false;
  static HideTimestamp = false;
  static HideSeverity = false;
  static Colorize = true;
  static DefaultTimeStampFormat = 'YYYY-MM-DD[T]HH:mm:ss.SSS';
  static DataAsJson = false;
  static LogLevelManagement = LogLevelManagement.Independent;
  static Level = LogLevel.info;
  static Instance(): Logger {
    return new ConsoleLogger();
  }

  static InspectOptions: InspectOptions = {
    enabled: LogExecutionContextDefaults.InspectEnabled,
    depth: LogExecutionContextDefaults.InspectDepth,
    showHidden: LogExecutionContextDefaults.ShowHiddenInspectProperties,
    color: LogExecutionContextDefaults.InspectColor
  };

  static FormatOptions: FormatOptions = {
    attributes: LogExecutionContextDefaults.AttributesFormatOption,
    message: LogExecutionContextDefaults.MessageFormatOption,
    data: LogExecutionContextDefaults.DataFormatOption
  }

  static LoggingOptions: LoggingOptions = {
    level: LogExecutionContextDefaults.Level,
    inspectOptions: LogExecutionContextDefaults.InspectOptions,
    hidePrefix: LogExecutionContextDefaults.HidePrefix,
    hideTimestamp: LogExecutionContextDefaults.HideTimestamp,
    hideSeverity: LogExecutionContextDefaults.HideSeverity,
    hideAppContext: LogExecutionContextDefaults.HideAppContext,
    hideRepo: LogExecutionContextDefaults.HideRepo,
    hideSourceFile: LogExecutionContextDefaults.HideSourceFile,
    hideMethod: LogExecutionContextDefaults.HideMethod,
    hideThread: LogExecutionContextDefaults.HideThread,
    hideRequestId: LogExecutionContextDefaults.HideRequestId,
    hideAuthorization: LogExecutionContextDefaults.HideAuthorization,
    colorize: LogExecutionContextDefaults.Colorize,
    timestampFormat: LogExecutionContextDefaults.DefaultTimeStampFormat
  };

  static OverrideOptions: OverrideOptions = {
    options: LogExecutionContextDefaults.LoggingOptions
  };

  static NativeLogger: NativeLogger = {
    logLevelManagement: LogExecutionContextDefaults.LogLevelManagement
  }

  static Log: Log = {
    options: LogExecutionContextDefaults.LoggingOptions,
    nativeLogger: LogExecutionContextDefaults.NativeLogger
  };

  static LogExecutionContext: LogExecutionContext = {
    execution: ExecutionContextDefaults.Execution(),
    app: AppExecutionContextDefaults.App,
    log: LogExecutionContextDefaults.Log
  };

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
  color?: boolean
}

export interface  FormatOptions {
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

export interface NativeLogger {
  module?: ModuleDefinition;
  logLevelManagement?: LogLevelManagement;
  instance?: Logger
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

export const inspectOptionsSchema: ValidationSchema = {
  enabled: {
    type: 'boolean',
    default: LogExecutionContextDefaults.InspectEnabled
  },
  depth: {
    type: 'number',
    default: LogExecutionContextDefaults.InspectDepth
  },
  showHidden: {
    type: 'boolean',
    default: LogExecutionContextDefaults.ShowHiddenInspectProperties
  },
  color: {
    type: 'boolean',
    optional: true,
    default: LogExecutionContextDefaults.InspectColor
  }
};
export const inspectOptionsSchemaWrapper: ValidationSchema = {
  type: 'object',
  default: LogExecutionContextDefaults.InspectOptions,
  props: inspectOptionsSchema
};

export const formatOptionsSchema: ValidationSchema = {
  attributes: {
    type: 'string',
    optional: true,
    default: LogExecutionContextDefaults.AttributesFormatOption
  },
  message: {
    type: 'string',
    optional: true,
    default: LogExecutionContextDefaults.MessageFormatOption
  },
  data: {
    type: 'string',
    optional: true,
    default: LogExecutionContextDefaults.DataFormatOption
  }
}

export const formatOptionsSchemaWrapper = {
  type: 'object',
  optional: true,
  default: LogExecutionContextDefaults.FormatOptions,
  props: formatOptionsSchema
}

const systemGenerated = undefined;

export const optionsSchema: ValidationSchema = {
  level: {
    type: 'enum',
    values: ['none', 'error', 'warn', 'info', 'debug', 'trace'],
    default: LogLevel.info
  },
  inspectOptions: inspectOptionsSchemaWrapper,
  formatOptions: formatOptionsSchemaWrapper,
  hidePrefix: {type: 'boolean', optional: true, default: LogExecutionContextDefaults.HidePrefix},
  hideAppContext: {type: 'boolean', optional: true, default: LogExecutionContextDefaults.HideAppContext},
  hideRepo: {type: 'boolean', optional: true, default: LogExecutionContextDefaults.HideRepo},
  hideSourceFile: {type: 'boolean', optional: true, default: LogExecutionContextDefaults.HideSourceFile},
  hideMethod: {type: 'boolean', optional: true, default: LogExecutionContextDefaults.HideMethod},
  hideThread: {type: 'boolean', optional: true, default: LogExecutionContextDefaults.HideThread},
  hideRequestId: {type: 'boolean', optional: true, default: LogExecutionContextDefaults.HideRequestId},
  hideAuthorization: {type: 'boolean', optional: true, default: LogExecutionContextDefaults.HideAuthorization},
  hideTimestamp: {type: 'boolean', optional: true, default: LogExecutionContextDefaults.HideTimestamp},
  hideSeverity: {type: 'boolean', optional: true, default: LogExecutionContextDefaults.HideSeverity},
  colorize: {type: 'boolean', optional: true, default: LogExecutionContextDefaults.Colorize},
  timestampFormat: {
    type: 'string', custom: (value: string, errors: ValidationError[]) => {
      const testFormatStr = moment().format(value);
      const testMoment = moment(testFormatStr, value);
      if (!moment.isMoment(testMoment)) {
        errors.push({
          type: 'format',
          message: 'Not a valid timestamp format',
          field: systemGenerated
        });
      }
      return value;
    },
    dataAsJson: {type: 'boolean', optional: true, default: LogExecutionContextDefaults.DataAsJson},
    default: LogExecutionContextDefaults.DefaultTimeStampFormat
  }
};

export const optionsSchemaWrapper: ValidationSchema = {
  type: 'object',
  default: LogExecutionContextDefaults.LoggingOptions,
  props: optionsSchema
};

export const overrideOptionsSchema: ValidationSchema = {
  repo: [{
    type: 'string',
    optional: true
  }, {
    type: 'array',
    min: 1,
    items: {
      type: 'string'
    }
  }],
  source: [{
    type: 'string',
    optional: true
  }, {
    type: 'array',
    optional: true,
    min: 1,
    items: {
      type: 'string'
    }
  }],
  method: [{
    type: 'string',
    optional: true
  }, {
    type: 'array',
    optional: true,
    items: {
      type: 'string'
    }
  }],
  options: optionsSchemaWrapper
};

export const overrideOptionsSchemaWrapper: ValidationSchema = {
  type: 'object',
  default: LogExecutionContextDefaults.OverrideOptions,
  custom: (value: OverrideOptions, errors: ValidationError[]) => {
    const repoMissing = value.repo === undefined || value.repo === null;
    const sourceMissing = value.source === undefined || value.source === null;
    const methodMissing = value.method === undefined || value.method === null;
    if (repoMissing && sourceMissing && methodMissing) {
      errors.push({
        type: 'missing override option constraint',
        message: 'At least one of repo or source or method must be provided',
        field: systemGenerated
      });
    }
    return value;
  },
  props: overrideOptionsSchema
};

export const nativeLoggerSchema: ValidationSchema = {
  module: moduleDefinitionSchemaWrapper,
  logLevelManagement: {
    type: 'string',
    optional: true,
    default: LogExecutionContextDefaults.LogLevelManagement
  },
  instance: {
    type: 'object',
    optional: true,
  }
}

export const nativeLoggerSchemaWrapper: ValidationSchema = {
  type: 'object',
  optional: true,
  default: LogExecutionContextDefaults.NativeLogger,
  props: nativeLoggerSchema
}

export const logSchema: ValidationSchema = {
  nativeLogger: nativeLoggerSchemaWrapper,
  options: optionsSchemaWrapper,
  overrides: {
    type: 'array',
    optional: true,
    items: overrideOptionsSchemaWrapper
  }
}

export const logSchemaWrapper: ValidationSchema = {
  type: 'object',
  optional: true,
  default: LogExecutionContextDefaults.Log,
  props: logSchema
}

export const logExecutionContextSchema: ValidationSchema = _.merge({
  log: logSchemaWrapper
}, appExecutionContextSchema);

export const logExecutionContextSchemaWrapper: ValidationSchema = {
  type: 'object',
  optional: true,
  default: LogExecutionContextDefaults.LogExecutionContext,
  props: logExecutionContextSchema
};

export function isLogExecutionContext(options: any | LogExecutionContext): options is LogExecutionContext {
  return 'log' in options; // Faster than validate
}

const check = (new Validator({useNewCustomCheckerFunction: true})).compile(logExecutionContextSchema);

export function validate(context: LogExecutionContext): true | ValidationError[] {
  const result = check(context);
  if (isPromise(result)) {
    throw new Error('Unexpected asynchronous on LogExecutionContext validation');
  } else {
    if (result === true) {
      context.validated = true;
    }
    return result;
  }
}
