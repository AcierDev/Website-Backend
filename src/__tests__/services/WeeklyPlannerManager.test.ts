import { WeeklyPlannerManager } from "../../services/WeeklyPlannerManager";
import { DatabaseService } from "../../services/DatabaseService";
import { AlertManager } from "../../services/AlertManager";
import { Board, WeeklySchedules } from "../../models/Board";
import { addDays, startOfWeek, format } from "date-fns";

// First, set up the module mocks
jest.mock("../../services/DatabaseService");
jest.mock("../../services/AlertManager");
jest.mock("node-schedule", () => ({
  scheduleJob: jest.fn().mockReturnValue({ cancel: jest.fn() }),
}));

// Create the mock function with proper typing
const mockGetBoard = jest.fn().mockResolvedValue(null) as jest.MockedFunction<
  () => Promise<Board | null>
>;

// Create a mock database instance that matches DatabaseService type
const mockDb = {
  updateBoard: jest.fn().mockResolvedValue(undefined),
  getBoard: mockGetBoard,
  assertConnection: jest.fn().mockResolvedValue(true),
  logger: {},
  mongoClient: {},
  db: {},
  boards: {},
} as unknown as DatabaseService;

// Mock the static get() method to return our mock instance
jest.spyOn(DatabaseService, "get").mockReturnValue(mockDb);

// Mock AlertManager's static method
jest.spyOn(AlertManager, "sendText").mockResolvedValue(undefined);

describe("WeeklyPlannerManager", () => {
  let manager: WeeklyPlannerManager;
  const mockDate = new Date("2024-09-22");

  const mockScheduleItem = {
    id: "173200945384d",
    done: false,
  };

  const mockBoard: Board = {
    id: "jbh705qtz",
    name: "Sample Board 7",
    items_page: { cursor: "", items: [] },
    weeklySchedules: {
      "2024-09-22": {
        Sunday: [],
        Monday: [mockScheduleItem],
        Tuesday: [],
        Wednesday: [],
        Thursday: [],
        Friday: [],
        Saturday: [],
      },
    },
  };

  beforeEach(() => {
    jest.clearAllMocks();
    jest.useFakeTimers();
    jest.setSystemTime(mockDate);

    // Reset mock implementations with proper typing
    mockGetBoard.mockReset();
    mockGetBoard.mockResolvedValue(mockBoard);

    manager = WeeklyPlannerManager.get();
  });

  afterEach(() => {
    jest.useRealTimers();
  });

  test("moves incomplete items to next day", async () => {
    // Set time to Tuesday 2024-09-24 at midnight
    const tuesday = new Date("2024-09-24T00:00:00.000Z");
    jest.setSystemTime(tuesday);

    // Mock getBoard to return the board with Monday's items
    const boardWithMondayItems: Board = {
      ...mockBoard,
      weeklySchedules: {
        "2024-09-22": {
          Sunday: [],
          Monday: [mockScheduleItem],
          Tuesday: [],
          Wednesday: [],
          Thursday: [],
          Friday: [],
          Saturday: [],
        },
      },
    };
    mockGetBoard.mockResolvedValueOnce(boardWithMondayItems);

    await manager["moveIncompleteItems"]();

    expect(mockDb.updateBoard).toHaveBeenCalledWith(
      "jbh705qtz",
      expect.objectContaining({
        weeklySchedules: {
          "2024-09-22": {
            Sunday: [],
            Monday: [],
            Tuesday: [mockScheduleItem],
            Wednesday: [],
            Thursday: [],
            Friday: [],
            Saturday: [],
          },
        },
      })
    );
  });

  test("creates new week when transitioning from Saturday to Sunday", async () => {
    // Set time to Sunday 2024-09-29 at midnight
    const nextSunday = new Date("2024-09-29T00:00:00.000Z");
    jest.setSystemTime(nextSunday);

    // Mock a board with items on Saturday of previous week
    const saturdayBoard: Board = {
      ...mockBoard,
      weeklySchedules: {
        "2024-09-22": {
          Sunday: [],
          Monday: [],
          Tuesday: [],
          Wednesday: [],
          Thursday: [],
          Friday: [],
          Saturday: [mockScheduleItem],
        },
      },
    };
    mockGetBoard.mockResolvedValueOnce(saturdayBoard);

    await manager["moveIncompleteItems"]();

    expect(mockDb.updateBoard).toHaveBeenCalledWith(
      "jbh705qtz",
      expect.objectContaining({
        weeklySchedules: {
          "2024-09-22": {
            Sunday: [],
            Monday: [],
            Tuesday: [],
            Wednesday: [],
            Thursday: [],
            Friday: [],
            Saturday: [],
          },
          "2024-09-29": {
            Sunday: [mockScheduleItem],
            Monday: [],
            Tuesday: [],
            Wednesday: [],
            Thursday: [],
            Friday: [],
            Saturday: [],
          },
        },
      })
    );
  });

  test("handles errors during midnight tasks", async () => {
    const error = new Error("Database error");
    (
      DatabaseService.get() as jest.Mocked<DatabaseService>
    ).getBoard.mockRejectedValueOnce(error);

    await manager["runMidnightTasks"]();

    expect(AlertManager.sendText).toHaveBeenCalledWith(
      "Ben",
      "Error",
      expect.stringContaining("Error moving incomplete items")
    );
  });

  test("initializes and stops jobs correctly", () => {
    manager.initializeJobs();
    expect(manager["jobs"]).toHaveLength(1);

    manager.stopAllJobs();
    expect(manager["jobs"]).toHaveLength(0);
  });
});
