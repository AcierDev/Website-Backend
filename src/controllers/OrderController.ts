import { Request, Response } from "express";
import { OrderManager } from "../services/OrderManager";
import { LoggerService } from "../services/LoggerService";

export class OrderController {
  private logger = LoggerService.getInstance();
  private orderManager = OrderManager.get();

  public handleNewOrder = async (
    req: Request,
    res: Response
  ): Promise<void> => {
    const { resource_url, resource_type } = req.body;

    if (!resource_url || !resource_type) {
      res.status(400).send("Invalid webhook data");
      return;
    }

    this.logger.info("Received webhook:", {
      resource_url,
      resource_type,
    });

    try {
      await this.orderManager.importNewOrder(resource_url);
      res.status(200).send("Webhook received and processed");
    } catch (error) {
      this.logger.error("Error processing webhook:", error as Error);
      res.status(500).send("Error processing webhook");
    }
  };
}
