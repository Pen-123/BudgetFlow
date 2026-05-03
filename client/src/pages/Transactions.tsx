import { useState } from "react";
import { trpc } from "@/lib/trpc";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Loader2, Search } from "lucide-react";

const CATEGORIES = [
  "food",
  "transport",
  "shopping",
  "entertainment",
  "utilities",
  "health",
  "other",
];

export default function Transactions() {
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);
  const [limit, setLimit] = useState(50);

  const transactionsQuery = trpc.transactions.list.useQuery({ limit });

  const filteredTransactions = (transactionsQuery.data || []).filter((tx) => {
    const matchesSearch =
      tx.description.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (tx.merchantName?.toLowerCase().includes(searchTerm.toLowerCase()) ?? false);
    const matchesCategory = !selectedCategory || tx.category === selectedCategory;
    return matchesSearch && matchesCategory;
  });

  const totalAmount = filteredTransactions.reduce(
    (sum, tx) => sum + parseFloat(String(tx.amount || 0)),
    0
  );

  if (transactionsQuery.isLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="space-y-8">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Transaction History</h1>
        <p className="text-muted-foreground mt-2">
          View and manage all your spending transactions
        </p>
      </div>

      {/* Filters */}
      <Card className="border-0 shadow-sm">
        <CardHeader>
          <CardTitle className="text-base">Filters</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="text-sm font-medium mb-2 block">Search</label>
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Search by description or merchant..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10"
                />
              </div>
            </div>
            <div>
              <label className="text-sm font-medium mb-2 block">Category</label>
              <Select value={selectedCategory || ""} onValueChange={(v) => setSelectedCategory(v || null)}>
                <SelectTrigger>
                  <SelectValue placeholder="All categories" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="">All categories</SelectItem>
                  {CATEGORIES.map((cat) => (
                    <SelectItem key={cat} value={cat}>
                      {cat.charAt(0).toUpperCase() + cat.slice(1)}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Summary */}
      {filteredTransactions.length > 0 && (
        <Card className="border-0 shadow-sm bg-primary/5">
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Total Amount</p>
                <p className="text-3xl font-bold">${totalAmount.toFixed(2)}</p>
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Transactions</p>
                <p className="text-3xl font-bold">{filteredTransactions.length}</p>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Transactions List */}
      {filteredTransactions.length === 0 ? (
        <Card className="border-0 shadow-sm">
          <CardContent className="py-12 text-center">
            <p className="text-muted-foreground">
              {transactionsQuery.data?.length === 0
                ? "No transactions yet"
                : "No transactions match your filters"}
            </p>
          </CardContent>
        </Card>
      ) : (
        <Card className="border-0 shadow-sm">
          <CardContent className="p-0">
            <div className="divide-y divide-border/50">
              {filteredTransactions.map((tx) => (
                <div key={tx.id} className="p-4 hover:bg-muted/50 transition-colors">
                  <div className="flex items-center justify-between">
                    <div className="flex-1">
                      <p className="font-medium">{tx.description}</p>
                      <div className="flex items-center gap-2 mt-1">
                        <span className="text-xs px-2 py-1 rounded-full bg-muted">
                          {tx.category}
                        </span>
                        {tx.merchantName && (
                          <span className="text-xs text-muted-foreground">
                            {tx.merchantName}
                          </span>
                        )}
                        <span className="text-xs text-muted-foreground">
                          {new Date(tx.transactionDate).toLocaleDateString()}
                        </span>
                      </div>
                    </div>
                    <div className="text-right">
                      <p className="font-semibold">
                        ${parseFloat(String(tx.amount)).toFixed(2)}
                      </p>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Load More */}
      {transactionsQuery.data && transactionsQuery.data.length >= limit && (
        <div className="text-center">
          <Button
            variant="outline"
            onClick={() => setLimit((prev) => prev + 50)}
            disabled={transactionsQuery.isLoading}
          >
            {transactionsQuery.isLoading ? (
              <>
                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                Loading...
              </>
            ) : (
              "Load More"
            )}
          </Button>
        </div>
      )}
    </div>
  );
}
