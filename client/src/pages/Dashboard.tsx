import { useAuth } from "@/_core/hooks/useAuth";
import { trpc } from "@/lib/trpc";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { useLocation } from "wouter";
import { CreditCard, TrendingUp, Target, ArrowRight } from "lucide-react";
import { useEffect, useState } from "react";

export default function Dashboard() {
  const { user } = useAuth();
  const [, setLocation] = useLocation();
  const [totalSpent, setTotalSpent] = useState<number>(0);

  const receiptsQuery = trpc.receipts.list.useQuery();
  const goalsQuery = trpc.goals.list.useQuery();
  const insightsQuery = trpc.insights.list.useQuery();

  // Calculate total spent this month
  useEffect(() => {
    if (receiptsQuery.data) {
      const now = new Date();
      const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
      const total = receiptsQuery.data.reduce((sum, receipt) => {
        if (receipt.totalAmount && receipt.createdAt >= startOfMonth) {
          return sum + parseFloat(String(receipt.totalAmount));
        }
        return sum;
      }, 0);
      setTotalSpent(total);
    }
  }, [receiptsQuery.data]);

  const activeGoals = goalsQuery.data?.filter((g) => g.status === "active") || [];
  const latestReceipts = receiptsQuery.data?.slice(0, 5) || [];
  const latestInsight = insightsQuery.data?.[0];

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Welcome back, {user?.name}</h1>
          <p className="text-muted-foreground mt-2">
            Here's your financial overview for this month
          </p>
        </div>
        <Button
          onClick={() => setLocation("/scan")}
          size="lg"
          className="gap-2"
        >
          <CreditCard className="h-5 w-5" />
          Scan Receipt
        </Button>
      </div>

      {/* Key Metrics */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <Card className="border-0 shadow-sm hover:shadow-md transition-shadow">
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Spent This Month
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold">${totalSpent.toFixed(2)}</div>
            <p className="text-xs text-muted-foreground mt-2">
              Based on {latestReceipts.length} receipts
            </p>
          </CardContent>
        </Card>

        <Card className="border-0 shadow-sm hover:shadow-md transition-shadow">
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Active Goals
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold">{activeGoals.length}</div>
            <p className="text-xs text-muted-foreground mt-2">
              Working towards your targets
            </p>
          </CardContent>
        </Card>

        <Card className="border-0 shadow-sm hover:shadow-md transition-shadow">
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Spending Score
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold">
              {latestInsight?.spendingScore || "—"}
            </div>
            <p className="text-xs text-muted-foreground mt-2">
              Out of 100 (higher is better)
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Recent Receipts */}
      <Card className="border-0 shadow-sm">
        <CardHeader>
          <CardTitle>Recent Receipts</CardTitle>
          <CardDescription>Your latest scanned receipts</CardDescription>
        </CardHeader>
        <CardContent>
          {latestReceipts.length === 0 ? (
            <div className="text-center py-8">
              <CreditCard className="h-12 w-12 mx-auto text-muted-foreground/50 mb-3" />
              <p className="text-muted-foreground">No receipts yet</p>
              <Button
                variant="outline"
                onClick={() => setLocation("/scan")}
                className="mt-4"
              >
                Scan your first receipt
              </Button>
            </div>
          ) : (
            <div className="space-y-3">
              {latestReceipts.map((receipt) => (
                <div
                  key={receipt.id}
                  className="flex items-center justify-between p-4 rounded-lg border border-border/50 hover:bg-muted/50 cursor-pointer transition-colors"
                  onClick={() => setLocation(`/receipt/${receipt.id}`)}
                >
                  <div className="flex-1">
                    <p className="font-medium">{receipt.merchantName || "Receipt"}</p>
                    <p className="text-sm text-muted-foreground">
                      {receipt.receiptDate
                        ? new Date(receipt.receiptDate).toLocaleDateString()
                        : new Date(receipt.createdAt).toLocaleDateString()}
                    </p>
                  </div>
                  <div className="text-right">
                    <p className="font-semibold">
                      ${parseFloat(String(receipt.totalAmount || 0)).toFixed(2)}
                    </p>
                    <p className="text-xs text-muted-foreground capitalize">
                      {receipt.status}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Savings Insights */}
      {latestInsight && (
        <Card className="border-0 shadow-sm bg-gradient-to-br from-primary/5 to-primary/10">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <TrendingUp className="h-5 w-5" />
              This Month's Insight
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-foreground/90 leading-relaxed">
              {latestInsight.summary}
            </p>
            <Button
              variant="outline"
              onClick={() => setLocation("/insights")}
              className="mt-4 gap-2"
            >
              View Full Analysis
              <ArrowRight className="h-4 w-4" />
            </Button>
          </CardContent>
        </Card>
      )}

      {/* Quick Actions */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <Card
          className="border-0 shadow-sm cursor-pointer hover:shadow-md transition-shadow"
          onClick={() => setLocation("/goals")}
        >
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-base">
              <Target className="h-5 w-5" />
              Savings Goals
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-muted-foreground">
              Track progress towards your financial targets
            </p>
          </CardContent>
        </Card>

        <Card
          className="border-0 shadow-sm cursor-pointer hover:shadow-md transition-shadow"
          onClick={() => setLocation("/alternatives")}
        >
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-base">
              <CreditCard className="h-5 w-5" />
              Save More
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-muted-foreground">
              Discover cheaper alternatives to your purchases
            </p>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
