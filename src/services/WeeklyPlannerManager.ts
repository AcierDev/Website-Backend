import schedule from "node-schedule";
import { AlertManager } from "./AlertManager";
import { format, addDays, startOfWeek } from "date-fns";
import { LoggerService } from "./LoggerService";
import { DatabaseService } from "./DatabaseService";
import { DayName, WeeklySchedules } from "../models/Board";

export class WeeklyPlannerManager {
  private static instance: WeeklyPlannerManager;
  private jobs: schedule.Job[] = [];
  private logger = LoggerService.getInstance();
  private db = DatabaseService.get();

  private readonly dayOrder: DayName[] = [
    "Sunday",
    "Monday",
    "Tuesday",
    "Wednesday",
    "Thursday",
    "Friday",
    "Saturday",
  ];

  public static get(): WeeklyPlannerManager {
    if (!this.instance) {
      this.instance = new WeeklyPlannerManager();
    }
    return this.instance;
  }

  public initializeJobs(): void {
    // Run every day at midnight (00:00)
    const midnightJob = schedule.scheduleJob("0 0 * * *", async () => {
      try {
        await this.runMidnightTasks();
      } catch (error) {
        await this.handleError("Failed to run midnight tasks", error as Error);
      }
    });

    this.jobs.push(midnightJob);
    this.logger.info("Scheduled jobs initialized");
  }

  private async runMidnightTasks(): Promise<void> {
    this.logger.info("Starting midnight tasks...");
    try {
      await this.moveIncompleteItems();
      this.logger.info("Midnight tasks completed successfully");
    } catch (error) {
      this.logger.error("Error in runMidnightTasks:", error);
      await this.handleError("Failed to run midnight tasks", error as Error);
    }
  }

  private async moveIncompleteItems(): Promise<void> {
    try {
      this.logger.info("Starting moveIncompleteItems...");
      await this.db.assertConnection();
      const board = await this.db.getBoard();

      this.logger.info("Retrieved board:", board);

      if (!board?.weeklySchedules) {
        this.logger.info("No weekly schedules found");
        return;
      }

      const today = new Date();
      this.logger.info("Current date:", today);

      const weekStart = startOfWeek(today);
      const weekKey = format(weekStart, "yyyy-MM-dd");
      this.logger.info("Week start:", weekStart);
      this.logger.info("Week key:", weekKey);

      // Get today and yesterday indices
      const todayIndex = today.getDay();
      const yesterdayIndex = (todayIndex - 1 + 7) % 7;
      const todayName = this.dayOrder[todayIndex];
      const yesterdayName = this.dayOrder[yesterdayIndex];

      this.logger.info("Today index:", todayIndex, "Today name:", todayName);
      this.logger.info(
        "Yesterday index:",
        yesterdayIndex,
        "Yesterday name:",
        yesterdayName
      );

      // Determine which week to look in
      let targetWeekKey = weekKey;
      if (todayIndex === 0) {
        const prevWeekStart = addDays(weekStart, -7);
        targetWeekKey = format(prevWeekStart, "yyyy-MM-dd");
        this.logger.info(
          "Sunday detected, looking at previous week:",
          targetWeekKey
        );
      }

      const currentWeekSchedule = board.weeklySchedules[targetWeekKey];
      if (!currentWeekSchedule) {
        this.logger.warn("No schedule found for week:", targetWeekKey);
        return;
      }

      // Get yesterday's incomplete items
      const yesterdayItems = currentWeekSchedule[yesterdayName] || [];
      const incompleteItems = yesterdayItems.filter((item) => !item.done);

      this.logger.info("Yesterday's items:", yesterdayItems);
      this.logger.info("Incomplete items:", incompleteItems);

      if (incompleteItems.length === 0) {
        this.logger.info("No incomplete items to move");
        return;
      }

      const updatedSchedules = { ...board.weeklySchedules };
      this.logger.info("Initial updated schedules:", updatedSchedules);

      if (todayIndex === 0) {
        // If it's Sunday, create new week
        const nextWeekKey = weekKey; // This will be the current week's key
        this.logger.info("Creating new week schedule for:", nextWeekKey);

        if (!updatedSchedules[nextWeekKey]) {
          updatedSchedules[nextWeekKey] = this.createEmptyWeekSchedule();
          this.logger.info("Created empty week schedule");
        }

        // Clear Saturday's incomplete items from previous week
        updatedSchedules[targetWeekKey] = {
          ...updatedSchedules[targetWeekKey],
          [yesterdayName]: yesterdayItems.filter((item) => item.done),
        };
        this.logger.info(
          "Updated previous week's Saturday:",
          updatedSchedules[targetWeekKey]
        );

        // Add incomplete items to Sunday of new week
        updatedSchedules[nextWeekKey] = {
          ...updatedSchedules[nextWeekKey],
          Sunday: [
            ...incompleteItems,
            ...(updatedSchedules[nextWeekKey].Sunday || []),
          ],
        };
        this.logger.info(
          "Updated new week's Sunday:",
          updatedSchedules[nextWeekKey]
        );
      } else {
        // Move items within the same week
        this.logger.info("Moving items within the same week");
        updatedSchedules[targetWeekKey] = {
          ...updatedSchedules[targetWeekKey],
          [yesterdayName]: yesterdayItems.filter((item) => item.done),
          [todayName]: [
            ...incompleteItems,
            ...(currentWeekSchedule[todayName] || []),
          ],
        };
        this.logger.info(
          "Updated schedule for current week:",
          updatedSchedules[targetWeekKey]
        );
      }

      // Save updates
      this.logger.info("Saving updates to database...");
      await this.db.updateBoard(board.id, {
        weeklySchedules: updatedSchedules,
      });
      this.logger.info("Database update completed");

      this.logger.info(
        `Successfully moved ${incompleteItems.length} incomplete items from ${yesterdayName} to ${todayName}`
      );
    } catch (error) {
      this.logger.error("Error in moveIncompleteItems:", error);
      await this.handleError("Error moving incomplete items", error as Error);
    }
  }

  private createEmptyWeekSchedule(): Record<DayName, any[]> {
    return {
      Sunday: [],
      Monday: [],
      Tuesday: [],
      Wednesday: [],
      Thursday: [],
      Friday: [],
      Saturday: [],
    };
  }

  private async handleError(context: string, error: Error): Promise<void> {
    const errorMessage = `${context}: ${error.message}`;
    this.logger.error(errorMessage);
    this.logger.error("Stack trace:", error.stack);
    await AlertManager.sendText("Ben", "Error", errorMessage);
  }

  public stopAllJobs(): void {
    this.jobs.forEach((job) => job.cancel());
    this.jobs = [];
    this.logger.info("All scheduled jobs stopped");
  }
}
