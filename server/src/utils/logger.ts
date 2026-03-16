import pino from "pino";

const isDev = process.env.NODE_ENV !== "production";

export const logger = pino({
  level: process.env.LOG_LEVEL || "info",

  base: {
    service: "erp-saas-api",
    env: process.env.NODE_ENV || "development",
  },

  timestamp: pino.stdTimeFunctions.isoTime,

  redact: {
    paths: [
      "req.headers.authorization",
      "req.headers.cookie",
      "password",
      "token"
    ],
    censor: "[REDACTED]"
  },

  ...(isDev && {
    transport: {
      target: "pino-pretty",
      options: {
        colorize: true,
        translateTime: "SYS:standard",
        ignore: "pid,hostname"
      }
    }
  })
});