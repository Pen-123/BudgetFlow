import { useState } from "react";
import { trpc } from "@/lib/trpc";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Loader2, Download, FileText } from "lucide-react";
import { toast } from "sonner";

export default function Export() {
  const [startDate, setStartDate] = useState(
    new Date(new Date().getFullYear(), new Date().getMonth(), 1)
      .toISOString()
      .split("T")[0]
  );
  const [endDate, setEndDate] = useState(
    new Date().toISOString().split("T")[0]
  );
  const [isExporting, setIsExporting] = useState(false);

  const exportQuery = trpc.export.getTransactionsForExport.useQuery(
    {
      startDate: new Date(startDate),
      endDate: new Date(endDate),
    },
    { enabled: false }
  );

  const handleExportCSV = async () => {
    try {
      setIsExporting(true);
      const data = await exportQuery.refetch();
      const transactions = data.data || [];

      if (transactions.length === 0) {
        toast.error("No transactions found for the selected date range");
        return;
      }

      // Create CSV content
      const headers = [
        "Date",
        "Description",
        "Category",
        "Merchant",
        "Amount",
      ];
      const rows = transactions.map((tx) => [
        new Date(tx.transactionDate).toLocaleDateString(),
        tx.description,
        tx.category,
        tx.merchantName || "",
        parseFloat(String(tx.amount)).toFixed(2),
      ]);

      const csvContent = [
        headers.join(","),
        ...rows.map((row) =>
          row
            .map((cell) =>
              typeof cell === "string" && cell.includes(",")
                ? `"${cell}"`
                : cell
            )
            .join(",")
        ),
      ].join("\n");

      // Download CSV
      const blob = new Blob([csvContent], { type: "text/csv" });
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `budgetflow-transactions-${startDate}-to-${endDate}.csv`;
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      document.body.removeChild(a);

      toast.success("Transactions exported as CSV");
    } catch (error) {
      toast.error("Failed to export transactions");
      console.error(error);
    } finally {
      setIsExporting(false);
    }
  };

  const handleExportJSON = async () => {
    try {
      setIsExporting(true);
      const data = await exportQuery.refetch();
      const transactions = data.data || [];

      if (transactions.length === 0) {
        toast.error("No transactions found for the selected date range");
        return;
      }

      const jsonContent = JSON.stringify(
        {
          exportDate: new Date().toISOString(),
          dateRange: {
            start: startDate,
            end: endDate,
          },
          transactionCount: transactions.length,
          transactions: transactions.map((tx) => ({
            date: new Date(tx.transactionDate).toLocaleDateString(),
            description: tx.description,
            category: tx.category,
            merchant: tx.merchantName || null,
            amount: parseFloat(String(tx.amount)).toFixed(2),
          })),
        },
        null,
        2
      );

      const blob = new Blob([jsonContent], { type: "application/json" });
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `budgetflow-transactions-${startDate}-to-${endDate}.json`;
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      document.body.removeChild(a);

      toast.success("Transactions exported as JSON");
    } catch (error) {
      toast.error("Failed to export transactions");
      console.error(error);
    } finally {
      setIsExporting(false);
    }
  };

  return (
    <div className="max-w-2xl mx-auto space-y-8">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Export Data</h1>
        <p className="text-muted-foreground mt-2">
          Download your spending data in multiple formats
        </p>
      </div>

      {/* Date Range Selection */}
      <Card className="border-0 shadow-sm">
        <CardHeader>
          <CardTitle className="text-base">Select Date Range</CardTitle>
          <CardDescription>
            Choose the period for your export
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <Label htmlFor="startDate">Start Date</Label>
              <Input
                id="startDate"
                type="date"
                value={startDate}
                onChange={(e) => setStartDate(e.target.value)}
              />
            </div>
            <div>
              <Label htmlFor="endDate">End Date</Label>
              <Input
                id="endDate"
                type="date"
                value={endDate}
                onChange={(e) => setEndDate(e.target.value)}
              />
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Export Options */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* CSV Export */}
        <Card className="border-0 shadow-sm hover:shadow-md transition-shadow cursor-pointer">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <FileText className="h-5 w-5" />
              CSV Export
            </CardTitle>
            <CardDescription>
              Import to Excel, Google Sheets, or other spreadsheet apps
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Button
              onClick={handleExportCSV}
              disabled={isExporting}
              className="w-full gap-2"
            >
              {isExporting ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin" />
                  Exporting...
                </>
              ) : (
                <>
                  <Download className="h-4 w-4" />
                  Download CSV
                </>
              )}
            </Button>
          </CardContent>
        </Card>

        {/* JSON Export */}
        <Card className="border-0 shadow-sm hover:shadow-md transition-shadow cursor-pointer">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <FileText className="h-5 w-5" />
              JSON Export
            </CardTitle>
            <CardDescription>
              For developers and API integrations
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Button
              onClick={handleExportJSON}
              disabled={isExporting}
              className="w-full gap-2"
            >
              {isExporting ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin" />
                  Exporting...
                </>
              ) : (
                <>
                  <Download className="h-4 w-4" />
                  Download JSON
                </>
              )}
            </Button>
          </CardContent>
        </Card>
      </div>

      {/* Info */}
      <Card className="border-0 shadow-sm bg-muted/50">
        <CardHeader>
          <CardTitle className="text-base">Export Information</CardTitle>
        </CardHeader>
        <CardContent className="space-y-2 text-sm">
          <p>
            <strong>CSV Format:</strong> Best for spreadsheet applications like
            Excel and Google Sheets
          </p>
          <p>
            <strong>JSON Format:</strong> Structured data format suitable for
            developers and API integrations
          </p>
          <p>
            <strong>Included Data:</strong> Transaction date, description,
            category, merchant, and amount
          </p>
          <p className="text-xs text-muted-foreground mt-4">
            Your data is exported securely and only stored on your device.
          </p>
        </CardContent>
      </Card>

      {/* Integration Info */}
      <Card className="border-0 shadow-sm bg-blue-50 dark:bg-blue-950/20">
        <CardHeader>
          <CardTitle className="text-base">Integration Ready</CardTitle>
        </CardHeader>
        <CardContent className="space-y-2 text-sm">
          <p>
            Your exported data is formatted to work seamlessly with popular
            services:
          </p>
          <ul className="list-disc list-inside space-y-1 text-muted-foreground">
            <li>Google Sheets</li>
            <li>Microsoft Excel</li>
            <li>Notion</li>
            <li>Custom applications</li>
          </ul>
        </CardContent>
      </Card>
    </div>
  );
}
