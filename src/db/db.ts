import { drizzle } from "drizzle-orm/mysql2";
import mysql from "mysql2/promise";
import { config, dataSources, vectorItems } from "@src/db/schema.ts";
import { Logger } from "@zilla/logger";
import process from "node:process";
import dotenv from "npm:dotenv";

dotenv.config();

const logger = new Logger("DB");

logger.info("DB_HOST", process.env.DB_HOST);
logger.info("DB_PORT", process.env.DB_PORT);
logger.info("DB_USER", process.env.DB_USER);
logger.info("DB_PASSWORD", process.env.DB_PASSWORD);
logger.info("DB_DATABASE", process.env.DB_DATABASE);

const poolConnection = mysql.createPool({
  host: process.env.DB_HOST,
  port: Number(process.env.DB_PORT),
  user: process.env.DB_USER,
  password: process.env.DB_PASSWORD,
  database: process.env.DB_DATABASE,
  waitForConnections: false, // 不等待连接，立即失败
  connectionLimit: 10,
  queueLimit: 0,
  connectTimeout: 1000, // 1秒连接超时
  acquireTimeout: 1000, // 1秒获取连接超时
  enableKeepAlive: true,
  keepAliveInitialDelay: 0,
});

const db = drizzle(poolConnection, {
  mode: "default",
  schema: {
    config: config,
    dataSources: dataSources,
    vectorItems
  },
});

export default db;
