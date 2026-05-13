import { Link, useLocation } from "wouter";
import { UtensilsCrossed, BarChart2, ClipboardList, BookOpen, Table2, LogOut } from "lucide-react";
import { cn } from "@/lib/utils";
import { useAdminAuth } from "@/contexts/AdminAuthContext";
import { Button } from "@/components/ui/button";

const NAV_ITEMS = [
  { href: "/admin", label: "Analytics", icon: BarChart2 },
  { href: "/admin/orders", label: "Orders", icon: ClipboardList },
  { href: "/admin/menu", label: "Menu", icon: BookOpen },
  { href: "/admin/tables", label: "Tables", icon: Table2 },
];

export function AdminSidebar() {
  const [location] = useLocation();
  const { signOut } = useAdminAuth();

  return (
    <aside className="w-60 bg-card border-r border-border flex flex-col h-full">
      <div className="px-5 py-5 border-b border-border">
        <div className="flex items-center gap-2">
          <UtensilsCrossed className="h-6 w-6 text-primary" />
          <div>
            <p className="font-bold text-foreground">Tasty Point</p>
            <p className="text-xs text-muted-foreground">Admin Panel</p>
          </div>
        </div>
      </div>

      <nav className="flex-1 px-3 py-4 space-y-1">
        {NAV_ITEMS.map(({ href, label, icon: Icon }) => {
          const isActive = location === href;
          return (
            <Link key={href} href={href}>
              <a
                className={cn(
                  "flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-colors",
                  isActive
                    ? "bg-primary text-white"
                    : "text-muted-foreground hover:bg-accent hover:text-foreground"
                )}
                data-testid={`link-admin-${label.toLowerCase()}`}
              >
                <Icon className="h-4 w-4" />
                {label}
              </a>
            </Link>
          );
        })}
      </nav>

      <div className="px-3 py-4 border-t border-border">
        <Button
          variant="ghost"
          className="w-full justify-start gap-3 text-muted-foreground hover:text-destructive"
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
