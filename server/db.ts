import { eq, desc, and, gte, lte, sql } from "drizzle-orm";
import { drizzle } from "drizzle-orm/mysql2";
import {
  InsertUser,
  users,
  receipts,
  receiptItems,
  transactions,
  savingsGoals,
  budgetLimits,
  userPreferences,
  alternativeSuggestions,
  spendingInsights,
  type Receipt,
  type Transaction,
  type SavingsGoal,
  type BudgetLimit,
  type UserPreferences,
} from "../drizzle/schema";
import { ENV } from "./_core/env";

let _db: ReturnType<typeof drizzle> | null = null;

// Lazily create the drizzle instance so local tooling can run without a DB.
export async function getDb() {
  if (!_db && process.env.DATABASE_URL) {
    try {
      _db = drizzle(process.env.DATABASE_URL);
    } catch (error) {
      console.warn("[Database] Failed to connect:", error);
      _db = null;
    }
  }
  return _db;
}

export async function upsertUser(user: InsertUser): Promise<void> {
  if (!user.openId) {
    throw new Error("User openId is required for upsert");
  }

  const db = await getDb();
  if (!db) {
    console.warn("[Database] Cannot upsert user: database not available");
    return;
  }

  try {
    const values: InsertUser = {
      openId: user.openId,
    };
    const updateSet: Record<string, unknown> = {};

    const textFields = ["name", "email", "loginMethod"] as const;
    type TextField = (typeof textFields)[number];

    const assignNullable = (field: TextField) => {
      const value = user[field];
      if (value === undefined) return;
      const normalized = value ?? null;
      values[field] = normalized;
      updateSet[field] = normalized;
    };

    textFields.forEach(assignNullable);

    if (user.lastSignedIn !== undefined) {
      values.lastSignedIn = user.lastSignedIn;
      updateSet.lastSignedIn = user.lastSignedIn;
    }
    if (user.role !== undefined) {
      values.role = user.role;
      updateSet.role = user.role;
    } else if (user.openId === ENV.ownerOpenId) {
      values.role = "admin";
      updateSet.role = "admin";
    }

    if (!values.lastSignedIn) {
      values.lastSignedIn = new Date();
    }

    if (Object.keys(updateSet).length === 0) {
      updateSet.lastSignedIn = new Date();
    }

    await db.insert(users).values(values).onDuplicateKeyUpdate({
      set: updateSet,
    });
  } catch (error) {
    console.error("[Database] Failed to upsert user:", error);
    throw error;
  }
}

export async function getUserByOpenId(openId: string) {
  const db = await getDb();
  if (!db) {
    console.warn("[Database] Cannot get user: database not available");
    return undefined;
  }

  const result = await db
    .select()
    .from(users)
    .where(eq(users.openId, openId))
    .limit(1);

  return result.length > 0 ? result[0] : undefined;
}

// ==================== Receipt Queries ====================

export async function createReceipt(
  userId: number,
  data: {
    merchantName?: string;
    receiptDate?: Date;
    totalAmount?: string;
    imageUrl?: string;
    imageKey?: string;
    extractedData?: any;
  }
) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");

  const result = await db.insert(receipts).values({
    userId,
    merchantName: data.merchantName,
    receiptDate: data.receiptDate,
    totalAmount: data.totalAmount as any,
    imageUrl: data.imageUrl,
    imageKey: data.imageKey,
    extractedData: data.extractedData,
    status: "processed",
  });

  return result;
}

export async function getReceiptsByUserId(userId: number, limit = 20) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");

  return db
    .select()
    .from(receipts)
    .where(eq(receipts.userId, userId))
    .orderBy(desc(receipts.createdAt))
    .limit(limit);
}

export async function getReceiptById(receiptId: number) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");

  const result = await db
    .select()
    .from(receipts)
    .where(eq(receipts.id, receiptId))
    .limit(1);

  return result.length > 0 ? result[0] : null;
}

// ==================== Receipt Items Queries ====================

