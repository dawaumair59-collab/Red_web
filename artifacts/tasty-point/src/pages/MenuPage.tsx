import { useState } from "react";
import { useSearch, useLocation } from "wouter";
import { AlertCircle } from "lucide-react";
import { useListCategories, useListMenuItems } from "@workspace/api-client-react";
import { Navbar } from "@/components/Navbar";
import { CartDrawer } from "@/components/CartDrawer";
import { MenuItemCard } from "@/components/MenuItemCard";
import { PageLoader } from "@/components/LoadingSpinner";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { ScrollArea, ScrollBar } from "@/components/ui/scroll-area";

export default function MenuPage() {
  const search = useSearch();
  const [, setLocation] = useLocation();
  const params = new URLSearchParams(search);
  const tableId = params.get("tableId") ?? "";
  const [cartOpen, setCartOpen] = useState(false);
  const [activeCategory, setActiveCategory] = useState<string>("all");

  const { data: categories, isLoading: catsLoading } = useListCategories();
  const { data: allItems, isLoading: itemsLoading } = useListMenuItems({ available: true });

  if (!tableId) {
    setLocation("/");
    return null;
  }

  if (catsLoading || itemsLoading) return <PageLoader />;

  const filteredItems =
    activeCategory === "all"
      ? (allItems ?? [])
      : (allItems ?? []).filter((i) => i.categoryId === activeCategory);

  return (
    <div className="min-h-screen bg-background flex flex-col">
      <Navbar onCartClick={() => setCartOpen(true)} tableId={tableId} />

      <main className="flex-1 max-w-2xl mx-auto w-full">
        <div className="px-4 py-3">
          <h2 className="text-xl font-bold text-foreground">Our Menu</h2>
          <p className="text-sm text-muted-foreground">Table {tableId.slice(0, 8)}...</p>
        </div>

        <Tabs value={activeCategory} onValueChange={setActiveCategory}>
          <ScrollArea className="w-full">
            <TabsList className="flex w-max gap-1 px-4 pb-2 bg-transparent h-auto">
              <TabsTrigger value="all" className="rounded-full px-4 py-1.5 text-sm data-[state=active]:bg-primary data-[state=active]:text-white">
                All
              </TabsTrigger>
              {(categories ?? []).map((cat) => (
                <TabsTrigger
                  key={cat.id}
                  value={cat.id}
                  className="rounded-full px-4 py-1.5 text-sm data-[state=active]:bg-primary data-[state=active]:text-white"
                  data-testid={`tab-category-${cat.id}`}
                >
                  {cat.name}
                </TabsTrigger>
              ))}
            </TabsList>
            <ScrollBar orientation="horizontal" />
          </ScrollArea>

          <TabsContent value={activeCategory} className="mt-0 px-4 pb-24">
            {filteredItems.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-20 gap-3 text-center">
                <AlertCircle className="h-12 w-12 text-muted-foreground/40" />
                <p className="text-muted-foreground font-medium">No items in this category</p>
              </div>
            ) : (
              <div className="grid grid-cols-2 gap-3 mt-3">
                {filteredItems.map((item) => (
                  <MenuItemCard key={item.id} item={item} />
                ))}
              </div>
            )}
          </TabsContent>
        </Tabs>
      </main>

      <CartDrawer open={cartOpen} onClose={() => setCartOpen(false)} tableId={tableId} />
    </div>
  );
}
