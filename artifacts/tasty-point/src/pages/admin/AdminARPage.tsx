import { Suspense, lazy, useState } from "react";
import { Box, Sparkles, Info, CheckCircle2, Clock, AlertCircle } from "lucide-react";
import { MENU_ITEMS, CATEGORIES } from "@/data/menuData";
import { Food3DViewerSkeleton } from "@/components/Food3DViewer";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { cn } from "@/lib/utils";

const Food3DViewer = lazy(() =>
  import("@/components/Food3DViewer").then((m) => ({ default: m.Food3DViewer }))
);

type ModelStatus = "ready" | "pending" | "none";

const MODEL_STATUS: Record<string, ModelStatus> = {
  m1: "ready", m2: "ready", m5: "ready", m10: "ready",
};

function StatusBadge({ status }: { status: ModelStatus }) {
  if (status === "ready") return (
    <Badge className="text-[10px] bg-green-100 text-green-700 border-green-200 gap-1">
      <CheckCircle2 className="h-2.5 w-2.5" /> 3D Ready
    </Badge>
  );
  if (status === "pending") return (
    <Badge variant="outline" className="text-[10px] text-yellow-700 border-yellow-300 gap-1">
      <Clock className="h-2.5 w-2.5" /> Generating
    </Badge>
  );
  return (
    <Badge variant="outline" className="text-[10px] text-muted-foreground gap-1">
      <AlertCircle className="h-2.5 w-2.5" /> No Model
    </Badge>
  );
}

export default function AdminARPage() {
  const [selectedItem, setSelectedItem] = useState(MENU_ITEMS[0]);
  const [activeCategory, setActiveCategory] = useState("all");

  const filtered = activeCategory === "all" ? MENU_ITEMS : MENU_ITEMS.filter((i) => i.categoryId === activeCategory);

  return (
    <div className="space-y-6">
      <div className="flex items-start justify-between">
        <div>
          <h1 className="text-2xl font-bold text-foreground">3D & AR Previews</h1>
          <p className="text-muted-foreground text-sm">Manage interactive 3D models for menu items</p>
        </div>
        <Badge variant="outline" className="text-primary border-primary text-xs">
          <Sparkles className="h-3 w-3 mr-1" /> AI Generation Ready
        </Badge>
      </div>

      {/* API Key Notice */}
      <Card className="border-primary/20 bg-primary/5">
        <CardContent className="flex items-start gap-3 p-4">
          <Info className="h-5 w-5 text-primary flex-shrink-0 mt-0.5" />
          <div className="space-y-1">
            <p className="text-sm font-semibold text-foreground">AI Model Generation</p>
            <p className="text-xs text-muted-foreground">
              Automatically generate photorealistic 3D food models from your dish photos using Meshy AI or Tripo AI.
              Add your <code className="bg-background px-1 rounded">MESHY_API_KEY</code> or{" "}
              <code className="bg-background px-1 rounded">TRIPO_API_KEY</code> in environment secrets to enable one-click 3D generation.
            </p>
            <div className="flex flex-wrap gap-2 pt-1">
              <span className="text-[11px] bg-background border border-border rounded-full px-2 py-0.5 font-mono">MESHY_API_KEY</span>
              <span className="text-[11px] bg-background border border-border rounded-full px-2 py-0.5 font-mono">TRIPO_API_KEY</span>
            </div>
          </div>
        </CardContent>
      </Card>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Item list */}
        <div className="lg:col-span-2 space-y-4">
          {/* Category filter */}
          <div className="flex gap-2 flex-wrap">
            <button
              onClick={() => setActiveCategory("all")}
              className={cn(
                "px-3 py-1.5 rounded-full text-xs font-medium transition-colors",
                activeCategory === "all" ? "bg-primary text-white" : "bg-muted text-muted-foreground hover:text-foreground"
              )}
            >
              All
            </button>
            {CATEGORIES.map((cat) => (
              <button
                key={cat.id}
                onClick={() => setActiveCategory(cat.id)}
                className={cn(
                  "px-3 py-1.5 rounded-full text-xs font-medium transition-colors",
                  activeCategory === cat.id ? "bg-primary text-white" : "bg-muted text-muted-foreground hover:text-foreground"
                )}
              >
                {cat.name}
              </button>
            ))}
          </div>

          <div className="space-y-2">
            {filtered.map((item) => {
              const status = MODEL_STATUS[item.id] ?? "none";
              const isSelected = selectedItem.id === item.id;
              return (
                <button
                  key={item.id}
                  onClick={() => setSelectedItem(item)}
                  className={cn(
                    "w-full flex items-center gap-3 p-3 rounded-xl border text-left transition-all",
                    isSelected
                      ? "border-primary bg-primary/5"
                      : "border-border bg-card hover:border-primary/40"
                  )}
                >
                  <div className={cn(
                    "w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0 text-lg",
                    status === "ready" ? "bg-green-50" : "bg-muted"
                  )}>
                    <Box className={cn("h-5 w-5", status === "ready" ? "text-green-600" : "text-muted-foreground")} />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <p className="font-medium text-sm truncate">{item.name}</p>
                      <StatusBadge status={status} />
                    </div>
                    <p className="text-xs text-muted-foreground">₹{item.price} · {item.isVeg ? "Veg" : "Non-veg"}</p>
                  </div>
                  {isSelected && (
                    <div className="h-2 w-2 rounded-full bg-primary flex-shrink-0" />
                  )}
                </button>
              );
            })}
          </div>
        </div>

        {/* 3D Preview */}
        <div className="space-y-4">
          <Card className="shadow-sm sticky top-6">
            <CardHeader className="pb-3">
              <CardTitle className="text-base">{selectedItem.name}</CardTitle>
              <CardDescription className="flex items-center gap-2">
                ₹{selectedItem.price}
                <StatusBadge status={MODEL_STATUS[selectedItem.id] ?? "none"} />
              </CardDescription>
            </CardHeader>
            <CardContent className="p-0 pb-4 px-4 space-y-4">
              <div className="bg-gradient-to-br from-muted/40 to-muted/10 rounded-2xl overflow-hidden">
                <Suspense fallback={<Food3DViewerSkeleton height={240} />}>
                  <Food3DViewer
                    key={selectedItem.id}
                    itemId={selectedItem.id}
                    categoryId={selectedItem.categoryId}
                    height={240}
                    showPlate
                  />
                </Suspense>
              </div>

              <p className="text-xs text-center text-muted-foreground">Drag to rotate · Scroll to zoom</p>

              <div className="space-y-2">
                <div className="flex justify-between text-xs">
                  <span className="text-muted-foreground">Model Type</span>
                  <span className="font-medium">Procedural 3D</span>
                </div>
                <div className="flex justify-between text-xs">
                  <span className="text-muted-foreground">AR Support</span>
                  <span className="font-medium text-muted-foreground">Needs .glb model</span>
                </div>
                <div className="flex justify-between text-xs">
                  <span className="text-muted-foreground">Category</span>
                  <span className="font-medium capitalize">{selectedItem.categoryId}</span>
                </div>
              </div>

              <div className="bg-muted/50 rounded-xl p-3 space-y-1.5">
                <p className="text-xs font-semibold">To Enable Full AR:</p>
                <ol className="text-xs text-muted-foreground space-y-1 list-decimal list-inside">
                  <li>Add MESHY_API_KEY to secrets</li>
                  <li>Upload food photo above</li>
                  <li>Click "Generate 3D Model"</li>
                  <li>Download & link the .glb file</li>
                </ol>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
