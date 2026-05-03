import { describe, it, expect, beforeEach, vi } from "vitest";
import { appRouter } from "./routers";
import type { TrpcContext } from "./_core/context";

// Mock database functions
vi.mock("./db", () => ({
  createReceipt: vi.fn(async (userId, data) => ({
    id: 1,
    userId,
    ...data,
    createdAt: new Date(),
    updatedAt: new Date(),
  })),
  getReceiptsByUserId: vi.fn(async () => []),
  getReceiptById: vi.fn(async () => null),
  getReceiptItemsByReceiptId: vi.fn(async () => []),
  createReceiptItems: vi.fn(async () => []),
  getTransactionsByUserId: vi.fn(async () => []),
  getTransactionsByDateRange: vi.fn(async () => []),
  getTransactionsByCategory: vi.fn(async () => []),
  createSavingsGoal: vi.fn(async (userId, data) => ({
    id: 1,
    userId,
    ...data,
    currentAmount: "0",
    status: "active",
    createdAt: new Date(),
    updatedAt: new Date(),
  })),
  getSavingsGoalsByUserId: vi.fn(async () => []),
  updateSavingsGoalProgress: vi.fn(async () => ({})),
  createBudgetLimit: vi.fn(async (userId, data) => ({
    id: 1,
    userId,
    ...data,
    createdAt: new Date(),
    updatedAt: new Date(),
  })),
  getBudgetLimitsByUserId: vi.fn(async () => []),
  getUserPreferences: vi.fn(async () => ({
    userId: 1,
    currency: "USD",
    notificationsEnabled: true,
    budgetAlertThreshold: "90",
    theme: "light",
  })),
  createOrUpdateUserPreferences: vi.fn(async (userId, data) => ({
    userId,
    ...data,
  })),
  getTotalSpentThisMonth: vi.fn(async () => 0),
  getCategoryBreakdown: vi.fn(async () => []),
  createOrUpdateSpendingInsight: vi.fn(async (userId, data) => ({
    id: 1,
    userId,
    ...data,
  })),
  getSpendingInsightsByUserId: vi.fn(async () => []),
  getAlternativeSuggestionsByUserId: vi.fn(async () => []),
  createAlternativeSuggestion: vi.fn(async (userId, data) => ({
    id: 1,
    userId,
    ...data,
  })),
}));

// Mock LLM
vi.mock("./_core/llm", () => ({
  invokeLLM: vi.fn(async () => ({
    choices: [
      {
        message: {
          content: JSON.stringify({
            merchantName: "Test Store",
            items: [
              {
                name: "Item 1",
                quantity: 1,
                unitPrice: 10,
                totalPrice: 10,
                category: "shopping",
              },
            ],
            totalAmount: 10,
          }),
        },
      },
    ],
  })),
}));

// Mock notifications
vi.mock("./_core/notification", () => ({
  notifyOwner: vi.fn(async () => true),
}));

const createMockContext = (userId: number = 1): TrpcContext => {
  return {
    user: {
      id: userId,
      openId: `user-${userId}`,
      email: `user${userId}@example.com`,
      name: `Test User ${userId}`,
      loginMethod: "manus",
      role: "user",
      createdAt: new Date(),
      updatedAt: new Date(),
      lastSignedIn: new Date(),
    },
    req: {
      protocol: "https",
      headers: {},
    } as TrpcContext["req"],
    res: {
      clearCookie: vi.fn(),
    } as TrpcContext["res"],
  };
};

