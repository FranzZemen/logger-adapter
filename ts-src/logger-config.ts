import {
  AppExecutionContext,
  AppExecutionContextDefaults,
  appExecutionContextSchema
} from '@franzzemen/app-execution-context';
import {ExecutionContextDefaults} from '@franzzemen/execution-context';
import {ModuleDefinition, moduleDefinitionSchema} from '@franzzemen/module-factory';
import deepmerge from 'deepmerge';
import {createRequire} from 'node:module';
import Validator, {ValidationError, ValidationSchema} from 'fastest-validator';
import {isPromise} from 'util/types';

const requireModule = createRequire(import.meta.url);
const moment = requireModule('moment');

export enum LogLevel {
  none = 'none',
  error = 'error',
  warn = 'warn',
  info = 'info',
  debug = 'debug',
  trace = 'trace'
}

// Default Values
export class LogExecutionContextDefaults {
  static InspectEnabled = true;
  static InspectDepth = 5;
  static ShowHiddenInspectProperties = false;
  static InspectOptions: InspectOptions = {
    enabled: LogExecutionContextDefaults.InspectEnabled,
    depth: LogExecutionContextDefaults.InspectDepth,
    showHidden: LogExecutionContextDefaults.ShowHiddenInspectProperties
  };
  static Flatten = false;
  static HideAppContext = false;
  static HideRepo = false;
  static HideSourceFile = false;
  static HideMethod = false;
  static HideThread = false;
  static HideRequestId = false;
  static HideLevel = false;
  static HideTimestamp = false;
  static HideSeverityPrefix = false;
  static DefaultTimeStampFormat = 'YYYY-MM-DD[T]HH:mm:ss.SSS';

  static LevelLabels: { level: LogLevel, label: string }[] = [{
    level: LogLevel.none,
    label: 'NONE'
  }, {
    level: LogLevel.error,
    label: 'ERROR'
  }, {
    level: LogLevel.warn,
    label: 'WARN'
  }, {
    level: LogLevel.info,
    label: 'INFO'
  }, {
    level: LogLevel.debug,
    label: 'DEBUG'
  }, {
    level: LogLevel.trace,
    label: 'TRACE'
  }];

  static LoggingOptions: LoggingOptions = {
    level: LogLevel.info,
    inspectOptions: LogExecutionContextDefaults.InspectOptions,
    flatten: LogExecutionContextDefaults.Flatten,
    hideTimestamp: LogExecutionContextDefaults.HideTimestamp,
    hideSeverityPrefix: LogExecutionContextDefaults.HideSeverityPrefix,
    hideAppContext: LogExecutionContextDefaults.HideAppContext,
    hideRepo: LogExecutionContextDefaults.HideRepo,
    hideSourceFile: LogExecutionContextDefaults.HideSourceFile,
    hideMethod: LogExecutionContextDefaults.HideMethod,
    hideThread: LogExecutionContextDefaults.HideThread,
    hideRequestId: LogExecutionContextDefaults.HideRequestId,
    hideLevel: LogExecutionContextDefaults.HideLevel,
    timestampFormat: LogExecutionContextDefaults.DefaultTimeStampFormat
  };

  static OverrideOptions: OverrideOptions = {
    options: LogExecutionContextDefaults.LoggingOptions
  };

  static Log: Log = {
    options: LogExecutionContextDefaults.LoggingOptions,
    levelLabels: LogExecutionContextDefaults.LevelLabels
  };

  static LogExecutionContext: LogExecutionContext = {
    execution: ExecutionContextDefaults.Execution(),
    appContext: AppExecutionContextDefaults.AppContext,
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
}


/**
 * Determines behavior what is actually logged
 */
export interface LoggingOptions {
  // The log level to log.  Available levels are 'none', 'error', 'warn','info', 'debug' and 'trace' or one of LogLevel enum.  Default is LogLevel.info
  level?: LogLevel | string;
  // How inspect() behaves
  inspectOptions?: InspectOptions;
  // The log attributes are 'flattened' into a single line, not logged as an object along with the data.  Default is false
  flatten?: boolean;
  // Hide timestamp, default is false
  hideTimestamp?: boolean;
  // Hide Severity Prefix (what's output for the level, default is false
  hideSeverityPrefix?: boolean;
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
  // If true or missing, logs the debug level, default is false
  hideLevel?: boolean,
  // Timestamp format (currently from moment.js)
  // It will be validated by stringifying a moment in this format and then using the format to build a moment back
  // and checking for equality.
  timestampFormat?: string
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
  loggerModule?: ModuleDefinition;
  // Logging options
  options?: LoggingOptions;
  // Logging overrides
  overrides?: OverrideOptions[];
  // Level Labels
  levelLabels?: { level: LogLevel, label: string }[];
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
  checked: {
    type: 'boolean',
    optional: true,
    default: true // If checked/defaulted
  }
};
export const inspectOptionsSchemaWrapper: ValidationSchema = {
  type: 'object',
  default: LogExecutionContextDefaults.InspectOptions,
  props: inspectOptionsSchema
};

const systemGenerated = undefined;

export const optionsSchema: ValidationSchema = {
  level: {
    type: 'enum',
    values: ['none', 'error', 'warn', 'info', 'debug', 'trace'],
    default: LogLevel.info
  },
  inspectOptions: inspectOptionsSchemaWrapper,
  flatten: {type: 'boolean', default: LogExecutionContextDefaults.Flatten},
  hideAppContext: {type: 'boolean', default: LogExecutionContextDefaults.HideAppContext},
  hideRepo: {type: 'boolean', default: LogExecutionContextDefaults.HideRepo},
  hideSourceFile: {type: 'boolean', default: LogExecutionContextDefaults.HideSourceFile},
  hideMethod: {type: 'boolean', default: LogExecutionContextDefaults.HideMethod},
  hideThread: {type: 'boolean', default: LogExecutionContextDefaults.HideThread},
  hideRequestId: {type: 'boolean', default: LogExecutionContextDefaults.HideRequestId},
  hideLevel: {type: 'boolean', default: LogExecutionContextDefaults.HideLevel},
  hideTimestamp: {type: 'boolean', default: LogExecutionContextDefaults.HideTimestamp},
  hideSeverityPrefix: {type: 'boolean', default: LogExecutionContextDefaults.HideSeverityPrefix},
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



export const loggerModuleSchemaWrapper: ValidationSchema = {
  type: 'object',
  optional: true,
  props: moduleDefinitionSchema
};

export const logSchema: ValidationSchema = {
  loggerModule: loggerModuleSchemaWrapper,
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

export const logExecutionContextSchema: ValidationSchema = deepmerge({
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
