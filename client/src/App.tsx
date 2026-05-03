import { Toaster } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { Route, Switch } from "wouter";
import ErrorBoundary from "./components/ErrorBoundary";
import { ThemeProvider } from "./contexts/ThemeContext";
import DashboardLayout from "./components/DashboardLayout";
import Dashboard from "./pages/Dashboard";
import ReceiptScanner from "./pages/ReceiptScanner";
import ReceiptDetails from "./pages/ReceiptDetails";
import Insights from "./pages/Insights";
import Alternatives from "./pages/Alternatives";
import Goals from "./pages/Goals";
import Transactions from "./pages/Transactions";
import Export from "./pages/Export";
import Settings from "./pages/Settings";
import NotFound from "./pages/NotFound";
import { useAuth } from "@/_core/hooks/useAuth";
import { getLoginUrl } from "@/const";
import { Button } from "@/components/ui/button";
import { CreditCard } from "lucide-react";

function ProtectedRoute({ component: Component }: { component: React.ComponentType }) {
  const { isAuthenticated, loading } = useAuth();

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
      </div>
    );
  }

  if (!isAuthenticated) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center gap-6">
        <div className="text-center">
          <CreditCard className="h-16 w-16 mx-auto mb-4 text-primary" />
          <h1 className="text-3xl font-bold mb-2">BudgetFlow</h1>
          <p className="text-muted-foreground mb-6">
            Your AI-powered personal finance companion
          </p>
          <a href={getLoginUrl()}>
            <Button size="lg">Sign In to Continue</Button>
          </a>
        </div>
      </div>
    );
  }

  return <Component />;
}

function Router() {
  return (
    <Switch>
      <Route path="/" component={() => <ProtectedRoute component={Dashboard} />} />
      <Route
        path="/scan"
        component={() => <ProtectedRoute component={ReceiptScanner} />}
      />
      <Route
        path="/receipt/:id"
        component={({ id }) => (
          <ProtectedRoute
            component={() => <ReceiptDetails receiptId={parseInt(id)} />}
          />
        )}
      />
      <Route
        path="/insights"
        component={() => <ProtectedRoute component={Insights} />}
      />
      <Route
        path="/alternatives"
        component={() => <ProtectedRoute component={Alternatives} />}
      />
      <Route
        path="/goals"
        component={() => <ProtectedRoute component={Goals} />}
      />
      <Route
        path="/transactions"
        component={() => <ProtectedRoute component={Transactions} />}
      />
      <Route
        path="/export"
        component={() => <ProtectedRoute component={Export} />}
      />
      <Route
        path="/settings"
        component={() => <ProtectedRoute component={Settings} />}
      />
      <Route path="/404" component={NotFound} />
      <Route component={NotFound} />
    </Switch>
  );
}

function App() {
  const { isAuthenticated } = useAuth();

  return (
    <ErrorBoundary>
      <ThemeProvider defaultTheme="light">
        <TooltipProvider>
          <Toaster />
          {isAuthenticated ? (
            <DashboardLayout>
              <Router />
            </DashboardLayout>
          ) : (
            <Router />
          )}
        </TooltipProvider>
      </ThemeProvider>
    </ErrorBoundary>
  );
}

export default App;
