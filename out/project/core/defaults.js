/*
Created by Franz Zemen 03/22/2024
License Type: MIT
*/
import { ExecutionContextDefaults, AppExecutionContextDefaults } from "@franzzemen/execution-context";
import { AttributesFormatOption, DataFormatOption, MessageFormatOption, LogLevelManagement } from '../log-context/log-execution-context.js';
import { LogLevel } from "../logger.js";
import { ConsoleLogger } from "../console/console-logger.js";
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
        logConfig: LogExecutionContextDefaults.Log
    };
    static Instance() {
        return new ConsoleLogger();
    }
}
//# sourceMappingURL=defaults.js.map