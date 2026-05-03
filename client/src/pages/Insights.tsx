import { useEffect, useState } from "react";
import { trpc } from "@/lib/trpc";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Loader2, TrendingUp, BarChart3 } from "lucide-react";
import { BarChart, Bar, PieChart, Pie, Cell, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from "recharts";
import { Streamdown } from "streamdown";

export default function Insights() {
  const [isGenerating, setIsGenerating] = useState(false);
  const insightsQuery = trpc.insights.list.useQuery();
  const generateMutation = trpc.insights.generateMonthly.useMutation();
  const latestInsight = insightsQuery.data?.[0];

  const handleGenerate = async () => {
    setIsGenerating(true);
    try {
      await generateMutation.mutateAsync();
      await insightsQuery.refetch();
    } finally {
      setIsGenerating(false);
    }
  };

  const categoryData = latestInsight?.categoryBreakdown
    ? Object.entries(latestInsight.categoryBreakdown).map(([category, amount]) => ({
        name: category,
        value: typeof amount === "string" ? parseFloat(amount) : amount,
      }))
    : [];

  const COLORS = [
    "#3b82f6",
    "#10b981",
    "#f59e0b",
    "#ef4444",
    "#8b5cf6",
    "#ec4899",
  ];

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Spending Insights</h1>
          <p className="text-muted-foreground mt-2">
            AI-powered analysis of your spending patterns
          </p>
        </div>
        <Button onClick={handleGenerate} disabled={isGenerating} className="gap-2">
          {isGenerating ? (
            <>
              <Loader2 className="h-4 w-4 animate-spin" />
              Analyzing...
            </>
          ) : (
            <>
              <TrendingUp className="h-4 w-4" />
              Generate Insights
            </>
          )}
        </Button>
      </div>

      {latestInsight ? (
        <>
          {/* Key Metrics */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <Card className="border-0 shadow-sm">
              <CardHeader className="pb-3">
                <CardTitle className="text-sm font-medium text-muted-foreground">
                  Total Spent
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-3xl font-bold">
                  ${parseFloat(String(latestInsight.totalSpent || 0)).toFixed(2)}
                </div>
              </CardContent>
            </Card>

            <Card className="border-0 shadow-sm">
              <CardHeader className="pb-3">
                <CardTitle className="text-sm font-medium text-muted-foreground">
                  Spending Score
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-3xl font-bold">{latestInsight.spendingScore}/100</div>
                <p className="text-xs text-muted-foreground mt-2">
                  {latestInsight.spendingScore >= 80
                    ? "Excellent spending habits"
                    : latestInsight.spendingScore >= 60
                      ? "Good spending habits"
                      : "Room for improvement"}
                </p>
              </CardContent>
            </Card>

            <Card className="border-0 shadow-sm">
              <CardHeader className="pb-3">
                <CardTitle className="text-sm font-medium text-muted-foreground">
                  Period
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-3xl font-bold capitalize">{latestInsight.period}</div>
                <p className="text-xs text-muted-foreground mt-2">
                  {new Date(latestInsight.periodStart).toLocaleDateString()} -{" "}
                  {new Date(latestInsight.periodEnd).toLocaleDateString()}
                </p>
              </CardContent>
            </Card>
          </div>

          {/* Charts */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Category Breakdown */}
            {categoryData.length > 0 && (
              <Card className="border-0 shadow-sm">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <BarChart3 className="h-5 w-5" />
                    Category Breakdown
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <ResponsiveContainer width="100%" height={300}>
                    <PieChart>
                      <Pie
                        data={categoryData}
                        cx="50%"
                        cy="50%"
                        labelLine={false}
                        label={({ name, value }) => `${name}: $${value.toFixed(0)}`}
                        outerRadius={80}
                        fill="#8884d8"
                        dataKey="value"
                      >
                        {categoryData.map((entry, index) => (
                          <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                        ))}
                      </Pie>
                      <Tooltip formatter={(value) => `$${value.toFixed(2)}`} />
                    </PieChart>
                  </ResponsiveContainer>
                </CardContent>
              </Card>
            )}

            {/* Category List */}
            <Card className="border-0 shadow-sm">
              <CardHeader>
                <CardTitle>By Category</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {categoryData.map((item, index) => (
                    <div key={item.name} className="flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <div
                          className="h-3 w-3 rounded-full"
                          style={{ backgroundColor: COLORS[index % COLORS.length] }}
                        />
                        <span className="capitalize">{item.name}</span>
                      </div>
                      <span className="font-semibold">${item.value.toFixed(2)}</span>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </div>

          {/* AI Summary */}
          {latestInsight.summary && (
            <Card className="border-0 shadow-sm bg-gradient-to-br from-primary/5 to-primary/10">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <TrendingUp className="h-5 w-5" />
                  AI Summary
                </CardTitle>
                <CardDescription>
                  Personalized insights based on your spending
                </CardDescription>
              </CardHeader>
              <CardContent>
                <Streamdown>{latestInsight.summary}</Streamdown>
              </CardContent>
            </Card>
          )}
        </>
      ) : (
        <Card className="border-0 shadow-sm">
          <CardContent className="py-12 text-center">
            <TrendingUp className="h-12 w-12 mx-auto text-muted-foreground/50 mb-3" />
            <p className="text-muted-foreground mb-4">No insights generated yet</p>
            <Button onClick={handleGenerate} disabled={isGenerating}>
              {isGenerating ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  Generating...
                </>
              ) : (
                "Generate Your First Insight"
              )}
            </Button>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
