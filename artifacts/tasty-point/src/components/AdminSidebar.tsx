import { Link, useLocation } from "wouter";
import { UtensilsCrossed, BarChart2, ClipboardList, BookOpen, Table2, LogOut } from "lucide-react";
import { cn } from "@/lib/utils";
import { useAdminAuth } from "@/contexts/AdminAuthContext";
import { Button } from "@/components/ui/button";

const NAV_ITEMS = [
  { href: "/admin",        label: "Analytics", icon: BarChart2 },
  { href: "/admin/orders", label: "Orders",    icon: ClipboardList },
  { href: "/admin/menu",   label: "Menu",      icon: BookOpen },
  { href: "/admin/tables", label: "Tables",    icon: Table2 },
];

interface AdminSidebarProps {
  pendingCount?: number;
}

export function AdminSidebar({ pendingCount = 0 }: AdminSidebarProps) {
  const [location] = useLocation();
  const { signOut, session } = useAdminAuth();

  return (
    <aside className="w-60 bg-card border-r border-border flex flex-col h-full">
      <div className="px-5 py-5 border-b border-border">
        <div className="flex items-center gap-2.5">
          <div className="h-9 w-9 rounded-xl bg-red-600 flex items-center justify-center flex-shrink-0 shadow-sm">
            <UtensilsCrossed className="h-5 w-5 text-white" />
          </div>
          <div>
            <p className="font-bold text-foreground leading-tight">Tasty Point</p>
            <p className="text-xs text-muted-foreground">Admin Panel</p>
          </div>
        </div>
      </div>

      <nav className="flex-1 px-3 py-4 space-y-0.5">
        {NAV_ITEMS.map(({ href, label, icon: Icon }) => {
          const isActive = href === "/admin" ? location === "/admin" : location.startsWith(href);
          return (
            <Link key={href} href={href}>
              <a
                className={cn(
                  "flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-all duration-150",
                  isActive
                    ? "bg-red-600 text-white shadow-sm"
                    : "text-muted-foreground hover:bg-accent hover:text-foreground"
                )}
                data-testid={`link-admin-${label.toLowerCase().replace(/\s+/g, "-")}`}
              >
                <Icon className="h-4 w-4" />
                <span className="flex-1">{label}</span>
                {label === "Orders" && pendingCount > 0 && (
                  <span className={cn(
                    "h-5 min-w-[20px] px-1 text-[11px] font-bold rounded-full flex items-center justify-center",
                    isActive ? "bg-white text-red-600" : "bg-red-600 text-white"
                  )}>
                    {pendingCount}
                  </span>
                )}
              </a>
            </Link>
          );
        })}
      </nav>

      <div className="px-3 py-4 border-t border-border space-y-2">
        {session && (
          <div className="px-3 py-2">
            <p className="text-xs text-muted-foreground truncate">{session.email}</p>
          </div>
        )}
        <Button
          variant="ghost"
          className="w-full justify-start gap-3 text-muted-foreground hover:text-destructive hover:bg-destructive/10"
          onClick={signOut}
          data-testid="button-admin-signout"
        >
          <LogOut className="h-4 w-4" />
          Sign Out
        </Button>
      </div>
    </aside>
  );
}
