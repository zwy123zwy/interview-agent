import "reflect-metadata";
import { DataSource } from "typeorm";
import { ConversationEntity } from "./entities/conversation.entity";
import { MessageEntity } from "./entities/message.entity";

const isProduction = process.env.NODE_ENV === "production";

export const AppDataSource = new DataSource({
  type: "mysql",
  host: process.env.DB_HOST || "localhost",
  port: parseInt(process.env.DB_PORT || "3306", 10),
  username: process.env.DB_USERNAME || "root",
  password: process.env.DB_PASSWORD || "123456",
  database: process.env.DB_DATABASE || "interview_product",
  synchronize: !isProduction,
  logging: !isProduction,
  entities: [ConversationEntity, MessageEntity],
  migrations: [],
  subscribers: [],
  charset: "utf8mb4",
});

let initialized = false;

let initializePromise: Promise<DataSource> | null = null;

export async function initializeDatabase() {
  if (initialized) {
    return AppDataSource;
  }

  if (initializePromise) {
    return initializePromise;
  }

  initializePromise = (async () => {
    try {
      await AppDataSource.initialize();
      initialized = true;
      console.log("✅ Database connected successfully");
      return AppDataSource;
    } catch (error) {
      console.error("❌ Database connection failed:", error);
      throw error;
    } finally {
      initializePromise = null;
    }
  })();

  return initializePromise;
}

export async function getDataSource() {
  if (!initialized) {
    return initializeDatabase();
  }
  return AppDataSource;
}