export async function createReceiptItems(
  receiptId: number,
  items: Array<{
    itemName: string;
    quantity?: number;
    unitPrice?: string;
    totalPrice: string;
    category?: string;
  }>
) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");

  const itemsToInsert = items.map((item) => ({
    receiptId,
    itemName: item.itemName,
    quantity: item.quantity ? String(item.quantity) : "1",
    unitPrice: item.unitPrice as any,
    totalPrice: item.totalPrice as any,
    category: item.category,
  }));

  return db.insert(receiptItems).values(itemsToInsert);
}

export async function getReceiptItemsByReceiptId(receiptId: number) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");

  return db
    .select()
    .from(receiptItems)
    .where(eq(receiptItems.receiptId, receiptId));
}

// ==================== Transaction Queries ====================

export async function createTransaction(
  userId: number,
  data: {
    description: string;
    amount: string;
    category: string;
    merchantName?: string;
    transactionDate: Date;
    receiptId?: number;
  }
) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");

  return db.insert(transactions).values({
    userId,
    description: data.description,
    amount: data.amount as any,
    category: data.category,
    merchantName: data.merchantName,
    transactionDate: data.transactionDate,
    receiptId: data.receiptId,
  });
}

export async function getTransactionsByUserId(
  userId: number,
  limit = 50,
  offset = 0
) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");

  return db
    .select()
    .from(transactions)
    .where(eq(transactions.userId, userId))
    .orderBy(desc(transactions.transactionDate))
    .limit(limit)
    .offset(offset);
}

export async function getTransactionsByDateRange(
  userId: number,
  startDate: Date,
  endDate: Date
) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");

  return db
    .select()
    .from(transactions)
    .where(
      and(
        eq(transactions.userId, userId),
        gte(transactions.transactionDate, startDate),
        lte(transactions.transactionDate, endDate)
      )
    )
    .orderBy(desc(transactions.transactionDate));
}

export async function getTransactionsByCategory(
  userId: number,
  category: string
) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");

  return db
    .select()
    .from(transactions)
    .where(
      and(eq(transactions.userId, userId), eq(transactions.category, category))
    )
    .orderBy(desc(transactions.transactionDate));
}

// ==================== Savings Goals Queries ====================

export async function createSavingsGoal(
  userId: number,
  data: {
    goalName: string;
    description?: string;
    targetAmount: string;
    targetDate?: Date;
  }
) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");

  return db.insert(savingsGoals).values({
    userId,
    goalName: data.goalName,
    description: data.description,
    targetAmount: data.targetAmount as any,
    targetDate: data.targetDate,
    currentAmount: "0",
  });
}

export async function getSavingsGoalsByUserId(userId: number) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");

  return db
    .select()
    .from(savingsGoals)
    .where(eq(savingsGoals.userId, userId))
    .orderBy(desc(savingsGoals.createdAt));
}

export async function updateSavingsGoalProgress(
  goalId: number,
  currentAmount: string
) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");

  return db
    .update(savingsGoals)
    .set({ currentAmount: currentAmount as any })
    .where(eq(savingsGoals.id, goalId));
}

// ==================== Budget Limits Queries ====================

export async function createBudgetLimit(
  userId: number,
  data: {
    category: string;
    limitAmount: string;
    period?: "weekly" | "monthly" | "yearly";
  }
) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");

  return db.insert(budgetLimits).values({
    userId,
    category: data.category,
    limitAmount: data.limitAmount as any,
    period: data.period || "monthly",
  });
}

export async function getBudgetLimitsByUserId(userId: number) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");

  return db
    .select()
    .from(budgetLimits)
    .where(eq(budgetLimits.userId, userId));
}

// ==================== User Preferences Queries ====================

