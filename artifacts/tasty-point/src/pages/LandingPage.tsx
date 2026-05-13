import { useEffect } from "react";
import { useLocation, useSearch } from "wouter";
import { UtensilsCrossed, QrCode } from "lucide-react";

export default function LandingPage() {
  const [, setLocation] = useLocation();
  const search = useSearch();

  useEffect(() => {
    const params = new URLSearchParams(search);
    const tableId = params.get("tableId");
    if (tableId) {
      setLocation(`/menu?tableId=${tableId}`);
    }
  }, [search, setLocation]);

  return (
    <div className="min-h-screen bg-background flex flex-col">
      <header className="bg-primary px-6 py-4">
        <div className="flex items-center gap-2">
          <UtensilsCrossed className="h-6 w-6 text-white" />
          <span className="text-white font-bold text-xl">Tasty Point</span>
        </div>
      </header>

      <main className="flex-1 flex flex-col items-center justify-center px-6 text-center gap-8">
        <div className="space-y-4">
          <div className="mx-auto w-24 h-24 rounded-full bg-primary/10 flex items-center justify-center">
            <QrCode className="h-12 w-12 text-primary" />
          </div>
          <h1 className="text-3xl font-bold text-foreground">Welcome to Tasty Point</h1>
          <p className="text-muted-foreground text-lg max-w-sm mx-auto">
            Scan the QR code on your table to view our menu and place your order.
          </p>
        </div>

        <div className="bg-card border border-card-border rounded-2xl p-6 max-w-sm w-full shadow-sm space-y-4">
          <div className="flex items-center gap-3 text-left">
            <div className="w-8 h-8 rounded-full bg-primary text-white flex items-center justify-center text-sm font-bold flex-shrink-0">1</div>
            <p className="text-sm text-foreground">Scan the QR code on your table</p>
          </div>
          <div className="flex items-center gap-3 text-left">
            <div className="w-8 h-8 rounded-full bg-primary text-white flex items-center justify-center text-sm font-bold flex-shrink-0">2</div>
            <p className="text-sm text-foreground">Browse our menu and add items to cart</p>
          </div>
          <div className="flex items-center gap-3 text-left">
            <div className="w-8 h-8 rounded-full bg-primary text-white flex items-center justify-center text-sm font-bold flex-shrink-0">3</div>
            <p className="text-sm text-foreground">Place your order and pay securely</p>
          </div>
        </div>
      </main>

      <footer className="py-6 text-center text-xs text-muted-foreground">
        Tasty Point — Quick. Fresh. Delicious.
      </footer>
    </div>
  );
}
