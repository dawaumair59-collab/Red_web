import { Switch, Route, Router as WouterRouter } from "wouter";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import { CartProvider } from "@/contexts/CartContext";
import { AdminAuthProvider } from "@/contexts/AdminAuthContext";
import NotFound from "@/pages/not-found";
import LandingPage from "@/pages/LandingPage";
import MenuPage from "@/pages/MenuPage";
import OrderTrackingPage from "@/pages/OrderTrackingPage";
import OrderSuccessPage from "@/pages/OrderSuccessPage";
import AdminLoginPage from "@/pages/admin/AdminLoginPage";
import AdminLayout from "@/pages/admin/AdminLayout";
import AdminDashboard from "@/pages/admin/AdminDashboard";
import AdminOrdersPage from "@/pages/admin/AdminOrdersPage";
import AdminMenuPage from "@/pages/admin/AdminMenuPage";
import AdminTablesPage from "@/pages/admin/AdminTablesPage";

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      retry: 1,
      staleTime: 10_000,
    },
  },
});

function AdminRoutes() {
  return (
    <Switch>
      <Route path="/admin/login" component={AdminLoginPage} />
      <Route path="/admin/orders">
        <AdminLayout><AdminOrdersPage /></AdminLayout>
      </Route>
      <Route path="/admin/menu">
        <AdminLayout><AdminMenuPage /></AdminLayout>
      </Route>
      <Route path="/admin/tables">
        <AdminLayout><AdminTablesPage /></AdminLayout>
      </Route>
      <Route path="/admin">
        <AdminLayout><AdminDashboard /></AdminLayout>
      </Route>
    </Switch>
  );
}

function Router() {
  return (
    <Switch>
      <Route path="/" component={LandingPage} />
      <Route path="/menu" component={MenuPage} />
      <Route path="/order/:id/success" component={OrderSuccessPage} />
      <Route path="/order/:id" component={OrderTrackingPage} />
      <Route path="/admin/login" component={AdminLoginPage} />
      <Route path="/admin/orders">
        <AdminLayout><AdminOrdersPage /></AdminLayout>
      </Route>
      <Route path="/admin/menu">
        <AdminLayout><AdminMenuPage /></AdminLayout>
      </Route>
      <Route path="/admin/tables">
        <AdminLayout><AdminTablesPage /></AdminLayout>
      </Route>
      <Route path="/admin">
        <AdminLayout><AdminDashboard /></AdminLayout>
      </Route>
      <Route component={NotFound} />
    </Switch>
  );
}

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <TooltipProvider>
        <AdminAuthProvider>
          <CartProvider>
            <WouterRouter base={import.meta.env.BASE_URL.replace(/\/$/, "")}>
              <Router />
            </WouterRouter>
            <Toaster />
          </CartProvider>
        </AdminAuthProvider>
      </TooltipProvider>
    </QueryClientProvider>
  );
}

export default App;
