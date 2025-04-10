const winston = require('winston');
const path = require('path');
const fs = require('fs');
const { app } = require('electron');

// Create logs directory if it doesn't exist
const logsDir = path.join(process.cwd(), 'logs');
if (!fs.existsSync(logsDir)) {
  fs.mkdirSync(logsDir, { recursive: true });
}

// Create a logger instance
const logger = winston.createLogger({
  level: 'debug',
  format: winston.format.combine(
    winston.format.timestamp({
      format: 'YYYY-MM-DD HH:mm:ss'
    }),
    winston.format.printf(info => `${info.timestamp} [${info.level.toUpperCase()}]: ${info.message}`)
  ),
  transports: [
    // Write to console
    new winston.transports.Console({
      format: winston.format.combine(
        winston.format.colorize(),
        winston.format.simple()
      )
    }),
    // Write to log file
    new winston.transports.File({ 
      filename: path.join(logsDir, 'app.log'),
      maxsize: 5242880, // 5MB
      maxFiles: 5
    })
  ]
});

// Add log levels
const logLevels = {
  error: 'error',
  warn: 'warn',
  info: 'info',
  debug: 'debug'
};

module.exports = {
  log: (level, message) => {
    logger.log(level, message);
  },
  error: (message) => {
    logger.error(message);
  },
  warn: (message) => {
    logger.warn(message);
  },
  info: (message) => {
    logger.info(message);
  },
  debug: (message) => {
    logger.debug(message);
  },
  levels: logLevels
};