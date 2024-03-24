import * as chai from 'chai';
import 'mocha';
import { AttributesFormatOption, LoggerAdapter, LogLevel, LogLevelManagement, validateLogExecutionContext as validate } from '@franzzemen/logger-adapter';
let should = chai.should();
let expect = chai.expect;
describe('logger-adapter tests', () => {
    it('should validate', done => {
        const ec = {
            app: {
                name: 'test'
            },
            logConfig: {
                options: {
                    level: LogLevel.debug
                },
                overrides: [{
                        repo: 'test2',
                        options: {
                            level: LogLevel.info
                        },
                        method: ['method1', 'method2'],
                        source: 'index'
                    }],
                nativeLogger: {
                    module: {
                        moduleName: 'test',
                        constructorName: 'test',
                        functionName: 'getLogger'
                    },
                    logLevelManagement: LogLevelManagement.Native
                }
            }
        };
        const result = validate(ec);
        result.should.be.true;
        const loggerAdapter = new LoggerAdapter({ app: { name: 'test' }, logConfig: { options: { level: 'debug' } } });
        loggerAdapter.should.exist;
        done();
    });
    it('should log', done => {
        const ec = {
            app: {
                name: 'test'
            },
            logConfig: {
                options: {
                    level: 'debug'
                }
            }
        };
        const log = new LoggerAdapter(ec);
        done();
    });
    it('should log, hiding attributes', done => {
        const ec = {
            app: {
                name: 'test'
            },
            logConfig: {
                options: {
                    level: 'debug',
                    hideAppContext: true,
                    hideMethod: true,
                    hideRepo: true,
                    hideRequestId: true,
                    hideSourceFile: true,
                    hideThread: true
                },
                nativeLogger: {
                    logLevelManagement: LogLevelManagement.Native
                }
            }
        };
        const log = new LoggerAdapter(ec);
        log.debug('It is bar?');
        log.info({ foo: 'bar' }, 'It is foo bar');
        done();
    });
    it('should log, flattening', done => {
        const execContext = {
            app: {
                name: 'test'
            },
            logConfig: {
                options: {
                    level: 'debug',
                    formatOptions: {
                        attributes: AttributesFormatOption.Stringify
                    }
                }
            }
        };
        const log = new LoggerAdapter(execContext, 'logger-adapter', 'logger-adapter.test', 'should log, flattening');
        log.debug('It is bar2?');
        log.debug({ foo: 'bar2' }, 'It is foo bar2');
        done();
    });
    it('should log, hiding timestamp and severity prefix', done => {
        const execContext = {
            app: {
                name: 'test'
            },
            logConfig: {
                options: {
                    level: 'debug',
                    hideTimestamp: true,
                    hideSeverity: true
                }
            }
        };
        const log = new LoggerAdapter(execContext, 'logger-adapter', 'logger-adapter.test', 'should log, hiding timestamp and severity prefix');
        log.debug('It is bar2?');
        log.debug({ foo: 'bar2' }, 'It is foo bar2');
        log.error(new Error('Some Error'));
        log.error(new Error('Some Error'), 'hello');
        done();
    });
});
//# sourceMappingURL=logger-adapter.test.js.map