# Read Me

This package exposes two key object:

1. LogExecutionContext:  This is an execution context used throughout @franzzzemen API calls.
2. LoggerAdapter:  This is the logger @franzzemen APIs use, and can be configured to any logging system.  By default 
   it uses the console logger.

This package has both a CommonJS api and an ECMAScript api

# Install

Installation is usually included in @franzzemen package installs.  It can also be individually installed:

    npm i @franzzemen/logger-adapter

# Usage


From CommonJS:

```` javascript
const LoggerAdapter = require('@franzzemen/logger-adapter').LoggerAdapter;

const log = new LoggerAdapter({}, 'myModule','mySourceFile', 'myFunction');
````

From ECMAScript:

```` typescript
import {LoggerAdapter} from '@franzzemen/logger-adapter');

const log = new LoggerAdapter({}, 'myModule','mySourceFile', 'myFunction');

````


# The Logger Adapter

The LoggerAdapter provides transportability for @franzzemen projects to run in the browser, on-Prem or in a cloud 
environment, and to support various loggers.  

The LoggerAdapter provides a relatively standard interface to logging, which is virtually identical to console 
logging methods.  Some methods ommitted for clarity:

    // Some methods omitted for clarity
    interface Logger: { 
        error(err: Error, ...params);
        warn(data: any, message?: string, ...params);
        info(data: any, message?: string, ...params);
        debug(data: any, message?: string, ...params);
        trace(data: any, message?: string, ...params);
    }

