import moment from "moment/moment.js";
import { moduleDefinitionSchemaWrapper } from "@franzzemen/module-factory";
import { appExecutionContextSchema, getSyncCheckFunction } from "@franzzemen/execution-context";
import { LogExecutionContextDefaults } from "../core/defaults.js";
import { LogLevel } from "../logger.js";
const systemGenerated = '';
const inspectOptionsSchema = {
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
const formatOptionsSchema = {
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
const optionsSchema = {
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
const optionsSchemaWrapper = {
    type: 'object',
    default: LogExecutionContextDefaults.LoggingOptions,
    props: optionsSchema
};
const overrideOptionsSchema = {
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
const overrideOptionsSchemaWrapper = {
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
const nativeLoggerSchema = {
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
const nativeLoggerSchemaWrapper = {
    type: 'object',
    optional: true,
    default: LogExecutionContextDefaults.NativeLogger,
    props: nativeLoggerSchema
};
const logSchema = {
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
export const logExecutionContextSchema = { ...{ log: logSchemaWrapper }, ...appExecutionContextSchema };
export const logExecutionContextSchemaWrapper = {
    type: 'object',
    optional: true,
    default: LogExecutionContextDefaults.LogExecutionContext,
    props: logExecutionContextSchema
};
export function isLogExecutionContext(options) {
    return options && 'log' in options; // Faster than validate
}
const check = getSyncCheckFunction(logExecutionContextSchema);
export function validateLogExecutionContext(context) {
    const result = check(context);
    if (result === true) {
        context.validated = true;
    }
    return result;
}
//# sourceMappingURL=validation.js.map