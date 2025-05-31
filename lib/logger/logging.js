/**
 * @github.com/motebaya - © 2023-10
 * file: logging
 * c: https://github.com/winstonjs/winston#formats
 */
import winston from "winston";
import chalk from "chalk";

const logger = (options) => {
  const { level, longformat } = options;
  return winston.createLogger({
    level: level === "info" ? level : "debug",
    format: winston.format.combine(
      winston.format((info) => {
        info.level = info.level.toUpperCase();
        return info;
      })(),
      winston.format.colorize({ all: true }),
      winston.format.timestamp({
        format: !longformat ? "HH:mm:ss" : "YYYY-MM-DD HH:mm:ss",
      }),
      winston.format.printf(({ level, message, timestamp }) => {
        return `[${chalk.blue(timestamp)}] ${level}::${message}\r`;
      })
    ),
    transports: [
      new winston.transports.Console({
        level: level === "info" ? level : "debug",
      }),
      new winston.transports.Http({ level: "http" }),
    ],
  });
};

export default logger;
