/*
Created by Franz Zemen 03/22/2024
License Type: MIT
*/
import {SyncCheckFunction, ValidationError, ValidationSchema} from "fastest-validator";
import moment from "moment/moment.js";
import {moduleDefinitionSchemaWrapper} from "@franzzemen/module-factory";
import _ from "lodash";
import {appExecutionContextSchema, getSyncCheckFunction, isSyncCheckFunction} from "@franzzemen/execution-context";
import {getValidator} from "@franzzemen/fastest-validator-wrapper";
import {isPromise} from "util/types";
import {LogExecutionContext, OverrideOptions} from "./log-execution-context.js";
import {LogExecutionContextDefaults} from "./defaults.js";
import {LogLevel} from "./logger.js";

const systemGenerated: string = '';

const inspectOptionsSchema: ValidationSchema = {
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

const formatOptionsSchema: ValidationSchema = {
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
};

const formatOptionsSchemaWrapper = {
  type: 'object',
  optional: true,
  default: LogExecutionContextDefaults.FormatOptions,
  props: formatOptionsSchema
};

const optionsSchema: ValidationSchema = {
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

const optionsSchemaWrapper: ValidationSchema = {
  type: 'object',
  default: LogExecutionContextDefaults.LoggingOptions,
  props: optionsSchema
};

const overrideOptionsSchema: ValidationSchema = {
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

const overrideOptionsSchemaWrapper: ValidationSchema = {
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

const nativeLoggerSchema: ValidationSchema = {
  module: moduleDefinitionSchemaWrapper,
  logLevelManagement: {
    type: 'string',
    optional: true,
    default: LogExecutionContextDefaults.LogLevelManagement
  },
  instance: {
    type: 'object',
    optional: true
  }
};

const nativeLoggerSchemaWrapper: ValidationSchema = {
  type: 'object',
  optional: true,
  default: LogExecutionContextDefaults.NativeLogger,
  props: nativeLoggerSchema
};

const logSchema: ValidationSchema = {
  nativeLogger: nativeLoggerSchemaWrapper,
  options: optionsSchemaWrapper,
  overrides: {
    type: 'array',
    optional: true,
    items: overrideOptionsSchemaWrapper
  }
};

const logSchemaWrapper: ValidationSchema = {
  type: 'object',
  optional: true,
  default: LogExecutionContextDefaults.Log,
  props: logSchema
};

export const logExecutionContextSchema: ValidationSchema = {...{log: logSchemaWrapper}, ...appExecutionContextSchema};

export const logExecutionContextSchemaWrapper: ValidationSchema = {
  type: 'object',
  optional: true,
  default: LogExecutionContextDefaults.LogExecutionContext,
  props: logExecutionContextSchema
};

export function isLogExecutionContext(options: any | LogExecutionContext): options is LogExecutionContext {
  return options && 'log' in options; // Faster than validate
}

const check: SyncCheckFunction = getSyncCheckFunction(logExecutionContextSchema);
  
export function validateLogExecutionContext(context: LogExecutionContext): true | ValidationError[] {
  const result = check(context);
  if (result === true) {
    context.validated = true;
  }
  return result;
}
