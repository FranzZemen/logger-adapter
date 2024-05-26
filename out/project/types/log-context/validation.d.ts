import { ValidationError, ValidationSchema } from "fastest-validator";
import { LogExecutionContext } from "./log-execution-context.js";
export declare const inspectOptionsSchemaWrapper: ValidationSchema;
export declare const logExecutionContextSchema: ValidationSchema;
export declare const logExecutionContextSchemaWrapper: ValidationSchema;
export declare function isLogExecutionContext(options: any | LogExecutionContext): options is LogExecutionContext;
export declare function validateLogExecutionContext(context: Partial<LogExecutionContext>): true | ValidationError[];
