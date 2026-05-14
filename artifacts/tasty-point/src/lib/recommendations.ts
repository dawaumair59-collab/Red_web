import { MENU_ITEMS, MENU_MAP, type MenuItem } from "@/data/menuData";

type TimeSlot = "morning" | "lunch" | "snack" | "dinner";

const POPULAR_COMBOS: Record<string, string[]> = {
  m1:  ["m6", "m7", "m3", "m12"],
  m2:  ["m6", "m8", "m12", "m15"],
  m3:  ["m6", "m7", "m1"],
  m4:  ["m9", "m12", "m6"],
  m5:  ["m6", "m12", "m10", "m3"],
  m6:  ["m1", "m2", "m3", "m5"],
  m7:  ["m1", "m2", "m3"],
  m8:  ["m2", "m1", "m3"],
  m9:  ["m10", "m11", "m12"],
  m10: ["m9", "m12", "m6"],
  m11: ["m9", "m13", "m12"],
  m12: ["m1", "m2", "m15", "m16"],
  m13: ["m11", "m9", "m15"],
  m14: ["m15", "m16", "m9"],
  m15: ["m12", "m13", "m16"],
  m16: ["m12", "m13", "m15"],
};

const TIME_RECS: Record<TimeSlot, string[]> = {
  morning: ["m13", "m11", "m9",  "m15"],
  lunch:   ["m1",  "m2",  "m5",  "m6"],
  snack:   ["m9",  "m11", "m12", "m13"],
  dinner:  ["m5",  "m1",  "m10", "m2"],
};

function getTimeSlot(): TimeSlot {
  const h = new Date().getHours();
  if (h >= 6  && h < 11) return "morning";
  if (h >= 11 && h < 16) return "lunch";
  if (h >= 16 && h < 19) return "snack";
  return "dinner";
}

function scoreItems(
  cartIds: string[],
  coOccurrence: Map<string, Map<string, number>>,
  excludeIds: Set<string>
): Map<string, number> {
  const scores = new Map<string, number>();

  for (const cartId of cartIds) {
    const combos = POPULAR_COMBOS[cartId] ?? [];
    combos.forEach((id, idx) => {
      if (!excludeIds.has(id)) {
        scores.set(id, (scores.get(id) ?? 0) + (10 - idx * 2));
      }
    });

    const co = coOccurrence.get(cartId);
    if (co) {
      for (const [id, count] of co.entries()) {
        if (!excludeIds.has(id)) {
          scores.set(id, (scores.get(id) ?? 0) + count * 3);
        }
      }
    }
  }

  return scores;
}

function buildCoOccurrence(
  orders: Array<{ items: unknown }>
): Map<string, Map<string, number>> {
  const co = new Map<string, Map<string, number>>();
  for (const order of orders) {
    const items = (order.items as Array<{ menuItemId?: string; name?: string }>) ?? [];
    const ids = items
      .map((i) => {
        if (i.menuItemId) return i.menuItemId;
        const found = MENU_ITEMS.find((m) => m.name === i.name);
        return found?.id;
      })
      .filter(Boolean) as string[];

    for (let a = 0; a < ids.length; a++) {
      for (let b = 0; b < ids.length; b++) {
        if (a === b) continue;
        if (!co.has(ids[a])) co.set(ids[a], new Map());
        const inner = co.get(ids[a])!;
        inner.set(ids[b], (inner.get(ids[b]) ?? 0) + 1);
      }
    }
  }
  return co;
}

export function getRecommendations(
  cartItemIds: string[],
  orders: Array<{ items: unknown }> = [],
  limit = 4
): MenuItem[] {
  const excludeIds = new Set(cartItemIds);
  const coOccurrence = buildCoOccurrence(orders);

  if (cartItemIds.length > 0) {
    const scores = scoreItems(cartItemIds, coOccurrence, excludeIds);

    if (scores.size > 0) {
      return Array.from(scores.entries())
        .sort((a, b) => b[1] - a[1])
        .slice(0, limit)
        .map(([id]) => MENU_MAP[id])
        .filter(Boolean);
    }
  }

  const timeIds = TIME_RECS[getTimeSlot()];
  return timeIds
    .filter((id) => !excludeIds.has(id))
    .slice(0, limit)
    .map((id) => MENU_MAP[id])
    .filter(Boolean);
}

export function getItemRecommendations(itemId: string, limit = 4): MenuItem[] {
  const combos = POPULAR_COMBOS[itemId] ?? [];
  const seen = new Set([itemId]);
  const result: MenuItem[] = [];
  for (const id of combos) {
    if (!seen.has(id) && MENU_MAP[id]) {
      result.push(MENU_MAP[id]);
      seen.add(id);
    }
  }
  if (result.length < limit) {
    const item = MENU_MAP[itemId];
    if (item) {
      for (const m of MENU_ITEMS) {
        if (result.length >= limit) break;
        if (!seen.has(m.id) && m.categoryId === item.categoryId) {
          result.push(m);
          seen.add(m.id);
        }
      }
    }
  }
  return result.slice(0, limit);
}

export function getPopularItems(limit = 4): MenuItem[] {
  const timeIds = TIME_RECS[getTimeSlot()];
  return timeIds.slice(0, limit).map((id) => MENU_MAP[id]).filter(Boolean);
}

export function getTimeGreeting(): string {
  const slot = getTimeSlot();
  return { morning: "Good Morning", lunch: "Lunch Specials", snack: "Afternoon Treats", dinner: "Dinner Favourites" }[slot];
}
