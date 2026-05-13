import { useEffect, useRef, useState, useCallback } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { getListOrdersQueryKey, getGetAdminStatsQueryKey, getGetOrderQueryKey } from "@workspace/api-client-react";
import { getSocket } from "@/lib/socket";
import type { SocketOrder } from "@/lib/socket";

export type ConnectionStatus = "connected" | "disconnected" | "connecting" | "error";

export function useRealtimeOrders(onNewPendingOrder?: () => void) {
  const queryClient = useQueryClient();
  const [status, setStatus] = useState<ConnectionStatus>("connecting");
  const pendingCountRef = useRef<number>(0);
  const socket = getSocket();

  const invalidateOrders = useCallback(() => {
    queryClient.invalidateQueries({ queryKey: getListOrdersQueryKey() });
    queryClient.invalidateQueries({ queryKey: getGetAdminStatsQueryKey() });
  }, [queryClient]);

  const handleOrderCreated = useCallback((order: SocketOrder) => {
    // Optimistic: inject into cache immediately
    queryClient.setQueryData<SocketOrder[]>(getListOrdersQueryKey(), (old) => {
      if (!old) return [order];
      if (old.some((o) => o.id === order.id)) return old;
      return [...old, order];
    });
    queryClient.invalidateQueries({ queryKey: getGetAdminStatsQueryKey() });

    if (order.status === "pending") {
      const newCount = pendingCountRef.current + 1;
      pendingCountRef.current = newCount;
      onNewPendingOrder?.();
    }
  }, [queryClient, onNewPendingOrder]);

  const handleOrderUpdated = useCallback((order: SocketOrder) => {
    // Optimistic: update in list cache
    queryClient.setQueryData<SocketOrder[]>(getListOrdersQueryKey(), (old) => {
      if (!old) return [order];
      return old.map((o) => (o.id === order.id ? order : o));
    });
    // Update individual order cache
    queryClient.setQueryData(getGetOrderQueryKey(order.id), order);
    queryClient.invalidateQueries({ queryKey: getGetAdminStatsQueryKey() });
  }, [queryClient]);

  useEffect(() => {
    socket.on("connect", () => setStatus("connected"));
    socket.on("disconnect", () => setStatus("disconnected"));
    socket.on("connect_error", () => setStatus("error"));
    socket.on("order:created", handleOrderCreated);
    socket.on("order:updated", handleOrderUpdated);

    if (socket.connected) setStatus("connected");

    return () => {
      socket.off("connect");
      socket.off("disconnect");
      socket.off("connect_error");
      socket.off("order:created", handleOrderCreated);
      socket.off("order:updated", handleOrderUpdated);
    };
  }, [socket, handleOrderCreated, handleOrderUpdated]);

  return { status, invalidateOrders };
}

export function useRealtimeOrder(orderId: string) {
  const queryClient = useQueryClient();
  const [status, setStatus] = useState<ConnectionStatus>("connecting");
  const socket = getSocket();

  useEffect(() => {
    const handleOrderUpdated = (order: SocketOrder) => {
      if (order.id === orderId) {
        queryClient.setQueryData(getGetOrderQueryKey(orderId), order);
      }
    };

    socket.on("connect", () => setStatus("connected"));
    socket.on("disconnect", () => setStatus("disconnected"));
    socket.on("connect_error", () => setStatus("error"));
    socket.on("order:updated", handleOrderUpdated);

    if (socket.connected) setStatus("connected");

    return () => {
      socket.off("connect");
      socket.off("disconnect");
      socket.off("connect_error");
      socket.off("order:updated", handleOrderUpdated);
    };
  }, [socket, orderId, queryClient]);

  return { status };
}
