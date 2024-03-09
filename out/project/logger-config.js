import { AppExecutionContextDefaults, appExecutionContextSchema } from '@franzzemen/app-execution-context';
import { ExecutionContextDefaults } from '@franzzemen/execution-context';
import { moduleDefinitionSchemaWrapper } from '@franzzemen/module-factory';
import _ from 'lodash';
import moment from 'moment';
import { isPromise } from 'util/types';
import { ConsoleLogger } from './console-logger.js';
import { getValidator } from "@franzzemen/fastest-validator-wrapper";
export var LogLevel;
(function (LogLevel) {
    LogLevel["none"] = "none";
    LogLevel["error"] = "error";
    LogLevel["warn"] = "warn";
    LogLevel["info"] = "info";
    LogLevel["debug"] = "debug";
    LogLevel["trace"] = "trace";
})(LogLevel || (LogLevel = {}));
export var AttributesFormatOption;
(function (AttributesFormatOption) {
    AttributesFormatOption["Stringify"] = "Stringify";
    AttributesFormatOption["Inspect"] = "Inspect";
    AttributesFormatOption["Augment"] = "Augment";
})(AttributesFormatOption || (AttributesFormatOption = {}));
export var DataFormatOption;
(function (DataFormatOption) {
    DataFormatOption["Inspect"] = "Inspect";
    DataFormatOption["Default"] = "Default";
})(DataFormatOption || (DataFormatOption = {}));
export var MessageFormatOption;
(function (MessageFormatOption) {
    MessageFormatOption["Default"] = "Default";
    MessageFormatOption["Augment"] = "Augment";
})(MessageFormatOption || (MessageFormatOption = {}));
// Where are log levels determined?
export var LogLevelManagement;
(function (LogLevelManagement) {
    LogLevelManagement["Adapter"] = "Adapter";
    LogLevelManagement["Native"] = "Native";
    LogLevelManagement["Independent"] = "Independent"; // Default, log level is driven independently, first by adapter, than by native.  Most restrictive wins.
})(LogLevelManagement || (LogLevelManagement = {}));
// Default Values
export class LogExecutionContextDefaults {
    static InspectEnabled = true;
    static InspectDepth = 5;
    static ShowHiddenInspectProperties = false;
    static InspectColor = true;
    static AttributesFormatOption = AttributesFormatOption.Augment;
    static DataFormatOption = DataFormatOption.Default;
    static MessageFormatOption = MessageFormatOption.Default;
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
    static InspectOptions = {
        enabled: LogExecutionContextDefaults.InspectEnabled,
        depth: LogExecutionContextDefaults.InspectDepth,
        showHidden: LogExecutionContextDefaults.ShowHiddenInspectProperties,
        color: LogExecutionContextDefaults.InspectColor
    };
    static FormatOptions = {
        attributes: LogExecutionContextDefaults.AttributesFormatOption,
        message: LogExecutionContextDefaults.MessageFormatOption,
        data: LogExecutionContextDefaults.DataFormatOption
    };
    static LoggingOptions = {
        level: LogExecutionContextDefaults.Level,
        inspectOptions: LogExecutionContextDefaults.InspectOptions,
        formatOptions: LogExecutionContextDefaults.FormatOptions,
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
    static OverrideOptions = {
        options: LogExecutionContextDefaults.LoggingOptions
    };
    static NativeLogger = {
        logLevelManagement: LogExecutionContextDefaults.LogLevelManagement
    };
    static Log = {
        options: LogExecutionContextDefaults.LoggingOptions,
        nativeLogger: LogExecutionContextDefaults.NativeLogger
    };
    static LogExecutionContext = {
        execution: ExecutionContextDefaults.Execution(),
        app: AppExecutionContextDefaults.App,
        log: LogExecutionContextDefaults.Log
    };
    static Instance() {
        return new ConsoleLogger();
    }
}
export const inspectOptionsSchema = {
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
export const inspectOptionsSchemaWrapper = {
    type: 'object',
    default: LogExecutionContextDefaults.InspectOptions,
    props: inspectOptionsSchema
};
export const formatOptionsSchema = {
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
export const formatOptionsSchemaWrapper = {
    type: 'object',
    optional: true,
    default: LogExecutionContextDefaults.FormatOptions,
    props: formatOptionsSchema
};
const systemGenerated = '';
export const optionsSchema = {
    level: {
        type: 'enum',
        values: ['none', 'error', 'warn', 'info', 'debug', 'trace'],
        default: LogLevel.info
    },
    inspectOptions: inspectOptionsSchemaWrapper,
    formatOptions: formatOptionsSchemaWrapper,
    hidePrefix: { type: 'boolean', optional: true, default: LogExecutionContextDefaults.HidePrefix },
    hideAppContext: { type: 'boolean', optional: true, default: LogExecutionContextDefaults.HideAppContext },
    hideRepo: { type: 'boolean', optional: true, default: LogExecutionContextDefaults.HideRepo },
    hideSourceFile: { type: 'boolean', optional: true, default: LogExecutionContextDefaults.HideSourceFile },
    hideMethod: { type: 'boolean', optional: true, default: LogExecutionContextDefaults.HideMethod },
    hideThread: { type: 'boolean', optional: true, default: LogExecutionContextDefaults.HideThread },
    hideRequestId: { type: 'boolean', optional: true, default: LogExecutionContextDefaults.HideRequestId },
    hideAuthorization: { type: 'boolean', optional: true, default: LogExecutionContextDefaults.HideAuthorization },
    hideTimestamp: { type: 'boolean', optional: true, default: LogExecutionContextDefaults.HideTimestamp },
    hideSeverity: { type: 'boolean', optional: true, default: LogExecutionContextDefaults.HideSeverity },
    colorize: { type: 'boolean', optional: true, default: LogExecutionContextDefaults.Colorize },
    timestampFormat: {
        type: 'string', custom: (value, errors) => {
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
        dataAsJson: { type: 'boolean', optional: true, default: LogExecutionContextDefaults.DataAsJson },
        default: LogExecutionContextDefaults.DefaultTimeStampFormat
    }
};
export const optionsSchemaWrapper = {
    type: 'object',
    default: LogExecutionContextDefaults.LoggingOptions,
    props: optionsSchema
};
export const overrideOptionsSchema = {
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
export const overrideOptionsSchemaWrapper = {
    type: 'object',
    default: LogExecutionContextDefaults.OverrideOptions,
    custom: (value, errors) => {
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
export const nativeLoggerSchema = {
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
export const nativeLoggerSchemaWrapper = {
    type: 'object',
    optional: true,
    default: LogExecutionContextDefaults.NativeLogger,
    props: nativeLoggerSchema
};
export const logSchema = {
    nativeLogger: nativeLoggerSchemaWrapper,
    options: optionsSchemaWrapper,
    overrides: {
        type: 'array',
        optional: true,
        items: overrideOptionsSchemaWrapper
    }
};
export const logSchemaWrapper = {
    type: 'object',
    optional: true,
    default: LogExecutionContextDefaults.Log,
    props: logSchema
};
export const logExecutionContextSchema = _.merge({
    log: logSchemaWrapper
}, appExecutionContextSchema);
export const logExecutionContextSchemaWrapper = {
    type: 'object',
    optional: true,
    default: LogExecutionContextDefaults.LogExecutionContext,
    props: logExecutionContextSchema
};
export function isLogExecutionContext(options) {
    return options && 'log' in options; // Faster than validate
}
const check = (getValidator({ useNewCustomCheckerFunction: true })).compile(logExecutionContextSchema);
export function validate(context) {
    const result = check(context);
    if (isPromise(result)) {
        throw new Error('Unexpected asynchronous on LogExecutionContext validation');
    }
    else {
        if (result === true) {
            context.validated = true;
        }
        return result;
    }
}
//# sourceMappingURL=logger-config.js.map