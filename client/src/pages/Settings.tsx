import { useEffect, useState } from "react";
import { useLocation } from "wouter";
import { useAuth } from "@/_core/hooks/useAuth";
import { trpc } from "@/lib/trpc";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { Loader2, LogOut } from "lucide-react";
import { toast } from "sonner";

export default function Settings() {
  const { user, logout } = useAuth();
  const [, setLocation] = useLocation();
  const [formData, setFormData] = useState({
    currency: "USD",
    notificationsEnabled: true,
    budgetAlertThreshold: "90",
    theme: "light",
  });

  const preferencesQuery = trpc.preferences.get.useQuery();
  const updateMutation = trpc.preferences.update.useMutation();
  const logoutMutation = trpc.auth.logout.useMutation();

  useEffect(() => {
    if (preferencesQuery.data) {
      setFormData({
        currency: preferencesQuery.data.currency || "USD",
        notificationsEnabled: preferencesQuery.data.notificationsEnabled ?? true,
        budgetAlertThreshold: String(preferencesQuery.data.budgetAlertThreshold || 90),
        theme: preferencesQuery.data.theme || "light",
      });
    }
  }, [preferencesQuery.data]);

  const handleSave = async () => {
    try {
      await updateMutation.mutateAsync(formData);
      toast.success("Settings saved successfully");
    } catch (error) {
      toast.error("Failed to save settings");
    }
  };

  const handleLogout = async () => {
    try {
      await logoutMutation.mutateAsync();
      logout();
      setLocation("/");
    } catch (error) {
      toast.error("Failed to logout");
    }
  };

  return (
    <div className="max-w-2xl mx-auto space-y-8">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Settings</h1>
        <p className="text-muted-foreground mt-2">
          Manage your account and preferences
        </p>
      </div>

      {/* Profile Section */}
      <Card className="border-0 shadow-sm">
        <CardHeader>
          <CardTitle>Profile</CardTitle>
          <CardDescription>Your account information</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div>
            <Label htmlFor="name" className="text-muted-foreground">
              Name
            </Label>
            <div className="mt-2 p-3 bg-muted/50 rounded-lg">
              <p className="font-medium">{user?.name || "Not set"}</p>
            </div>
          </div>
          <div>
            <Label htmlFor="email" className="text-muted-foreground">
              Email
            </Label>
            <div className="mt-2 p-3 bg-muted/50 rounded-lg">
              <p className="font-medium">{user?.email || "Not set"}</p>
            </div>
          </div>
          <div>
            <Label htmlFor="joinDate" className="text-muted-foreground">
              Member Since
            </Label>
            <div className="mt-2 p-3 bg-muted/50 rounded-lg">
              <p className="font-medium">
                {user?.createdAt
                  ? new Date(user.createdAt).toLocaleDateString()
                  : "Unknown"}
              </p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Preferences Section */}
      <Card className="border-0 shadow-sm">
        <CardHeader>
          <CardTitle>Preferences</CardTitle>
          <CardDescription>Customize your BudgetFlow experience</CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          {/* Currency */}
          <div>
            <Label htmlFor="currency">Currency</Label>
            <Select
              value={formData.currency}
              onValueChange={(value) =>
                setFormData({ ...formData, currency: value })
              }
            >
              <SelectTrigger className="mt-2">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="USD">USD ($)</SelectItem>
                <SelectItem value="EUR">EUR (€)</SelectItem>
                <SelectItem value="GBP">GBP (£)</SelectItem>
                <SelectItem value="JPY">JPY (¥)</SelectItem>
                <SelectItem value="CAD">CAD (C$)</SelectItem>
                <SelectItem value="AUD">AUD (A$)</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {/* Theme */}
          <div>
            <Label htmlFor="theme">Theme</Label>
            <Select
              value={formData.theme}
              onValueChange={(value) =>
                setFormData({ ...formData, theme: value })
              }
            >
              <SelectTrigger className="mt-2">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="light">Light</SelectItem>
                <SelectItem value="dark">Dark</SelectItem>
                <SelectItem value="system">System</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {/* Budget Alert Threshold */}
          <div>
            <Label htmlFor="budgetAlertThreshold">
              Budget Alert Threshold (%)
            </Label>
            <Input
              id="budgetAlertThreshold"
              type="number"
              min="0"
              max="100"
              value={formData.budgetAlertThreshold}
              onChange={(e) =>
                setFormData({
                  ...formData,
                  budgetAlertThreshold: e.target.value,
                })
              }
              className="mt-2"
            />
            <p className="text-xs text-muted-foreground mt-2">
              Get notified when spending reaches this percentage of your budget
            </p>
          </div>

          {/* Notifications */}
          <div className="flex items-center justify-between">
            <div>
              <Label htmlFor="notifications">Enable Notifications</Label>
              <p className="text-sm text-muted-foreground mt-1">
                Receive alerts for budget limits and goal milestones
              </p>
            </div>
            <Switch
              id="notifications"
              checked={formData.notificationsEnabled}
              onCheckedChange={(checked) =>
                setFormData({ ...formData, notificationsEnabled: checked })
              }
            />
          </div>

          {/* Save Button */}
          <Button
            onClick={handleSave}
            disabled={updateMutation.isPending}
            className="w-full"
          >
            {updateMutation.isPending ? (
              <>
                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                Saving...
              </>
            ) : (
              "Save Preferences"
            )}
          </Button>
        </CardContent>
      </Card>

      {/* Account Section */}
      <Card className="border-0 shadow-sm border-destructive/20">
        <CardHeader>
          <CardTitle className="text-destructive">Account</CardTitle>
          <CardDescription>Manage your account</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <Button
            onClick={handleLogout}
            disabled={logoutMutation.isPending}
            variant="destructive"
            className="w-full gap-2"
          >
            {logoutMutation.isPending ? (
              <>
                <Loader2 className="h-4 w-4 animate-spin" />
                Logging out...
              </>
            ) : (
              <>
                <LogOut className="h-4 w-4" />
                Logout
              </>
            )}
          </Button>
        </CardContent>
      </Card>

      {/* Privacy Info */}
      <Card className="border-0 shadow-sm bg-muted/50">
        <CardHeader>
          <CardTitle className="text-base">Privacy & Security</CardTitle>
        </CardHeader>
        <CardContent className="space-y-2 text-sm">
          <p>
            Your financial data is encrypted and stored securely. We never share
            your information with third parties.
          </p>
          <p>
            All transactions and receipts are private to your account and only
            accessible to you.
          </p>
        </CardContent>
      </Card>
    </div>
  );
}
