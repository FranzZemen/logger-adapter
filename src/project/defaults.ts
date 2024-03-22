/*
Created by Franz Zemen 03/22/2024
License Type: MIT
*/

import {ExecutionContextDefaults, AppExecutionContextDefaults} from "@franzzemen/execution-context";
import {
  FormatOptions,
  AttributesFormatOption,
  DataFormatOption,
  MessageFormatOption,
  InspectOptions,
  LogLevelManagement, LoggingOptions, OverrideOptions, NativeLogger, Log, LogExecutionContext
} from './log-execution-context.js'
import {Logger, LogLevel} from "./logger.js";
import {ConsoleLogger} from "./console-logger.js";

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
  };
  static LoggingOptions: LoggingOptions = {
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
  static OverrideOptions: OverrideOptions = {
    options: LogExecutionContextDefaults.LoggingOptions
  };
  static NativeLogger: NativeLogger = {
    logLevelManagement: LogExecutionContextDefaults.LogLevelManagement
  };
  static Log: Log = {
    options: LogExecutionContextDefaults.LoggingOptions,
    nativeLogger: LogExecutionContextDefaults.NativeLogger
  };
  static LogExecutionContext: LogExecutionContext = {
    execution: ExecutionContextDefaults.Execution(),
    app: AppExecutionContextDefaults.App,
    log: LogExecutionContextDefaults.Log
  };

  static Instance(): Logger {
    return new ConsoleLogger();
  }

}
