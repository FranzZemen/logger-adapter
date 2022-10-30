import chai from 'chai';
import 'mocha';
import {LogExecutionContext, LoggerAdapter, LogLevel, validate} from '../publish/index.js';

let should = chai.should();
let expect = chai.expect;

describe('logger-adapter tests', () => {
  it('should validate', done => {
    const ec: LogExecutionContext = {
      log: {
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
        loggerModule: {
          moduleName: 'test',
          constructorName: 'test',
          functionName: 'getLogger'
        }
      }
    };
    const result = validate(ec);
    result.should.be.true;
    done();
  });
  it('should log', done => {
    const ec: LogExecutionContext = {
      log: {
        options: {
          level: 'debug'
        }
      }
    };
    const log: LoggerAdapter = new LoggerAdapter(ec);
    done();
  });
  it('should log, hiding attributes', done => {
    const ec: LogExecutionContext = {
      log: {
        options: {
          level: 'debug',
          hideAppContext: true,
          hideLevel: true,
          hideMethod: true,
          hideRepo: true,
          hideRequestId: true,
          hideSourceFile: true,
          hideThread: true
        }
      }
    };
    const log: LoggerAdapter = new LoggerAdapter(ec);
    log.debug('It is bar?');
    log.debug({foo: 'bar'}, 'It is foo bar');
    done();
  });
  it('should log, flattening', done => {
    const execContext: LogExecutionContext = {
      log: {
        options: {
          level: 'debug',
          flatten: true
        }
      }
    };
    const log: LoggerAdapter = new LoggerAdapter(execContext);
    log.debug('It is bar2?');
    log.debug({foo: 'bar2'}, 'It is foo bar2');
    done();
  });
  it('should log, hiding timestamp and severity prefix', done => {
    const execContext: LogExecutionContext = {
      log: {
        options: {
          level: 'debug',
          hideTimestamp: true,
          hideSeverityPrefix: true
        }
      }
    };
    const log: LoggerAdapter = new LoggerAdapter(execContext, 'app-utility', 'logger-config.test', 'should log, hiding timestamp and severity prefix');
    log.debug('It is bar2?');
    log.debug({foo: 'bar2'}, 'It is foo bar2');
    done();
  });
});
