import { Collection, Db, MongoClient, ServerApiVersion } from "mongodb";
import { config } from "../config/config";
import { LoggerService } from "./LoggerService";
import EventEmitter from "node:events";
import { Board } from "../models/Board";

type NullBeforeConnecting<T> = T | null;

export class DatabaseService extends EventEmitter {
  private static instance: DatabaseService;
  private logger = LoggerService.getInstance();

  private mongoClient: NullBeforeConnecting<MongoClient> = null;
  private db: NullBeforeConnecting<Db> = null;
  private boards: NullBeforeConnecting<Collection<Board>> = null;

  private uri: string;

  public static get(): DatabaseService {
    if (!this.instance) {
      this.instance = new DatabaseService(
        config.database.username!,
        config.database.password!
      );

      this.instance.connect().then(() => {
        this.instance.logger.info("Database has connected");
      });
    }
    return this.instance;
  }

  private constructor(username: string, password: string) {
    super();
    this.uri = config.database.uri(username, password);
  }

  public async connect(): Promise<void> {
    try {
      this.mongoClient = await new MongoClient(this.uri, {
        serverApi: ServerApiVersion.v1,
      }).connect();

      this.db = this.mongoClient.db("react-web-app");
      this.boards = this.db.collection(config.database.mode!);
      this.emit("connected");
    } catch (err) {
      this.logger.error("Failed to connect to database:", err as Error);
      this.emit("error", err);
    }
  }

  public async assertConnection(): Promise<boolean> {
    if (!this.mongoClient || !this.db || !this.boards) {
      throw new Error(
        "Database is not connected. Use `DatabaseService.connect()`"
      );
    }
    return true;
  }

  public async getBoard(): Promise<Board | null> {
    await this.assertConnection();
    return this.boards!.findOne({});
  }

  public async updateBoard(
    boardId: string,
    update: Partial<Board>
  ): Promise<void> {
    await this.assertConnection();
    await this.boards!.updateOne({ id: boardId }, { $set: update });
  }

  public async addItemToBoard(boardId: string, item: any): Promise<void> {
    await this.assertConnection();
    await this.boards!.updateOne(
      { id: boardId },
      { $push: { "items_page.items": item } }
    );
  }

  public async close(): Promise<void> {
    try {
      if (this.mongoClient) {
        await this.mongoClient.close();
        this.mongoClient = null;
        this.db = null;
        this.boards = null;
      }
    } catch (error) {
      throw new Error(`Failed to close database connection: ${error}`);
    }
  }
}
