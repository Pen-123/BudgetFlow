import { COOKIE_NAME } from "@shared/const";
import { getSessionCookieOptions } from "./_core/cookies";
import { systemRouter } from "./_core/systemRouter";
import { publicProcedure, protectedProcedure, router } from "./_core/trpc";
import { z } from "zod";
import * as db from "./db";
import { invokeLLM } from "./_core/llm";
import { notifyOwner } from "./_core/notification";

export const appRouter = router({
  system: systemRouter,
  auth: router({
    me: publicProcedure.query((opts) => opts.ctx.user),
    logout: publicProcedure.mutation(({ ctx }) => {
      const cookieOptions = getSessionCookieOptions(ctx.req);
      ctx.res.clearCookie(COOKIE_NAME, { ...cookieOptions, maxAge: -1 });
      return {
        success: true,
      } as const;
    }),
  }),

  // ==================== Receipts ====================
  receipts: router({
    upload: protectedProcedure
      .input(
        z.object({
          imageUrl: z.string(),
          imageKey: z.string(),
        })
      )
      .mutation(async ({ ctx, input }) => {
        const result = await db.createReceipt(ctx.user.id, {
          imageUrl: input.imageUrl,
          imageKey: input.imageKey,
          status: "pending",
        });
        return result;
      }),

    list: protectedProcedure.query(({ ctx }) =>
      db.getReceiptsByUserId(ctx.user.id, 50)
    ),

    getById: protectedProcedure
      .input(z.object({ id: z.number() }))
      .query(async ({ input }) => {
        const receipt = await db.getReceiptById(input.id);
        if (!receipt) throw new Error("Receipt not found");
        const items = await db.getReceiptItemsByReceiptId(input.id);
        return { ...receipt, items };
      }),

    processWithVision: protectedProcedure
      .input(
        z.object({
          receiptId: z.number(),
          imageUrl: z.string(),
        })
      )
      .mutation(async ({ ctx, input }) => {
        const response = await invokeLLM({
          messages: [
            {
              role: "system",
              content:
                "You are an expert at extracting receipt data. Extract merchant name, date, items with prices, and total. Return JSON only.",
            },
            {
              role: "user",
              content: [
                {
                  type: "text",
                  text: "Please extract all items, prices, merchant name, and date from this receipt image.",
                },
                {
                  type: "image_url",
                  image_url: {
                    url: input.imageUrl,
                  },
                },
              ],
            },
          ],
          response_format: {
            type: "json_schema",
            json_schema: {
              name: "receipt_data",
              strict: true,
              schema: {
                type: "object",
                properties: {
                  merchantName: { type: "string" },
                  receiptDate: { type: "string" },
                  items: {
                    type: "array",
                    items: {
                      type: "object",
                      properties: {
                        name: { type: "string" },
                        quantity: { type: "number" },
                        unitPrice: { type: "number" },
                        totalPrice: { type: "number" },
                        category: { type: "string" },
                      },
                      required: ["name", "totalPrice"],
                    },
                  },
                  totalAmount: { type: "number" },
                },
                required: ["merchantName", "items", "totalAmount"],
              },
            },
          },
        });

        const extractedData = JSON.parse(
          response.choices[0]?.message.content || "{}"
        );

        if (extractedData.items && extractedData.items.length > 0) {
          await db.createReceiptItems(
            input.receiptId,
            extractedData.items.map((item: any) => ({
              itemName: item.name,
              quantity: item.quantity || 1,
              unitPrice: String(item.unitPrice || item.totalPrice),
              totalPrice: String(item.totalPrice),
              category: item.category || "other",
            }))
          );
        }

        return { success: true, data: extractedData };
      }),
  }),

  // ==================== Transactions ====================
  transactions: router({
    list: protectedProcedure
      .input(
        z.object({
          limit: z.number().default(50),
          offset: z.number().default(0),
        })
      )
      .query(({ ctx, input }) =>
        db.getTransactionsByUserId(ctx.user.id, input.limit, input.offset)
      ),

    getByDateRange: protectedProcedure
      .input(
        z.object({
          startDate: z.date(),
          endDate: z.date(),
        })
      )
      .query(({ ctx, input }) =>
        db.getTransactionsByDateRange(
          ctx.user.id,
          input.startDate,
          input.endDate
        )
      ),

    getByCategory: protectedProcedure
      .input(z.object({ category: z.string() }))
      .query(({ ctx, input }) =>
        db.getTransactionsByCategory(ctx.user.id, input.category)
      ),
  }),

  // ==================== Savings Goals ====================
  goals: router({
    create: protectedProcedure
      .input(
        z.object({
          goalName: z.string(),
          description: z.string().optional(),
          targetAmount: z.string(),
          targetDate: z.date().optional(),
        })
      )
      .mutation(({ ctx, input }) =>
        db.createSavingsGoal(ctx.user.id, input)
      ),

    list: protectedProcedure.query(({ ctx }) =>
      db.getSavingsGoalsByUserId(ctx.user.id)
    ),

    updateProgress: protectedProcedure
      .input(
        z.object({
          goalId: z.number(),
          currentAmount: z.string(),
        })
      )
      .mutation(async ({ ctx, input }) => {
        await db.updateSavingsGoalProgress(
          input.goalId,
          input.currentAmount
        );
        const goals = await db.getSavingsGoalsByUserId(ctx.user.id);
        const goal = goals.find((g) => g.id === input.goalId);
        if (
          goal &&
          parseFloat(String(goal.currentAmount)) >=
            parseFloat(String(goal.targetAmount))
        ) {
          await notifyOwner({
            title: "Savings Goal Milestone",
            content: `User ${ctx.user.name} reached their goal: ${goal.goalName}`,
          });
        }
        return { success: true };
      }),
  }),

  // ==================== Budget Limits ====================
  budgets: router({
    create: protectedProcedure
      .input(
        z.object({
          category: z.string(),
          limitAmount: z.string(),
          period: z.enum(["weekly", "monthly", "yearly"]).default("monthly"),
        })
      )
      .mutation(({ ctx, input }) =>
        db.createBudgetLimit(ctx.user.id, input)
      ),

    list: protectedProcedure.query(({ ctx }) =>
      db.getBudgetLimitsByUserId(ctx.user.id)
    ),
  }),

  // ==================== User Preferences ====================
  preferences: router({
    get: protectedProcedure.query(({ ctx }) =>
      db.getUserPreferences(ctx.user.id)
    ),

    update: protectedProcedure
      .input(
        z.object({
          currency: z.string().optional(),
          notificationsEnabled: z.boolean().optional(),
          budgetAlertThreshold: z.string().optional(),
          theme: z.string().optional(),
        })
      )
      .mutation(({ ctx, input }) =>
        db.createOrUpdateUserPreferences(ctx.user.id, input)
      ),
  }),

  // ==================== Insights ====================
  insights: router({
    generateMonthly: protectedProcedure.mutation(async ({ ctx }) => {
      const now = new Date();
      const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
      const endOfMonth = new Date(
        now.getFullYear(),
        now.getMonth() + 1,
        0
      );

      const totalSpent = await db.getTotalSpentThisMonth(ctx.user.id);
      const categoryBreakdown = await db.getCategoryBreakdown(
        ctx.user.id,
        startOfMonth,
        endOfMonth
      );

      const spendingScore = Math.max(
        0,
        Math.min(100, 100 - Math.floor(totalSpent / 10))
      );

      const categoryText = categoryBreakdown
        .map((c) => `${c.category}: $${c.total}`)
        .join(", ");

      const summaryPrompt = `Generate a brief, friendly spending summary for someone who spent $${totalSpent} this month with these categories: ${categoryText}. Keep it under 100 words and be encouraging.`;

      const summaryResponse = await invokeLLM({
        messages: [
          {
            role: "system",
            content:
              "You are a friendly financial advisor. Generate short, actionable spending insights.",
          },
          {
            role: "user",
            content: summaryPrompt,
          },
        ],
      });

      const summary = summaryResponse.choices[0]?.message.content || "";

      await db.createOrUpdateSpendingInsight(ctx.user.id, {
        period: "monthly",
        periodStart: startOfMonth,
        periodEnd: endOfMonth,
        totalSpent: String(totalSpent),
        spendingScore,
        categoryBreakdown: Object.fromEntries(
          categoryBreakdown.map((c) => [c.category, c.total])
        ),
        summary,
      });

      return { totalSpent, spendingScore, summary };
    }),

    list: protectedProcedure.query(({ ctx }) =>
      db.getSpendingInsightsByUserId(ctx.user.id)
    ),
  }),

  // ==================== Alternatives ====================
  alternatives: router({
    list: protectedProcedure.query(({ ctx }) =>
      db.getAlternativeSuggestionsByUserId(ctx.user.id)
    ),

    generateForReceipt: protectedProcedure
      .input(z.object({ receiptId: z.number() }))
      .mutation(async ({ ctx, input }) => {
        const items = await db.getReceiptItemsByReceiptId(input.receiptId);

        for (const item of items) {
          const prompt = `Suggest a cheaper alternative to "${item.itemName}" that costs less than $${item.totalPrice}. Provide the alternative name and estimated price.`;

          const response = await invokeLLM({
            messages: [
              {
                role: "system",
                content:
                  "You are a shopping expert. Suggest practical, cheaper alternatives to products.",
              },
              {
                role: "user",
                content: prompt,
              },
            ],
          });

          const content = response.choices[0]?.message.content || "";
          const match = content.match(/\$(\d+\.?\d*)/);
          const alternativePrice = match
            ? match[1]
            : String(parseFloat(String(item.totalPrice)) * 0.8);

          await db.createAlternativeSuggestion(ctx.user.id, {
            originalItemId: item.id,
            originalItemName: item.itemName,
            originalPrice: String(item.totalPrice),
            alternativeItemName: content.split(":")[0] || "Similar item",
            alternativePrice,
            reason: content,
          });
        }

        return { success: true };
      }),
  }),

  // ==================== Export ====================
  export: router({
    getTransactionsForExport: protectedProcedure
      .input(
        z.object({
          startDate: z.date(),
          endDate: z.date(),
        })
      )
      .query(({ ctx, input }) =>
        db.getTransactionsByDateRange(
          ctx.user.id,
          input.startDate,
          input.endDate
        )
      ),
  }),
});

export type AppRouter = typeof appRouter;
