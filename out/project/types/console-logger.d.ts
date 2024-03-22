import { Logger, LogLevel } from "./logger.js";
export declare class ConsoleLogger implements Logger {
    error(): boolean;
    error(err: any, data?: any, color?: string): boolean | void;
    warn(): boolean;
    warn(data: any, message?: string, color?: string): boolean;
    info(): boolean;
    info(data: any, message?: string, color?: string): boolean;
    debug(): boolean;
    debug(data: any, message?: string, color?: string): boolean;
    trace(): boolean;
    trace(data: any, message?: string, color?: string): boolean;
    setLevel(logLevel: LogLevel | string): void;
}
