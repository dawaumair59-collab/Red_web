import { lazy, Suspense } from "react";
import { Switch, Route, Router as WouterRouter } from "wouter";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import { CartProvider } from "@/contexts/CartContext";
import { AdminAuthProvider } from "@/contexts/AdminAuthContext";
import { PageLoader } from "@/components/LoadingSpinner";

const LandingPage       = lazy(() => import("@/pages/LandingPage"));
const MenuPage          = lazy(() => import("@/pages/MenuPage"));
const OrderTrackingPage = lazy(() => import("@/pages/OrderTrackingPage"));
const OrderSuccessPage  = lazy(() => import("@/pages/OrderSuccessPage"));
const ARViewerPage      = lazy(() => import("@/pages/ARViewerPage"));
const NotFound          = lazy(() => import("@/pages/not-found"));

const AdminLoginPage  = lazy(() => import("@/pages/admin/AdminLoginPage"));
const AdminLayout     = lazy(() => import("@/pages/admin/AdminLayout"));
const AdminDashboard  = lazy(() => import("@/pages/admin/AdminDashboard"));
const AdminOrdersPage = lazy(() => import("@/pages/admin/AdminOrdersPage"));
const AdminMenuPage   = lazy(() => import("@/pages/admin/AdminMenuPage"));
const AdminTablesPage = lazy(() => import("@/pages/admin/AdminTablesPage"));
const AdminARPage     = lazy(() => import("@/pages/admin/AdminARPage"));

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      retry: 1,
      staleTime: 30_000,
      gcTime: 5 * 60_000,
      refetchOnWindowFocus: false,
    },
  },
});

function RouteLoader() {
  return <PageLoader />;
}

function Router() {
  return (
    <Suspense fallback={<RouteLoader />}>
      <Switch>
        <Route path="/" component={LandingPage} />
        <Route path="/menu" component={MenuPage} />
        <Route path="/ar/:id" component={ARViewerPage} />
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
        <Route path="/admin/ar">
          <AdminLayout><AdminARPage /></AdminLayout>
        </Route>
        <Route path="/admin">
          <AdminLayout><AdminDashboard /></AdminLayout>
        </Route>
        <Route component={NotFound} />
      </Switch>
    </Suspense>
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
