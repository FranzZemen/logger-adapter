import { FgCyan, FgGreen, FgMagenta, FgRed, FgYellow } from './colors.js';
export class ConsoleLogger {
    error(err, data, color = FgRed) {
        if (!err && !data) {
            return true;
        }
        if (data) {
            console.error(color, err, data);
        }
        else {
            console.error(color, err);
        }
    }
    warn(data, message, color = FgYellow) {
        if (!data && !message) {
            return true;
        }
        if (message) {
            console.warn(color, data, message);
        }
        else {
            console.warn(color, data);
        }
        return false;
    }
    info(data, message, color = FgGreen) {
        if (!data && !message) {
            return true;
        }
        if (message) {
            console.info(color, data, message);
        }
        else {
            console.info(color, data);
        }
        return false;
    }
    debug(data, message, color = FgCyan) {
        if (!data && !message) {
            return false;
        }
        if (message) {
            console.debug(color, data, message);
        }
        else {
            console.debug(color, data);
        }
        return false;
    }
    trace(data, message, color = FgMagenta) {
        if (!data && !message) {
            return true;
        }
        if (message) {
            console.trace(color, data, message);
        }
        else {
            console.trace(color, data);
        }
        return false;
    }
    setLevel(logLevel) {
        // Do nothing...use LoggerAdapter in 'adapter' mode.
    }
}
//# sourceMappingURL=console-logger.js.map