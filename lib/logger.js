const appRoot = require('app-root-path');
const winston = require('winston');

const createErrorMessage = (error) => {
  let message = `message: ${error.message}`;
  message += `trace: ${error.stack}`;
  delete error.message;
  for (key in error) {
    message += `\n  ${key}: ${error[key]}`;
  }
  return message;
};

const enumerateErrorFormat = winston.format((info) => {
  if (info instanceof Error) {
    Object.assign(info, { message: createErrorMessage(info) });
  }
  return info;
});

const options = {
  // log파일
  file: {
    level: 'info',
    filename: `${appRoot}/logs/tikitaka.log`, // 로그파일을 남길 경로
    handleExceptions: true,
    json: false,
    maxsize: 5242880, // 5MB
    maxFiles: 5,
    colorize: false,
  },
  // 개발 시 console에 출력
  console: {
    level: 'debug',
    handleExceptions: true,
    json: false, // 로그형태를 json으로도 뽑을 수 있다.
    colorize: true,
  },
};

const logger = winston.createLogger({
  level: process.env.NODE_ENV === 'development' ? 'debug' : 'info',
  format: winston.format.combine(
    winston.format.timestamp(),
    enumerateErrorFormat(),
    process.env.NODE_ENV === 'development'
      ? winston.format.colorize()
      : winston.format.uncolorize(),
    winston.format.splat(),
    winston.format.printf(
      ({ timestamp, level, message }) => `${timestamp} [${level}] ${message}`
    )
  ),
  transports: [new winston.transports.File(options.file)],
});

if (process.env.NODE_ENV !== 'production') {
  logger.add(new winston.transports.Console(options.console)); // 개발 시 console로도 출력
}

logger.stream = {
  write: (message) => {
    logger.info(message.replace(/\r\n|\r|\n/, ''));
  },
};

module.exports = logger;
