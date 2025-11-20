const isDevelopment = process.env.NODE_ENV === 'development';

export const logger = {
    log: (...args) => isDevelopment && console.log(...args),
    error: (...args) => console.error(...args),
    warn: (...args) => isDevelopment && console.warn(...args),
    info: (...args) => isDevelopment && console.info(...args),
};