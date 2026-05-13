import { ConnectionStatus } from "@/hooks/useRealtimeOrders";

interface Props {
  status: ConnectionStatus;
}

const labels: Record<ConnectionStatus, string> = {
  connected: "Live",
  disconnected: "Reconnecting...",
  connecting: "Connecting...",
  error: "Connection Error",
};

const colors: Record<ConnectionStatus, string> = {
  connected: "bg-green-500",
  disconnected: "bg-yellow-500",
  connecting: "bg-yellow-400",
  error: "bg-red-500",
};

export default function ConnectionBadge({ status }: Props) {
  return (
    <div className="flex items-center gap-1.5 text-xs font-mono text-muted-foreground">
      <span
        className={`inline-block w-2 h-2 rounded-full ${colors[status]} ${status === "connected" ? "animate-pulse" : ""}`}
      />
      <span>{labels[status]}</span>
    </div>
  );
}
