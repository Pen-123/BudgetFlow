import {
  int,
  mysqlEnum,
  mysqlTable,
  text,
  timestamp,
  varchar,
  decimal,
  json,
  boolean,
} from "drizzle-orm/mysql-core";

/**
 * Core user table backing auth flow.
 * Extend this file with additional tables as your product grows.
 * Columns use camelCase to match both database fields and generated types.
 */
export const users = mysqlTable("users", {
  /**
   * Surrogate primary key. Auto-incremented numeric value managed by the database.
   * Use this for relations between tables.
   */
  id: int("id").autoincrement().primaryKey(),
  /** Manus OAuth identifier (openId) returned from the OAuth callback. Unique per user. */
  openId: varchar("openId", { length: 64 }).notNull().unique(),
  name: text("name"),
  email: varchar("email", { length: 320 }),
  loginMethod: varchar("loginMethod", { length: 64 }),
  role: mysqlEnum("role", ["user", "admin"]).default("user").notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
  lastSignedIn: timestamp("lastSignedIn").defaultNow().notNull(),
});

export type User = typeof users.$inferSelect;
export type InsertUser = typeof users.$inferInsert;

/**
 * Receipts table: stores uploaded receipt images and extracted data
 */
export const receipts = mysqlTable("receipts", {
  id: int("id").autoincrement().primaryKey(),
  userId: int("userId").notNull(),
  merchantName: varchar("merchantName", { length: 255 }),
  receiptDate: timestamp("receiptDate"),
  totalAmount: decimal("totalAmount", { precision: 10, scale: 2 }),
  imageUrl: text("imageUrl"),
  imageKey: varchar("imageKey", { length: 255 }),
  extractedData: json("extractedData"),
  status: mysqlEnum("status", ["pending", "processed", "failed"]).default("pending"),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});

export type Receipt = typeof receipts.$inferSelect;
export type InsertReceipt = typeof receipts.$inferInsert;

/**
 * Receipt items: individual line items extracted from receipts
 */
export const receiptItems = mysqlTable("receiptItems", {
  id: int("id").autoincrement().primaryKey(),
  receiptId: int("receiptId").notNull(),
  itemName: varchar("itemName", { length: 255 }).notNull(),
  quantity: decimal("quantity", { precision: 10, scale: 2 }).default(1),
  unitPrice: decimal("unitPrice", { precision: 10, scale: 2 }),
  totalPrice: decimal("totalPrice", { precision: 10, scale: 2 }).notNull(),
  category: varchar("category", { length: 100 }),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
});

export type ReceiptItem = typeof receiptItems.$inferSelect;
export type InsertReceiptItem = typeof receiptItems.$inferInsert;

/**
 * Transactions: user spending transactions
 */
export const transactions = mysqlTable("transactions", {
  id: int("id").autoincrement().primaryKey(),
  userId: int("userId").notNull(),
  receiptId: int("receiptId"),
  description: varchar("description", { length: 255 }).notNull(),
  amount: decimal("amount", { precision: 10, scale: 2 }).notNull(),
  category: varchar("category", { length: 100 }).notNull(),
  merchantName: varchar("merchantName", { length: 255 }),
  transactionDate: timestamp("transactionDate").notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});

export type Transaction = typeof transactions.$inferSelect;
export type InsertTransaction = typeof transactions.$inferInsert;

/**
 * Savings goals: user's financial goals
 */
export const savingsGoals = mysqlTable("savingsGoals", {
  id: int("id").autoincrement().primaryKey(),
  userId: int("userId").notNull(),
  goalName: varchar("goalName", { length: 255 }).notNull(),
  description: text("description"),
  targetAmount: decimal("targetAmount", { precision: 12, scale: 2 }).notNull(),
  currentAmount: decimal("currentAmount", { precision: 12, scale: 2 }).default(0),
  targetDate: timestamp("targetDate"),
  status: mysqlEnum("status", ["active", "completed", "abandoned"]).default("active"),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});

export type SavingsGoal = typeof savingsGoals.$inferSelect;
export type InsertSavingsGoal = typeof savingsGoals.$inferInsert;

/**
 * Budget limits: user's budget constraints by category
 */
export const budgetLimits = mysqlTable("budgetLimits", {
  id: int("id").autoincrement().primaryKey(),
  userId: int("userId").notNull(),
  category: varchar("category", { length: 100 }).notNull(),
  limitAmount: decimal("limitAmount", { precision: 10, scale: 2 }).notNull(),
  period: mysqlEnum("period", ["weekly", "monthly", "yearly"]).default("monthly"),
  notificationSent: boolean("notificationSent").default(false),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});

export type BudgetLimit = typeof budgetLimits.$inferSelect;
export type InsertBudgetLimit = typeof budgetLimits.$inferInsert;

/**
 * User preferences: settings and preferences
 */
export const userPreferences = mysqlTable("userPreferences", {
  id: int("id").autoincrement().primaryKey(),
  userId: int("userId").notNull().unique(),
  currency: varchar("currency", { length: 3 }).default("USD"),
  notificationsEnabled: boolean("notificationsEnabled").default(true),
  budgetAlertThreshold: decimal("budgetAlertThreshold", { precision: 5, scale: 2 }).default(90),
  theme: varchar("theme", { length: 20 }).default("light"),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});

export type UserPreferences = typeof userPreferences.$inferSelect;
export type InsertUserPreferences = typeof userPreferences.$inferInsert;

/**
 * Alternative suggestions: AI-generated cheaper alternatives for items
 */
export const alternativeSuggestions = mysqlTable("alternativeSuggestions", {
  id: int("id").autoincrement().primaryKey(),
  userId: int("userId").notNull(),
  originalItemId: int("originalItemId").notNull(),
  originalItemName: varchar("originalItemName", { length: 255 }).notNull(),
  originalPrice: decimal("originalPrice", { precision: 10, scale: 2 }).notNull(),
  alternativeItemName: varchar("alternativeItemName", { length: 255 }).notNull(),
  alternativePrice: decimal("alternativePrice", { precision: 10, scale: 2 }).notNull(),
  savingsAmount: decimal("savingsAmount", { precision: 10, scale: 2 }),
  savingsPercentage: decimal("savingsPercentage", { precision: 5, scale: 2 }),
  reason: text("reason"),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
});

export type AlternativeSuggestion = typeof alternativeSuggestions.$inferSelect;
export type InsertAlternativeSuggestion = typeof alternativeSuggestions.$inferInsert;

/**
 * Spending insights: cached AI-generated insights
 */
export const spendingInsights = mysqlTable("spendingInsights", {
  id: int("id").autoincrement().primaryKey(),
  userId: int("userId").notNull(),
  period: varchar("period", { length: 20 }).notNull(),
  periodStart: timestamp("periodStart").notNull(),
  periodEnd: timestamp("periodEnd").notNull(),
  totalSpent: decimal("totalSpent", { precision: 12, scale: 2 }),
  spendingScore: int("spendingScore"),
  categoryBreakdown: json("categoryBreakdown"),
  summary: text("summary"),
  recommendations: json("recommendations"),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});

export type SpendingInsight = typeof spendingInsights.$inferSelect;
export type InsertSpendingInsight = typeof spendingInsights.$inferInsert;