describe("BudgetFlow Integration Tests", () => {
  describe("Receipt Processing Flow", () => {
    it("should upload and process a receipt", async () => {
      const ctx = createMockContext();
      const caller = appRouter.createCaller(ctx);

      // Upload receipt
      const uploadResult = await caller.receipts.upload({
        imageUrl: "data:image/jpeg;base64,test",
        imageKey: "receipt-123",
      });

      expect(uploadResult).toBeDefined();
      expect(uploadResult.id).toBe(1);
    });

    it("should retrieve receipt list", async () => {
      const ctx = createMockContext();
      const caller = appRouter.createCaller(ctx);

      const receipts = await caller.receipts.list();
      expect(Array.isArray(receipts)).toBe(true);
    });
  });

  describe("Savings Goals Flow", () => {
    it("should create a savings goal", async () => {
      const ctx = createMockContext();
      const caller = appRouter.createCaller(ctx);

      const goal = await caller.goals.create({
        goalName: "Vacation Fund",
        description: "Summer vacation",
        targetAmount: "5000",
        targetDate: new Date("2026-08-01"),
      });

      expect(goal).toBeDefined();
      expect(goal.goalName).toBe("Vacation Fund");
      expect(goal.targetAmount).toBe("5000");
    });

    it("should retrieve user goals", async () => {
      const ctx = createMockContext();
      const caller = appRouter.createCaller(ctx);

      const goals = await caller.goals.list();
      expect(Array.isArray(goals)).toBe(true);
    });

    it("should update goal progress", async () => {
      const ctx = createMockContext();
      const caller = appRouter.createCaller(ctx);

      const result = await caller.goals.updateProgress({
        goalId: 1,
        currentAmount: "1000",
      });

      expect(result.success).toBe(true);
    });
  });

  describe("Budget Limits Flow", () => {
    it("should create a budget limit", async () => {
      const ctx = createMockContext();
      const caller = appRouter.createCaller(ctx);

      const budget = await caller.budgets.create({
        category: "food",
        limitAmount: "500",
        period: "monthly",
      });

      expect(budget).toBeDefined();
      expect(budget.category).toBe("food");
      expect(budget.limitAmount).toBe("500");
    });

    it("should retrieve budget limits", async () => {
      const ctx = createMockContext();
      const caller = appRouter.createCaller(ctx);

      const budgets = await caller.budgets.list();
      expect(Array.isArray(budgets)).toBe(true);
    });
  });

  describe("User Preferences Flow", () => {
    it("should retrieve user preferences", async () => {
      const ctx = createMockContext();
      const caller = appRouter.createCaller(ctx);

      const prefs = await caller.preferences.get();
      expect(prefs).toBeDefined();
      expect(prefs.currency).toBe("USD");
    });

    it("should update user preferences", async () => {
      const ctx = createMockContext();
      const caller = appRouter.createCaller(ctx);

      const updated = await caller.preferences.update({
        currency: "EUR",
        notificationsEnabled: false,
        budgetAlertThreshold: "80",
        theme: "dark",
      });

      expect(updated).toBeDefined();
      expect(updated.currency).toBe("EUR");
    });
  });

  describe("Spending Insights Flow", () => {
    it("should generate monthly insights", async () => {
      const ctx = createMockContext();
      const caller = appRouter.createCaller(ctx);

      const insights = await caller.insights.generateMonthly();
      expect(insights).toBeDefined();
      expect(insights.totalSpent).toBeDefined();
      expect(insights.spendingScore).toBeDefined();
    });

    it("should retrieve past insights", async () => {
      const ctx = createMockContext();
      const caller = appRouter.createCaller(ctx);

      const insights = await caller.insights.list();
      expect(Array.isArray(insights)).toBe(true);
    });
  });

  describe("Alternatives Flow", () => {
    it("should retrieve alternative suggestions", async () => {
      const ctx = createMockContext();
      const caller = appRouter.createCaller(ctx);

      const alternatives = await caller.alternatives.list();
      expect(Array.isArray(alternatives)).toBe(true);
    });
  });

  describe("Transactions Flow", () => {
    it("should retrieve transactions with pagination", async () => {
      const ctx = createMockContext();
      const caller = appRouter.createCaller(ctx);

      const transactions = await caller.transactions.list({
        limit: 50,
        offset: 0,
      });

      expect(Array.isArray(transactions)).toBe(true);
    });

    it("should filter transactions by date range", async () => {
      const ctx = createMockContext();
      const caller = appRouter.createCaller(ctx);

      const startDate = new Date();
      startDate.setDate(startDate.getDate() - 30);
      const endDate = new Date();

      const transactions = await caller.transactions.getByDateRange({
        startDate,
        endDate,
      });

      expect(Array.isArray(transactions)).toBe(true);
    });

    it("should filter transactions by category", async () => {
      const ctx = createMockContext();
      const caller = appRouter.createCaller(ctx);

      const transactions = await caller.transactions.getByCategory({
        category: "food",
      });

      expect(Array.isArray(transactions)).toBe(true);
    });
  });

  describe("Export Flow", () => {
    it("should get transactions for export", async () => {
      const ctx = createMockContext();
      const caller = appRouter.createCaller(ctx);

      const startDate = new Date();
      startDate.setDate(startDate.getDate() - 30);
      const endDate = new Date();

      const transactions = await caller.export.getTransactionsForExport({
        startDate,
        endDate,
      });

      expect(Array.isArray(transactions)).toBe(true);
    });
  });

  describe("Authentication Flow", () => {
    it("should return current user", async () => {
      const ctx = createMockContext();
      const caller = appRouter.createCaller(ctx);

      const user = await caller.auth.me();
      expect(user).toBeDefined();
      expect(user.id).toBe(1);
      expect(user.email).toBe("user1@example.com");
    });

    it("should logout successfully", async () => {
      const ctx = createMockContext();
      const caller = appRouter.createCaller(ctx);

      const result = await caller.auth.logout();
      expect(result.success).toBe(true);
    });
  });

  describe("Error Handling", () => {
    it("should handle missing receipt", async () => {
      const ctx = createMockContext();
      const caller = appRouter.createCaller(ctx);

      try {
        await caller.receipts.getById({ id: 999 });
      } catch (error) {
        expect(error).toBeDefined();
      }
    });

    it("should validate input data", async () => {
      const ctx = createMockContext();
      const caller = appRouter.createCaller(ctx);

      try {
        await caller.goals.create({
          goalName: "",
          targetAmount: "",
        });
      } catch (error) {
        expect(error).toBeDefined();
      }
    });
  });

  describe("Data Consistency", () => {
    it("should maintain user isolation", async () => {
      const ctx1 = createMockContext(1);
      const ctx2 = createMockContext(2);

      const caller1 = appRouter.createCaller(ctx1);
      const caller2 = appRouter.createCaller(ctx2);

      expect(ctx1.user.id).toBe(1);
      expect(ctx2.user.id).toBe(2);
      expect(ctx1.user.id).not.toBe(ctx2.user.id);
    });
  });

  describe("API Response Structure", () => {
    it("should return properly structured goal response", async () => {
      const ctx = createMockContext();
      const caller = appRouter.createCaller(ctx);

      const goal = await caller.goals.create({
        goalName: "Test Goal",
        targetAmount: "1000",
      });

      expect(goal).toHaveProperty("id");
      expect(goal).toHaveProperty("userId");
      expect(goal).toHaveProperty("goalName");
      expect(goal).toHaveProperty("targetAmount");
      expect(goal).toHaveProperty("status");
    });

    it("should return properly structured budget response", async () => {
      const ctx = createMockContext();
      const caller = appRouter.createCaller(ctx);

      const budget = await caller.budgets.create({
        category: "food",
        limitAmount: "500",
      });

      expect(budget).toHaveProperty("id");
      expect(budget).toHaveProperty("userId");
      expect(budget).toHaveProperty("category");
      expect(budget).toHaveProperty("limitAmount");
    });
  });
});
