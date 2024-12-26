import { DatabaseService } from "../../services/DatabaseService";
import { OrderManager } from "../../services/OrderManager";
import { Item, ItemStatus, ColumnTypes, ColumnTitles } from "../../models/Item";

async function main() {
  try {
    console.log("Starting hidden items alert test...");
    
    // Initialize and connect to database
    const db = DatabaseService.get();
    await db.connect();
    console.log("Database connected successfully");
    
    await db.assertConnection();
    const orderManager = OrderManager.get();

    // Create a test item
    const testItem: Item = {
      id: Date.now().toString(),
      values: [
        {
          columnName: ColumnTitles.Customer_Name,
          text: "Test Customer",
          type: ColumnTypes.Text,
        },
        {
          columnName: ColumnTitles.Due,
          text: new Date().getTime().toString(),
          type: ColumnTypes.Date,
        },
        {
          columnName: ColumnTitles.Design,
          type: ColumnTypes.Dropdown,
          text: "Test Design",
        },
        {
          columnName: ColumnTitles.Size,
          type: ColumnTypes.Dropdown,
          text: "20 x 10",
        },
      ],
      createdAt: Date.now(),
      status: ItemStatus.Hidden,
      vertical: false,
      visible: true,
      deleted: false,
      isScheduled: false,
      shippingDetails: {
        name: "Test Customer",
        company: "",
        street1: "123 Test St",
        street2: "",
        street3: "",
        city: "Test City",
        state: "TS",
        postalCode: "12345",
        country: "US",
        phone: "",
        residential: true
      },
    };

    // Add 5 test items to trigger the alert
    console.log("Adding 5 test items...");
    for (let i = 1; i <= 5; i++) {
      const item = { ...testItem, id: `${Date.now()}-${i}` };
      await orderManager["addNewItem"](item);
      console.log(`Added test item ${i}`);
      
      // Add a small delay between items to prevent rate limiting
      await new Promise(resolve => setTimeout(resolve, 1000));
    }

    console.log("Test completed successfully!");
    
    // Close the database connection before exiting
    await db.close();
    process.exit(0);
  } catch (error) {
    console.error("Test failed:", error);
    process.exit(1);
  }
}

// Add a delay before starting to ensure database connection is established
setTimeout(() => {
  main();
}, 3000); 