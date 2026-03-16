import { pinoHttp } from "pino-http";
import { randomUUID } from "crypto";
import { logger } from "./logger";

export const httpLogger = pinoHttp({
  logger,

  genReqId(req) {
    const id = req.headers["x-request-id"];
    if (id) return id;
    return randomUUID();
  },

  customLogLevel(req, res, err) {
    if (res.statusCode >= 500 || err) return "error";
    if (res.statusCode >= 400) return "warn";
    return "info";
  },

  customSuccessMessage(req, res) {
    return `${req.method} ${req.url} completed`;
  },

  customErrorMessage(req, res) {
    return `${req.method} ${req.url} failed`;
  },

  serializers: {
    req(req) {
      return {
        id: req.id,
        method: req.method,
        url: req.url
      };
    },

    res(res) {
      return {
        statusCode: res.statusCode
      };
    }
  }
});