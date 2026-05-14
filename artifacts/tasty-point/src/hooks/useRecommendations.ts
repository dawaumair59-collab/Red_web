import { useMemo } from "react";
import { useListOrders } from "@workspace/api-client-react";
import { getRecommendations, getItemRecommendations } from "@/lib/recommendations";
import type { MenuItem } from "@/data/menuData";

export function useCartRecommendations(cartItemIds: string[]): { recommendations: MenuItem[]; isLoading: boolean } {
  const { data: orders = [], isLoading } = useListOrders({}, { query: { staleTime: 60_000 } });

  const recommendations = useMemo(
    () => getRecommendations(cartItemIds, orders as Array<{ items: unknown }>, 4),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [cartItemIds.join(","), orders]
  );

  return { recommendations, isLoading };
}

export function useItemRecommendations(itemId: string): MenuItem[] {
  return useMemo(() => getItemRecommendations(itemId, 4), [itemId]);
}
