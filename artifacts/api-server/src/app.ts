import express, { type Express } from "express";
import cors from "cors";
import pinoHttp from "pino-http";
import router from "./routes";
import { logger } from "./lib/logger";

const app: Express = express();

app.use(
  pinoHttp({
    logger,
    serializers: {
      req(req) {
        return {
          id: req.id,
          method: req.method,
          url: req.url?.split("?")[0],
        };
      },
      res(res) {
        return {
          statusCode: res.statusCode,
        };
      },
    },
  }),
);
const allowedOrigins = process.env.ALLOWED_ORIGINS
  ? process.env.ALLOWED_ORIGINS.split(",")
  : [
      "http://localhost:8081",
      "http://127.0.0.1:8081",
      "http://localhost:8082",
      "http://127.0.0.1:8082",
      "http://localhost:19006",
    ];

app.use(
  cors({
    origin: allowedOrigins.includes("*") ? true : allowedOrigins,
    credentials: true,
  })
);
app.use(express.json({ limit: "50kb" }));
app.use(express.urlencoded({ limit: "50kb", extended: true }));

app.use("/api", router);

// Global error handler — catches any unhandled errors thrown in routes
app.use((err: any, req: any, res: any, next: any) => {
  const status = err.status ?? err.statusCode ?? 500;
  const message = status === 413
    ? "Payload too large — maximum request size is 50kb."
    : err.message ?? "Internal server error";
  logger.error({ err, url: req.url, method: req.method }, "[unhandled error]");
  if (!res.headersSent) {
    res.status(status).json({ error: message });
  }
});

export default app;
