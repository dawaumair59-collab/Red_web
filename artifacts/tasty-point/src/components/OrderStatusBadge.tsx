import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";

const STATUS_CONFIG: Record<string, { label: string; className: string }> = {
  pending:   { label: "Pending",   className: "bg-yellow-100 text-yellow-800 border-yellow-200" },
  confirmed: { label: "Confirmed", className: "bg-blue-100 text-blue-800 border-blue-200" },
  preparing: { label: "Preparing", className: "bg-orange-100 text-orange-800 border-orange-200" },
  ready:     { label: "Ready",     className: "bg-green-100 text-green-800 border-green-200" },
  delivered: { label: "Delivered", className: "bg-gray-100 text-gray-700 border-gray-200" },
  cancelled: { label: "Cancelled", className: "bg-red-100 text-red-700 border-red-200" },
};

const PAYMENT_CONFIG: Record<string, { label: string; className: string }> = {
  unpaid:   { label: "Unpaid",   className: "bg-red-100 text-red-700 border-red-200" },
  paid:     { label: "Paid",     className: "bg-green-100 text-green-800 border-green-200" },
  refunded: { label: "Refunded", className: "bg-gray-100 text-gray-700 border-gray-200" },
};

export function OrderStatusBadge({ status }: { status: string }) {
  const config = STATUS_CONFIG[status] ?? { label: status, className: "" };
  return (
    <Badge variant="outline" className={cn("font-medium text-xs", config.className)}>
      {config.label}
    </Badge>
  );
}

export function PaymentStatusBadge({ status }: { status?: string | null }) {
  const config = PAYMENT_CONFIG[status ?? ""] ?? { label: status ?? "", className: "" };
  return (
    <Badge variant="outline" className={cn("font-medium text-xs", config.className)}>
      {config.label}
    </Badge>
  );
}
