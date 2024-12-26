import express from "express";
import cors from "cors";
import { config } from "./config/config";
import { DatabaseService } from "./services/DatabaseService";
import { OrderManager } from "./services/OrderManager";
import orderRoutes from "./routes/orderRoutes";
import labelRoutes from "./routes/labelRoutes";
import { LoggerService } from "./services/LoggerService";

const app = express();
const logger = LoggerService.getInstance();

// Middleware
app.use(cors());
app.use(express.json());

// Routes
app.use("/api/orders", orderRoutes);
app.use("/api/labels", labelRoutes);

// Start server
app.listen(config.server.port, () => {
  logger.info(`Server listening at http://localhost:${config.server.port}`);

  // Initialize services
  DatabaseService.get();
  setTimeout(() => {
    OrderManager.get();
  }, 5000);
});

process.on("unhandledRejection", (error) => {
  logger.error("Unhandled Rejection:", error as Error);
});

process.on("uncaughtException", (error) => {
  logger.error("Uncaught Exception:", error as Error);
  process.exit(1);
});
