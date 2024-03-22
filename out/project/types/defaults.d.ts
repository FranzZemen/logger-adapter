import { FormatOptions, AttributesFormatOption, DataFormatOption, MessageFormatOption, InspectOptions, LogLevelManagement, LoggingOptions, OverrideOptions, NativeLogger, Log, LogExecutionContext } from './log-execution-context.js';
import { Logger, LogLevel } from "./logger.js";
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
