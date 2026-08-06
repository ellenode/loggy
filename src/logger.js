import winston, { createLogger, transports, format } from 'winston';
const { combine, timestamp, label, printf } = format;
import moment from 'moment';
import fs from 'fs';
import { join } from 'path';

const safeStringify = (obj) => {
    const seen = new WeakSet();

    return JSON.stringify(obj, (key, value) => {
        if (typeof value === 'object' && value !== null) {
            if (seen.has(value)) {
                return '[Circular]';
            }

            seen.add(value);
        }

        return value;
    }, 2);
};

const logFormat = printf(({ level, message, label, timestamp }) => {

    if (typeof message === 'object') {
        message = safeStringify(message);
    }

    return `${timestamp} ${level.toUpperCase()}: ${message}`;

});

let instance = null;
let instancePath = null;

/**
 * @returns {winston.Logger}
 */
const logger = (path = '') => {

    if (instance && instancePath != path && instancePath != null) {
        throw new Error('Logger already initialized');
    }

    instancePath = path;

    if (instance) {
        return instance;
    }

    path = join('logs', path ? path : '');

    // Si no existe el directorio lo creamos
    if (!fs.existsSync(path)) {
        fs.mkdirSync(path, { recursive: true });
    }

    const today = moment().format('YYYY-MM-DD_HH-mm-ss');

    const transportFile = new transports.File({
        filename: `${path}/${today}.log`,
        datePattern: 'YYYY-MM-DD HH:mm:ss',
        maxFiles: '30d',
    });

    instance = createLogger({
        level: 'info',
        format: combine(
            label({ label: 'app' }),
            format.timestamp({
                format: () => moment().format('YYYY-MM-DD HH:mm:ss')
            }),
            logFormat
        ),
        transports: [transportFile]
    });

    instance.close = async function () {
        for (const transport of this.transports) {
            if (typeof transport.close === "function") {
                await transport.close();
            }
        }

        instance = null;
        instancePath = null;
    };

    return instance;
}

export { logger };