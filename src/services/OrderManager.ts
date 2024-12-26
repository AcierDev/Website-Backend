import { AlertManager } from "./AlertManager";
import { DatabaseService } from "./DatabaseService";
import { LoggerService } from "./LoggerService";
import { ShipStationOrder } from "../models/ShipStationOrder";
import { config } from "../config/config";
import {
  ColumnTitles,
  ColumnTypes,
  Item,
  ItemSizes,
  ItemStatus,
} from "../models/Item";

export class OrderManager {
  private static instance: OrderManager;
  private logger = LoggerService.getInstance();
  private db = DatabaseService.get();

  public static get(): OrderManager {
    if (!this.instance) {
      this.instance = new OrderManager();
      this.instance.initializeBoard();
    }
    return this.instance;
  }

  private async initializeBoard(): Promise<void> {
    try {
      await this.db.assertConnection();
      const board = await this.db.getBoard();
      if (!board) {
        throw new Error("Board not found");
      }
    } catch (error) {
      await this.handleError("Error initializing board", error as Error);
    }
  }

  public async importNewOrder(resourceUrl: string): Promise<void> {
    try {
      const { orders } = await this.fetchShipstationOrder(resourceUrl);
      const shipstationOrder = orders[0];
      const newOrders = await this.convertShipstationOrderToItems(
        shipstationOrder
      );
      await Promise.all(newOrders.map((order) => this.addNewItem(order)));
    } catch (error) {
      await this.handleError("Error importing new order", error as Error);
    }
  }

  private async addNewItem(item: Item): Promise<void> {
    try {
      const board = await this.db.getBoard();
      if (!board) {
        throw new Error("Board not found");
      }
      await this.db.addItemToBoard(board.id, item);
      this.logger.info("New item added successfully");
      
      // Count hidden items
      const hiddenItems = board.items_page.items.filter(
        (item) => item.status === ItemStatus.Hidden
      ).length + 1; // Add 1 to include the newly added item
      
      // Send alerts
      await Promise.all([
        AlertManager.sendText(
          "Ben",
          "New Message",
          `New order for ${item.shippingDetails.name} imported to the system successfully`
        ),
        // Send additional alert if 5 or more hidden items
        hiddenItems >= 5 ? 
          AlertManager.sendText(
            "Ben & Akiva & Dovi",
            "New Message",
            `Alert: There are now ${hiddenItems} hidden orders in the system that need attention`
          ) : Promise.resolve()
      ]);
    } catch (error) {
      await this.handleError(
        `Error adding new item for ${item.shippingDetails.name}`,
        error as Error
      );
    }
  }

  private async fetchShipstationOrder(
    resourceUrl: string
  ): Promise<{ orders: ShipStationOrder[] }> {
    try {
      const response = await fetch(resourceUrl, {
        method: "GET",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Basic ${Buffer.from(
            `${config.shipstation.apiKey}:${config.shipstation.apiSecret}`
          ).toString("base64")}`,
        },
      });

      if (!response.ok) {
        throw new Error(`ShipStation API error: ${response.statusText}`);
      }

      return response.json();
    } catch (error) {
      await this.handleError(
        "Error fetching ShipStation order",
        error as Error
      );
      throw error;
    }
  }

  private async handleError(context: string, error: Error): Promise<void> {
    const errorMessage = `${context}: ${error.message}`;
    this.logger.error(errorMessage);

    try {
      await AlertManager.sendText("Ben", "Error", errorMessage);
    } catch (alertError) {
      this.logger.error(
        `Failed to send alert: ${(alertError as Error).message}`
      );
    }
  }

  private async convertShipstationOrderToItems(
    order: ShipStationOrder
  ): Promise<Item[]> {
    const items: Item[] = [];

    for (const item of order.items) {
      if (item.name === "Discount") continue;

      const newItem: Item = {
        id: order.orderId.toString(),
        values: [
          {
            columnName: ColumnTitles.Customer_Name,
            text: order.shipTo.name,
            type: ColumnTypes.Text,
          },
          {
            columnName: ColumnTitles.Due,
            text: new Date(order.shipByDate).getTime().toString(),
            type: ColumnTypes.Date,
          },
          {
            columnName: ColumnTitles.Design,
            type: ColumnTypes.Dropdown,
            text: item.name.split("-")[1]?.trim() || "Unknown Design",
          },
          {
            columnName: ColumnTitles.Size,
            type: ColumnTypes.Dropdown,
            text:
              this.parseDimensions(item.options[0]?.value) || "Unknown Size",
          },
        ],
        createdAt: new Date(order.createDate).getTime(),
        status: ItemStatus.Hidden,
        vertical: false,
        visible: true,
        deleted: false,
        isScheduled: false,
        shippingDetails: order.shipTo,
      };
      items.push(newItem);
    }

    return items;
  }

  private parseDimensions(str: string): string {
    if (!str) return "Contact Ben";

    str = str.replace(/&quot;/g, '"');
    const inchPattern = /(\d+)"\s*x\s*(\d+)"/i;
    const footInchPattern = /(\d+)"\s*x\s*(\d+)\s*feet/i;

    let width = 0;
    let length = 0;

    const inchMatch = inchPattern.exec(str);
    if (inchMatch) {
      width = parseInt(inchMatch[1]);
      length = parseInt(inchMatch[2]);
    } else {
      const footInchMatch = footInchPattern.exec(str);
      if (footInchMatch) {
        width = parseInt(footInchMatch[1]);
        length = parseInt(footInchMatch[2]) * 12;
      } else {
        return "Contact Ben";
      }
    }

    return this.convertInchesToSize(length, width);
  }

  private convertInchesToSize(length: number, width: number): string {
    const sizeMap: Record<number, Record<number, ItemSizes>> = {
      18: {
        36: ItemSizes.Fourteen_By_Seven,
        48: ItemSizes.Sixteen_By_Six,
      },
      30: {
        48: ItemSizes.Sixteen_By_Ten,
        60: ItemSizes.Twenty_By_Ten,
        72: ItemSizes.TwentyFour_By_Ten,
      },
      36: {
        60: ItemSizes.Twenty_By_Twelve,
        72: ItemSizes.TwentyFour_By_Twelve,
        84: ItemSizes.TwentyEight_By_Twelve,
      },
      48: {
        84: ItemSizes.TwentyEight_By_Sixteen,
        96: ItemSizes.ThirtyTwo_By_Sixteen,
        108: ItemSizes.ThirtySix_By_Sixteen,
      },
    };

    return sizeMap[width]?.[length] || "Contact Ben";
  }
}
