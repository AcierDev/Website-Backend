import { DatabaseService } from "../../services/DatabaseService";
import { WeeklyPlannerManager } from "../../services/WeeklyPlannerManager";

async function main() {
  try {
    const db = DatabaseService.get();
    setTimeout(async () => {
      console.log("Starting midnight task runner...");
      const manager = WeeklyPlannerManager.get();

      // Run the midnight tasks
      await manager["runMidnightTasks"]();

      console.log("Midnight tasks completed successfully");
      process.exit(0);
    }, 3000);
  } catch (error) {
    console.error("Error running midnight tasks:", error);
    process.exit(1);
  }
}

main();