Allowing for logs such as:

    log: Logger = ...
    log.info('Hello World');
    log.info({foo:'bar, jack:'jill'},'Random log');

The actual end logger by default is the console, but any logger can be configured.  Most @franzzemen projects expect to 
be integrated into larger projects in different environments, so supporting the larger project's logger is a key design 
point.

# Usage

Typically, an integrating project would not deal with LoggerAdapter directly.  It is called within the @franzzemen 
projects.  however, if desired, it can indeed be instantiated anywhere. 

It is designed to be instantiated in very local context, i.e. within a method or class, but the same instance could 
be used in a broader context.   Typically however, it identifies the package, source and method the logging occured 
in, so it is advantageous to keep its instantiation fine-grained:

    // Package @franzzemen/foo
    // Source bar.ts
    function car(param1, param2, ..., ec?: LogExecutionContext) {
        const log = new LoggerAdapter(ec,'foo', 'bar,'car');
        ...
        log.info('some log');
    }

Since virtually all @franzzemen APIs call for an optional parameter ec?: LogExecutionContext, most users will interact
with the logger through the options LogExecutionContext.  It is also through these options that end users can most 
easily integrate their own logger systems.

# LogExecutionContext

As mentioned, virtually all @franzzemen APIs can be supplied with an optional LogExecutionContext, which can be 
thought of as options.

The base interface of these options is ExecutionContext, covered in the @franzzemen/execution-context package.  This 
interface provides @franzzemen packages with information about the run-time environment, request info and 
multi-process tracking.

The AppExecutionContext extends the ExecutionContext to provide information about the application running the code, 
for example the appContext, or the name of the application.

Finally the LogExecution extends the AppExecutionContext to provide logging configuration.  Logging is such an 
essential part of executing code and so the @franzzemen packages give it first class citizenry. By design almost 
every function and method invoked will pass an execution context, usually the LogExecutionContext.

Locally created LoggingAdapter based on the passed in LogExecutionContext results in logs that point directly to 
exaclty where the log information was generated.

The LogExecution Context top level objects are:

    {
        execution?: Execution;  // From Execution Context
        app?: App;              // From AppExecutionContext
        log?: Log;              // From LogExecutionContext
    }

For purposes of logging, we are only interested in the third property, log.

    log: {
        nativeLogger?: NativeLogger;    // Options defining the underlying logger
        options?: LoggingOptions;       // Options driving logging behavior
        overrides?: OverrideOptions[];  // Array of overrides for options based on the repo, source, or method
    }

## Logging Options

Logging Options are:

    {
        level?: LogLevel | string;          // The log level in the so calle standard of 'none', 'error', 'warn', 'info', 'debug' and 'trace'
        inspectOptions?: InspectOptions;    // The behavior when node.inspect is used
        formatOptions?: FormatOptions;      // How data, mesage and logging attributes are handled
        hidePrefix?: boolean,               // Whether to hide the prefix, which is essentially the timestamp and the severity
        hideTimestamp?: boolean;            // Whether to hid or show timestamp.  No effect if hidePrefix is true.
        hideSeverity?: boolean;             // Whether to hide severity.  No effect if hidePreifx is true;
        hideAppContext?: boolean,           // Don't log the appContext
        hideRepo?: boolean,                 // Don't log the repo
        hideSourceFile?: boolean,           // Don't log the source
        hideMethod?: boolean,               // Don't log the method
        hideThread?: boolean,               // Don't log the threqad
        hideRequestId?: boolean,            // Don't log the  requestId
        hideAuthorization?: boolean,        // Don't log authorizations (what an authenticated identity has access to)
        colorize?: boolean                  // For supported loggers (console) turn on color coding logs
        timestampFormat?: string,           // Timestamp format to use for moment
        dataAsJson?: boolean                // When data is an object, log it as JSoN


To create a new logger implementation for the adapter, simply implement the Logger interface and define the module 
definition in the LogExecutionContext.log.nativeLogger.module property.  You can pass implementation specific 
arguments such as options through the ModuleDefinition.paramsArray property, in the order your factory function or 
constructor expects it.

## Step 1 Implement Logger

    class BunyanLogger {
        error(): boolean; // is enabled
        error(err, ...params);
        // In the following, data can be an object to log, or a string
        warn(): boolean; // is enabled
        warn(data, message?: string, ...params);
        info(): boolean; // is enabled
        info(data, message?: string, ...params);
        debug(): boolean; // is enabled
        debug(data, message?: string, ...params);
        trace(): boolean; // is enabled
        trace(data, message?: string, ...params);
        setLevel(level: LogLevel | string); // Set the log level (called depending on log level management option)
    }

The default actual logger supplied is, of course, the native logger which simply implement the console functions:

@franzzemen/cloudwatch-logs provides an implementation for AWS Cloudwatch logging.  The package is currently under
private visibility - contact @franzzemen to inquire as to getting access.

Underneath the covers in the @franzzemen libraries, the class Index is created anywhere logging is necessary.
Its function is to:

- Properly load and use logging configuration
- Instantiate the appropriate logger implementation
- Log data/messages/errors according to logging levels, including override configurations
- Log reference information

You are free to use the Index in your own code if you find it of use - it is quite stable.  If no logger is
supplied in the configuration, the ConsoleLogger (console) will be used.

Note:  At this time @franzzemen uses the Index, which populates additional useful information in the logs
regardless of logging implementation.  Many of those are overridable in the configuration if you want to have
"clean" logs.

The LoggerAdapater is meant to be instantiated anywhere logs are needed, typically in each method (although in some
cases @franzzemen instantiates a Index for an entire class).  Through configs, one can override the
Index instance behavior for a specific method.

If you do choose to reuse the Logger Adapter, creating it is simple:

    constructor(private execContext?: ExecutionContextI, public repo = '', public sourceFile = '',  public _method = '')

    where:
        execContext: is an ** optiontal ** Exeuction Context (ConsoleLogger/console used if undefined)
        repo: is intended to be the name of the repository, for instance '@franzzemen/re-expression'
        sourcefile: is intended to be the name (no extension) of the source file logging is occuring in
        _method: is intended to bhe the name of the method where logging is occuring

Once created you can call its convenience methods.  Under the covers, it ultimately calls whatever logging
implementation you provided (or ConsoleLogger/console otherwise).

    error(err, stacktrace?: any, color: string = FgRed)
    warn(data, message?: string, color: string = FgYellow)
    info(data, message?: string, color: string = FgGreen)
    debug(data, message?: string, color: string = FgCyan)
    trace(data, message?: string, color: string = FgMagenta) 

The color is optional, and works only with the console logger, but feel free to use it for your own logger implementations.

## Configuration

TODO:  NEEDS REWRITE SINCE ENHANCEMENTS

The logging configuration for the Index is passed through @franzzemen libraries through the Execution
Context as described above.

The Execution Context has an optional property "config.log", with the schema being defined in 'logger-config.ts',
using the notation from the "fastest-validator" third party OSS package.  The contents of that configuration is
described here:

    export interface LogConfigI {
        // If present, loads the logger implementation pointed to by ModuleDefinition
        nativeLogger?: ModuleDefinition;
        // The log level to log.  Available levels are 'none', 'error', 'warn','info', 'debug' and 'trace'
        level?: string;
        // The object depth to log when logging object properties
        depth?: number;
        // Whether node's inspect method should show hidden attributes
        showHidden?: boolean;
        // Logging overrides
        overrides?: LogOverrideConfigI[];
        // The log attributes are 'flattened' into a single line, not logged as an object along with the data
        flatten?: boolean;
        // The log attributes logging flags
        logAttributes?: {
        // If true or missing, logs the appContext from the Execution Context
        hideAppContext?: boolean,
        // If true or missing, logs the repo supplied to the LoggingAdapter constructor
        hideRepo?: boolean,
        // If true or missing, logs the source file supplied to the LoggingAdapter constructor
        hideSourceFile?: boolean,
        // If true or missing, logs the method supplied to the LoggingAdapter constructor
        hideMethod?: boolean,
        // If true or missing, logs thread from the Execution Context
        hideThread?: boolean,
        // If true or missing, logs requestId from the Execution Context
        hideRequestId?: boolean,
        // If true or missing, logs the debug level
        hideLevel?: boolean
    }

The LogOverrideConfig array provides the ability to override logging for any instance of the Logger Adapter:

    export interface LogOverrideConfigI {
        // The repo to override logging for
        repo: string;
        // The level to override
        level: string;
        // The source to override logging for (optional)
        source?: string;
        // The method to override logging for (optional)
        method?: string | string[];
        // Whether inspect should show hidden properties for this override (optional)
        showHidden?: boolean;
        // The override for object depth inspect will use
        depth?: number;
    }


