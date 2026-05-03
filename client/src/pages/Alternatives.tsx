import { trpc } from "@/lib/trpc";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Loader2, TrendingDown } from "lucide-react";
import { Streamdown } from "streamdown";

export default function Alternatives() {
  const alternativesQuery = trpc.alternatives.list.useQuery();

  if (alternativesQuery.isLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  const alternatives = alternativesQuery.data || [];
  const totalSavings = alternatives.reduce(
    (sum, alt) => sum + parseFloat(String(alt.savingsAmount || 0)),
    0
  );

  return (
    <div className="space-y-8">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Better Alternatives</h1>
        <p className="text-muted-foreground mt-2">
          Discover cheaper options for items you regularly buy
        </p>
      </div>

      {/* Savings Summary */}
      {alternatives.length > 0 && (
        <Card className="border-0 shadow-sm bg-gradient-to-br from-green-50 to-emerald-50 dark:from-green-950/20 dark:to-emerald-950/20">
          <CardContent className="pt-6">
            <div className="flex items-center gap-4">
              <div className="flex-1">
                <p className="text-sm text-muted-foreground">Potential Savings</p>
                <p className="text-3xl font-bold text-green-600 dark:text-green-400">
                  ${totalSavings.toFixed(2)}
                </p>
              </div>
              <TrendingDown className="h-12 w-12 text-green-600/20" />
            </div>
          </CardContent>
        </Card>
      )}

      {/* Alternatives List */}
      {alternatives.length === 0 ? (
        <Card className="border-0 shadow-sm">
          <CardContent className="py-12 text-center">
            <TrendingDown className="h-12 w-12 mx-auto text-muted-foreground/50 mb-3" />
            <p className="text-muted-foreground">
              No alternatives found yet. Scan receipts to get suggestions!
            </p>
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-4">
          {alternatives.map((alt) => (
            <Card key={alt.id} className="border-0 shadow-sm hover:shadow-md transition-shadow">
              <CardContent className="pt-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  {/* Original Item */}
                  <div>
                    <p className="text-sm text-muted-foreground mb-2">Original Item</p>
                    <p className="font-semibold text-lg">{alt.originalItemName}</p>
                    <p className="text-2xl font-bold text-destructive mt-2">
                      ${parseFloat(String(alt.originalPrice)).toFixed(2)}
                    </p>
                  </div>

                  {/* Alternative Item */}
                  <div>
                    <p className="text-sm text-muted-foreground mb-2">Better Alternative</p>
                    <p className="font-semibold text-lg">{alt.alternativeItemName}</p>
                    <p className="text-2xl font-bold text-green-600 dark:text-green-400 mt-2">
                      ${parseFloat(String(alt.alternativePrice)).toFixed(2)}
                    </p>
                  </div>
                </div>

                {/* Savings Badge */}
                <div className="mt-4 flex items-center gap-3">
                  <Badge variant="secondary" className="text-base">
                    Save ${parseFloat(String(alt.savingsAmount || 0)).toFixed(2)}
                  </Badge>
                  <Badge variant="outline">
                    {parseFloat(String(alt.savingsPercentage || 0)).toFixed(0)}% off
                  </Badge>
                </div>

                {/* Reason */}
                {alt.reason && (
                  <div className="mt-4 pt-4 border-t border-border/50">
                    <p className="text-sm text-muted-foreground mb-2">Why This Alternative?</p>
                    <Streamdown className="text-sm">{alt.reason}</Streamdown>
                  </div>
                )}
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
