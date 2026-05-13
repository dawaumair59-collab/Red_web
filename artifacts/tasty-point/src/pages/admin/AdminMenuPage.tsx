import { BookOpen } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { useGetAdminStats } from "@workspace/api-client-react";

const MENU_ITEMS = [
  { id: "m1", name: "Butter Chicken", category: "Mains", price: 320, isVeg: false, available: true },
  { id: "m2", name: "Paneer Tikka Masala", category: "Mains", price: 280, isVeg: true, available: true },
  { id: "m3", name: "Dal Makhani", category: "Mains", price: 220, isVeg: true, available: true },
  { id: "m4", name: "Grilled Fish Tikka", category: "Mains", price: 380, isVeg: false, available: true },
  { id: "m5", name: "Garlic Naan", category: "Breads", price: 60, isVeg: true, available: true },
  { id: "m6", name: "Tandoori Roti", category: "Breads", price: 40, isVeg: true, available: true },
  { id: "m7", name: "Onion Bhaji", category: "Starters", price: 150, isVeg: true, available: true },
  { id: "m8", name: "Seekh Kebab", category: "Starters", price: 240, isVeg: false, available: true },
  { id: "m9", name: "Mango Lassi", category: "Drinks", price: 120, isVeg: true, available: true },
  { id: "m10", name: "Masala Chai", category: "Drinks", price: 60, isVeg: true, available: true },
  { id: "m11", name: "Gulab Jamun", category: "Desserts", price: 100, isVeg: true, available: true },
  { id: "m12", name: "Kheer", category: "Desserts", price: 110, isVeg: true, available: true },
];

const CATEGORIES = [...new Set(MENU_ITEMS.map((i) => i.category))];

export default function AdminMenuPage() {
  const { data: stats } = useGetAdminStats();
  const popularNames = new Set((stats?.popularItems ?? []).map((i) => i.name));

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-foreground">Menu</h1>
        <p className="text-muted-foreground text-sm">{MENU_ITEMS.length} items across {CATEGORIES.length} categories</p>
      </div>

      {CATEGORIES.map((cat) => (
        <Card key={cat} className="shadow-sm">
          <CardHeader className="pb-3">
            <CardTitle className="text-base">{cat}</CardTitle>
            <CardDescription>{MENU_ITEMS.filter((i) => i.category === cat).length} items</CardDescription>
          </CardHeader>
          <CardContent className="p-0">
            <div className="divide-y divide-border">
              {MENU_ITEMS.filter((i) => i.category === cat).map((item) => (
                <div key={item.id} className="flex items-center gap-3 px-4 py-3">
                  <div
                    className={`w-3 h-3 rounded-full border-2 shrink-0 ${item.isVeg ? "border-green-600 bg-green-500" : "border-red-700 bg-red-600"}`}
                  />
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <p className="font-medium text-sm">{item.name}</p>
                      {popularNames.has(item.name) && (
                        <span className="text-[10px] font-bold uppercase tracking-wide bg-primary/10 text-primary px-1.5 py-0.5 rounded">
                          Popular
                        </span>
                      )}
                    </div>
                    <p className="text-xs text-muted-foreground">{item.isVeg ? "Veg" : "Non-veg"}</p>
                  </div>
                  <p className="font-semibold text-primary text-sm shrink-0">₹{item.price}</p>
                  <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${item.available ? "bg-green-100 text-green-700" : "bg-gray-100 text-gray-500"}`}>
                    {item.available ? "Available" : "Off"}
                  </span>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      ))}

      <Card className="border-dashed shadow-sm">
        <CardContent className="flex items-center gap-3 p-4">
          <BookOpen className="h-5 w-5 text-muted-foreground shrink-0" />
          <p className="text-sm text-muted-foreground">
            Menu items shown above are your restaurant's current catalogue. Popularity badges are sourced from real order data.
          </p>
        </CardContent>
      </Card>
    </div>
  );
}
