import { useEffect, useRef, useState } from "react";
import { useLocation } from "wouter";
import { useAdminAuth } from "@/contexts/AdminAuthContext";
import { AdminSidebar } from "@/components/AdminSidebar";
import { PageLoader } from "@/components/LoadingSpinner";
import { Menu, Bell } from "lucide-react";
import { Sheet, SheetContent } from "@/components/ui/sheet";
import { Button } from "@/components/ui/button";
import { useListOrders, getListOrdersQueryKey } from "@workspace/api-client-react";
import { useQueryClient } from "@tanstack/react-query";
import { motion, AnimatePresence } from "framer-motion";
import { cn } from "@/lib/utils";

type OrderNotification = {
  id: string;
  tableNumber: number;
  total: number;
  items: number;
  at: number;
};

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  const { session, loading } = useAdminAuth();
  const [, setLocation] = useLocation();
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [notifications, setNotifications] = useState<OrderNotification[]>([]);
  const [showNotifs, setShowNotifs] = useState(false);
  const knownOrderIds = useRef<Set<string>>(new Set());
  const initialized = useRef(false);
  const queryClient = useQueryClient();

  useEffect(() => {
    if (!session) return;
  }, [session, setLocation]);

  const { data: orders = [] } = useListOrders({}, {
    query: {
      enabled: !!session,
      refetchInterval: 8000,
      refetchIntervalInBackground: false,
    },
  });

  useEffect(() => {
    if (!session || orders.length === 0) return;

    if (!initialized.current) {
      orders.forEach((o) => knownOrderIds.current.add(o.id));
      initialized.current = true;
      return;
    }

    const newOrders = orders.filter((o) => !knownOrderIds.current.has(o.id) && o.status === "pending");
    if (newOrders.length > 0) {
      newOrders.forEach((o) => {
        knownOrderIds.current.add(o.id);
        const notif: OrderNotification = {
          id: o.id,
          tableNumber: o.tableNumber,
          total: o.totalAmount,
          items: (o.items as { quantity: number }[]).reduce((s, i) => s + i.quantity, 0),
          at: Date.now(),
        };
        setNotifications((prev) => [notif, ...prev].slice(0, 20));
        setShowNotifs(true);
      });

      try { void new Audio("/notification.mp3").play(); } catch { /* silent */ }
    }
  }, [orders, session]);

  useEffect(() => {
    if (!loading && !session) {
      setLocation("/admin/login");
    }
  }, [session, loading, setLocation]);

  if (loading) return <PageLoader />;
  if (!session) return null;

  const pendingCount = orders.filter((o) => o.status === "pending").length;
  const unreadNotifs = notifications.length;

  return (
    <div className="flex h-screen overflow-hidden bg-background">
      <div className="hidden md:flex flex-shrink-0">
        <AdminSidebar pendingCount={pendingCount} />
      </div>

      <Sheet open={sidebarOpen} onOpenChange={setSidebarOpen}>
        <SheetContent side="left" className="p-0 w-60">
          <AdminSidebar pendingCount={pendingCount} />
        </SheetContent>
      </Sheet>

      <div className="flex-1 flex flex-col overflow-hidden">
        <div className="border-b border-border px-4 py-3 flex items-center gap-3 bg-background/95 backdrop-blur-sm sticky top-0 z-20">
          <Button variant="ghost" size="icon" onClick={() => setSidebarOpen(true)} className="md:hidden" data-testid="button-menu-toggle">
            <Menu className="h-5 w-5" />
          </Button>
          <span className="font-bold text-foreground md:hidden">Admin Panel</span>

          <div className="ml-auto flex items-center gap-2">
            {pendingCount > 0 && (
              <motion.div
                initial={{ scale: 0.8, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                className="flex items-center gap-1.5 bg-yellow-50 border border-yellow-200 text-yellow-800 text-xs font-semibold px-3 py-1.5 rounded-full"
              >
                <span className="h-2 w-2 rounded-full bg-yellow-500 animate-pulse" />
                {pendingCount} pending
              </motion.div>
            )}

            <div className="relative">
              <Button
                variant="ghost"
                size="icon"
                className="relative"
                onClick={() => setShowNotifs((v) => !v)}
              >
                <Bell className="h-5 w-5" />
                {unreadNotifs > 0 && (
                  <span className="absolute -top-0.5 -right-0.5 h-4 w-4 bg-red-600 text-white text-[10px] font-bold rounded-full flex items-center justify-center">
                    {Math.min(unreadNotifs, 9)}
                  </span>
                )}
              </Button>

              <AnimatePresence>
                {showNotifs && (
                  <>
                    <motion.div
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      exit={{ opacity: 0 }}
                      className="fixed inset-0 z-30"
                      onClick={() => setShowNotifs(false)}
                    />
                    <motion.div
                      initial={{ opacity: 0, y: -8, scale: 0.95 }}
                      animate={{ opacity: 1, y: 0, scale: 1 }}
                      exit={{ opacity: 0, y: -8, scale: 0.95 }}
                      transition={{ duration: 0.15 }}
                      className="absolute right-0 top-full mt-2 w-80 bg-card border border-border rounded-xl shadow-xl z-40 overflow-hidden"
                    >
                      <div className="flex items-center justify-between px-4 py-3 border-b border-border">
                        <p className="font-semibold text-sm">Order Notifications</p>
                        {notifications.length > 0 && (
                          <button
                            className="text-xs text-muted-foreground hover:text-foreground"
                            onClick={() => { setNotifications([]); setShowNotifs(false); }}
                          >
                            Clear all
                          </button>
                        )}
                      </div>
                      <div className="max-h-80 overflow-y-auto">
                        {notifications.length === 0 ? (
                          <div className="px-4 py-8 text-center text-sm text-muted-foreground">
                            No new notifications
                          </div>
                        ) : (
                          notifications.map((n) => (
                            <div key={n.id} className="px-4 py-3 border-b border-border last:border-0 hover:bg-muted/30 transition-colors">
                              <div className="flex items-start justify-between gap-2">
                                <div>
                                  <p className="text-sm font-semibold">🛎️ New Order — Table {n.tableNumber}</p>
                                  <p className="text-xs text-muted-foreground mt-0.5">
                                    {n.items} item{n.items !== 1 ? "s" : ""} · ₹{n.total.toFixed(0)}
                                  </p>
                                </div>
                                <span className="text-[10px] text-muted-foreground flex-shrink-0">
                                  {new Date(n.at).toLocaleTimeString("en-IN", { hour: "2-digit", minute: "2-digit" })}
                                </span>
                              </div>
                            </div>
                          ))
                        )}
                      </div>
                    </motion.div>
                  </>
                )}
              </AnimatePresence>
            </div>
          </div>
        </div>

        <main className="flex-1 overflow-y-auto p-6">{children}</main>
      </div>
    </div>
  );
}
