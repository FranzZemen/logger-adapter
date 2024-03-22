/*
Created by Franz Zemen 03/22/2024
License Type: MIT
*/

export enum LogLevel {
  none = 'none',
  error = 'error',
  warn = 'warn',
  info = 'info',
  debug = 'debug',
  trace = 'trace'
}


/**
 * Logger - any object that provides the following interface
 */
export interface Logger {
  error(): boolean;

  error(err: any, ...params: any[]): boolean

  warn(): boolean;

  warn(data: any, message?: string, ...params: any[]): boolean;

  info(): boolean;

  info(data:any, message?: string, ...params: any[]): boolean;

  debug(): boolean;

  debug(data: any, message?: string, ...params: any[]): boolean;

  trace(): boolean;

  trace(data: any, message?: string, ...params: any[]):boolean;

  setLevel(logLevel: LogLevel | string): void;
}
