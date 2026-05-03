import { useLocation } from "wouter";
import { trpc } from "@/lib/trpc";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { ArrowLeft, Loader2, AlertCircle } from "lucide-react";

export default function ReceiptDetails({ receiptId }: { receiptId: number }) {
  const [, setLocation] = useLocation();
  const receiptQuery = trpc.receipts.getById.useQuery({ id: receiptId });
  const alternativesMutation = trpc.alternatives.generateForReceipt.useMutation();

  if (receiptQuery.isLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  if (receiptQuery.isError || !receiptQuery.data) {
    return (
      <div className="max-w-2xl mx-auto space-y-6">
        <Button variant="ghost" onClick={() => setLocation("/")} className="gap-2">
          <ArrowLeft className="h-4 w-4" />
          Back
        </Button>
        <Card className="border-destructive/50">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-destructive">
              <AlertCircle className="h-5 w-5" />
              Receipt Not Found
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-muted-foreground">
              We couldn't find the receipt you're looking for.
            </p>
          </CardContent>
        </Card>
      </div>
    );
  }

  const receipt = receiptQuery.data;
  const items = receipt.items || [];
  const totalAmount = parseFloat(String(receipt.totalAmount || 0));

  return (
    <div className="max-w-3xl mx-auto space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <Button variant="ghost" onClick={() => setLocation("/")} className="gap-2">
          <ArrowLeft className="h-4 w-4" />
          Back to Dashboard
        </Button>
        <Button
          onClick={() => alternativesMutation.mutate({ receiptId })}
          disabled={alternativesMutation.isPending}
        >
          {alternativesMutation.isPending ? (
            <>
              <Loader2 className="h-4 w-4 mr-2 animate-spin" />
              Finding Alternatives...
            </>
          ) : (
            "Find Cheaper Alternatives"
          )}
        </Button>
      </div>

      {/* Receipt Header */}
      <Card className="border-0 shadow-sm">
        <CardHeader>
          <CardTitle>{receipt.merchantName || "Receipt"}</CardTitle>
          <CardDescription>
            {receipt.receiptDate
              ? new Date(receipt.receiptDate).toLocaleDateString("en-US", {
                  weekday: "long",
                  year: "numeric",
                  month: "long",
                  day: "numeric",
                })
              : new Date(receipt.createdAt).toLocaleDateString()}
          </CardDescription>
        </CardHeader>
      </Card>

      {/* Receipt Image */}
      {receipt.imageUrl && (
        <Card className="border-0 shadow-sm overflow-hidden">
          <CardContent className="p-0">
            <img
              src={receipt.imageUrl}
              alt="Receipt"
              className="w-full h-auto max-h-96 object-cover"
            />
          </CardContent>
        </Card>
      )}

      {/* Items */}
      <Card className="border-0 shadow-sm">
        <CardHeader>
          <CardTitle className="text-lg">Items</CardTitle>
          <CardDescription>Extracted from receipt</CardDescription>
        </CardHeader>
        <CardContent>
          {items.length === 0 ? (
            <p className="text-muted-foreground text-center py-6">
              No items found in this receipt
            </p>
          ) : (
            <div className="space-y-3">
              {items.map((item) => (
                <div
                  key={item.id}
                  className="flex items-center justify-between p-4 rounded-lg border border-border/50 hover:bg-muted/50 transition-colors"
                >
                  <div className="flex-1">
                    <p className="font-medium">{item.itemName}</p>
                    <p className="text-sm text-muted-foreground">
                      {item.category && (
                        <span className="inline-block px-2 py-1 rounded-full bg-muted text-xs mr-2">
                          {item.category}
                        </span>
                      )}
                      {item.quantity && item.quantity !== "1" && (
                        <span>Qty: {item.quantity}</span>
                      )}
                    </p>
                  </div>
                  <div className="text-right">
                    <p className="font-semibold">
                      ${parseFloat(String(item.totalPrice)).toFixed(2)}
                    </p>
                    {item.unitPrice && item.quantity && item.quantity !== "1" && (
                      <p className="text-xs text-muted-foreground">
                        ${parseFloat(String(item.unitPrice)).toFixed(2)} each
                      </p>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Total */}
      <Card className="border-0 shadow-sm bg-primary/5">
        <CardContent className="pt-6">
          <div className="flex items-center justify-between text-lg font-semibold">
            <span>Total Amount</span>
            <span className="text-2xl text-primary">${totalAmount.toFixed(2)}</span>
          </div>
        </CardContent>
      </Card>

      {/* Status */}
      <Card className="border-0 shadow-sm">
        <CardHeader>
          <CardTitle className="text-base">Status</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex items-center gap-2">
            <div
              className={`h-3 w-3 rounded-full ${
                receipt.status === "processed"
                  ? "bg-green-500"
                  : receipt.status === "pending"
                    ? "bg-yellow-500"
                    : "bg-red-500"
              }`}
            />
            <span className="capitalize font-medium">{receipt.status}</span>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
