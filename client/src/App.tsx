import { Toaster } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import NotFound from "@/pages/NotFound";
import { Route, Switch } from "wouter";
import ErrorBoundary from "./components/ErrorBoundary";
import { ThemeProvider } from "./contexts/ThemeContext";
import { PasswordGateProvider, usePasswordGate } from "./contexts/PasswordGateContext";
import { CalculatorProvider } from "./contexts/CalculatorContext";
import PasswordGate from "./pages/PasswordGate";
import Calculator from "./pages/Calculator";
import Products from "./pages/Products";
import CostCalculator from "./pages/CostCalculator";
import ReturnDiffCalculator from "./pages/ReturnDiffCalculator";
import GoalCalculator from "./pages/GoalCalculator";
import CapacityCalculator from "./pages/CapacityCalculator";
import AverageReturnCalculator from "./pages/AverageReturnCalculator";
import DashboardLayout from "./components/DashboardLayout";

function AuthenticatedApp() {
  return (
    <DashboardLayout>
      <Switch>
        <Route path={"/"} component={Calculator} />
        <Route path={"/calculator"} component={Calculator} />
        <Route path={"/products"} component={Products} />
        <Route path={"/cost-calculator"} component={CostCalculator} />
        <Route path={"/return-diff-calculator"} component={ReturnDiffCalculator} />
        <Route path={"/goal-calculator"} component={GoalCalculator} />
        <Route path={"/capacity-calculator"} component={CapacityCalculator} />
        <Route path={"/average-return-calculator"} component={AverageReturnCalculator} />
        <Route path={"/404"} component={NotFound} />
        <Route component={NotFound} />
      </Switch>
    </DashboardLayout>
  );
}

function Router() {
  const { isUnlocked } = usePasswordGate();
  if (!isUnlocked) return <PasswordGate />;
  return <AuthenticatedApp />;
}

function App() {
  return (
    <ErrorBoundary>
      <ThemeProvider defaultTheme="dark">
        <PasswordGateProvider>
          <CalculatorProvider>
            <TooltipProvider>
              <Toaster />
              <Router />
            </TooltipProvider>
          </CalculatorProvider>
        </PasswordGateProvider>
      </ThemeProvider>
    </ErrorBoundary>
  );
}

export default App;
