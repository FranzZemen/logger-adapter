# Read Me
LoggerAdapter is a general logger that adapts to any logger.  

The package also exports LogExecutionContext which extends AppExecutionContext in @franzzemen/app-execution-context 
and is usually the execution context object used in nearly all @franzzemen packages.

LoggerAdapter re-exports a limited number of definitions and functions from ExecutionContext and AppExecutionContext, so
that in most cases those base packages do not need to be imported.

    export {ExecutionContext, isExecutionContext, validate as validateExecutionContext} from '@franzzemen/execution-context';
    export {AppExecutionContext, isAppExecutionContext, validate as validateAppExecutionContext} from '@franzzemen/app-execution-context'

# Install

    npm i @franzzemen/logger-adapter

# Usage

This package is published for an ECMAScript module loader.  For CommonJS see below.

### ECMAScript

Create an Logger Adapter with defaults (including Native console logger).

    import {LogExecutionContext, LoggerAdapter, validate} from '@franzzemen/app-execution-context';
    const ec:LogExecutionContext = {};
    // The logger adapter will validate ec
    const log: LoggerAdapter = new LoggerAdapter(ec); 
    log.info(ec, `I'm alive!`);

## CommonJS

    // Importing types in typescript from CommonJS is allowed
    import {LogExecutionContext, LoggerAdapter} from '@franzzemen/execution-context';

    import('@franzzemen/logger-adapter')
        .then(package => {
            const ec:AppExecutionContext = {};
            const log: LoggerAdapter = new package.LoggerAdapter(ec);
            log.info(ec, `I'm alive!`);            
        }


# The Logger Adapter
Most @franzzemen packages can be used in server side node (bare metal), in the browser, and in the cloud.  Moreover, 
many @franzzemen packages are generally intended to be integrated with other packages, which may have their own 
logger.  The LoggerAdapter allows any logger to be configured and used.  All that is needed is to create an integration
proxy that implements @franzzemen/logger-adapter/Logger.  By default, it uses the ConsoleLogger object which is a 
proxy to the console object.

Essentially the Logger Adapter provides a standard interface within @franzzemen software to perform logging, leaving
the physical logger to the user of the library, by way of configuration.  Thus one can use any logger under the
covers, including the one for their own software, and configure the @franzzemen logger adapter to play nice.  This
can include console loggers, AWS Cloudwatch loggers, any of the many Javascript logger libraries and so on.  Another 
advantage provided is you can change the logger implementation without changing any code.  This makes the code 
portable not only between projects but also between environments.

To create a new logger implementation for the adapter, simply implement the Logger interface and define the module 
definition in the LogExecutionContext.log.nativeLogger.module property.  You can pass implementation specific 
arguments such as options through the ModuleDefinition.paramsArray property, in the order your factory function or 
constructor expects it.

## Step 1 Implement Logger

    class BunyanLogger {
        error(err, ...params);
        // In the following, data can be an object to log, or a string
        warn(data, message?: string, ...params);
        info(data, message?: string, ...params);
        debug(data, message?: string, ...params);
        trace(data, message?: string, ...params);
    }

The default actual logger supplied is, of course, the native logger which simply implement the console functions:


    class ConsoleLogger implements LoggerI {
    
        error(err, stacktrace?: any, color: string = FgRed) {
            console.error(color, err, stacktrace);
        }
        
        warn(data, message?: string, color: string = FgYellow) {
            console.warn(color, data, message);
        }
        
        info(data, message?: string, color: string = FgGreen) {
            console.info(color, data, message);
        }
        
        debug(data, message?: string, color: string = FgCyan) {
            console.debug(color, data, message);
        }
        
        trace(data, message?: string, color: string = FgMagenta) {
            console.trace(color, data, message);
        }       
    }

@franzzemen/cloudwatch-logs provides an implementation for AWS Cloudwatch logging.  The package is currently under
private visibility - contact @franzzemen to inquire as to getting access.

Underneath the covers in the @franzzemen libraries, the class Index is created anywhere logging is necessary.
It's function is to:

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

Once created you can call its convenience methods.  Under the covers, it ulimately calls whatever logging
implementation you provided (or ConsoleLogger/console otherwise).

    error(err, stacktrace?: any, color: string = FgRed)
    warn(data, message?: string, color: string = FgYellow)
    info(data, message?: string, color: string = FgGreen)
    debug(data, message?: string, color: string = FgCyan)
    trace(data, message?: string, color: string = FgMagenta) 

The color is optional, and works only with the console logger, but feel free to use it for your own logger implementations.

## Configuration
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