export async function createOrUpdateUserPreferences(
  userId: number,
  data: Partial<{
    currency: string;
    notificationsEnabled: boolean;
    budgetAlertThreshold: string;
    theme: string;
  }>
) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");

  const existing = await db
    .select()
    .from(userPreferences)
    .where(eq(userPreferences.userId, userId))
    .limit(1);

  if (existing.length > 0) {
    return db
      .update(userPreferences)
      .set(data)
      .where(eq(userPreferences.userId, userId));
  } else {
    return db.insert(userPreferences).values({
      userId,
      ...data,
    });
  }
}

export async function getUserPreferences(userId: number) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");

  const result = await db
    .select()
    .from(userPreferences)
    .where(eq(userPreferences.userId, userId))
    .limit(1);

  return result.length > 0 ? result[0] : null;
}

// ==================== Spending Insights Queries ====================

export async function createOrUpdateSpendingInsight(
  userId: number,
  data: {
    period: string;
    periodStart: Date;
    periodEnd: Date;
    totalSpent?: string;
    spendingScore?: number;
    categoryBreakdown?: any;
    summary?: string;
    recommendations?: any;
  }
) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");

  const existing = await db
    .select()
    .from(spendingInsights)
    .where(
      and(
        eq(spendingInsights.userId, userId),
        eq(spendingInsights.period, data.period)
      )
    )
    .limit(1);

  if (existing.length > 0) {
    return db
      .update(spendingInsights)
      .set(data)
      .where(eq(spendingInsights.id, existing[0].id));
  } else {
    return db.insert(spendingInsights).values({
      userId,
      ...data,
    });
  }
}

export async function getSpendingInsightsByUserId(userId: number) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");

  return db
    .select()
    .from(spendingInsights)
    .where(eq(spendingInsights.userId, userId))
    .orderBy(desc(spendingInsights.createdAt));
}

// ==================== Alternative Suggestions Queries ====================

export async function createAlternativeSuggestion(
  userId: number,
  data: {
    originalItemId: number;
    originalItemName: string;
    originalPrice: string;
    alternativeItemName: string;
    alternativePrice: string;
    reason?: string;
  }
) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");

  const savingsAmount = (
    parseFloat(data.originalPrice) - parseFloat(data.alternativePrice)
  ).toFixed(2);
  const savingsPercentage = (
    ((parseFloat(data.originalPrice) - parseFloat(data.alternativePrice)) /
      parseFloat(data.originalPrice)) *
    100
  ).toFixed(2);

  return db.insert(alternativeSuggestions).values({
    userId,
    originalItemId: data.originalItemId,
    originalItemName: data.originalItemName,
    originalPrice: data.originalPrice as any,
    alternativeItemName: data.alternativeItemName,
    alternativePrice: data.alternativePrice as any,
    savingsAmount: savingsAmount as any,
    savingsPercentage: savingsPercentage as any,
    reason: data.reason,
  });
}

export async function getAlternativeSuggestionsByUserId(userId: number) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");

  return db
    .select()
    .from(alternativeSuggestions)
    .where(eq(alternativeSuggestions.userId, userId))
    .orderBy(desc(alternativeSuggestions.createdAt));
}

// ==================== Analytics Queries ====================

export async function getTotalSpentThisMonth(userId: number) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");

  const now = new Date();
  const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
  const endOfMonth = new Date(now.getFullYear(), now.getMonth() + 1, 0);

  const result = await db
    .select({
      total: sql`SUM(${transactions.amount})`,
    })
    .from(transactions)
    .where(
      and(
        eq(transactions.userId, userId),
        gte(transactions.transactionDate, startOfMonth),
        lte(transactions.transactionDate, endOfMonth)
      )
    );

  return result[0]?.total ? parseFloat(String(result[0].total)) : 0;
}

export async function getCategoryBreakdown(userId: number, startDate: Date, endDate: Date) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");

  return db
    .select({
      category: transactions.category,
      total: sql`SUM(${transactions.amount})`,
      count: sql`COUNT(*)`,
    })
    .from(transactions)
    .where(
      and(
        eq(transactions.userId, userId),
        gte(transactions.transactionDate, startDate),
        lte(transactions.transactionDate, endDate)
      )
    )
    .groupBy(transactions.category);
}
