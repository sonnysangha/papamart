import { create } from "zustand";
import { persist, createJSONStorage } from "zustand/middleware";
import type { Id } from "@/convex/_generated/dataModel";

export type CartItem = {
  productId: Id<"products">;
  quantity: number;
};

type CartState = {
  userId: string | null;
  items: CartItem[];
  hasMounted: boolean;
  addItem: (
    productId: Id<"products">,
    quantity?: number,
    maxStock?: number,
  ) => void;
  removeItem: (productId: Id<"products">) => void;
  setQuantity: (
    productId: Id<"products">,
    quantity: number,
    maxStock?: number,
  ) => void;
  clear: () => void;
  setUserId: (userId: string | null) => void;
  markMounted: () => void;
};

function clampQuantity(quantity: number, maxStock?: number): number {
  let next = Math.floor(quantity);
  if (!Number.isFinite(next) || next < 0) next = 0;
  if (typeof maxStock === "number" && maxStock >= 0 && next > maxStock) {
    next = maxStock;
  }
  return next;
}

export const useCartStore = create<CartState>()(
  persist(
    (set, get) => ({
      userId: null,
      items: [],
      hasMounted: false,

      addItem: (productId, quantity = 1, maxStock) => {
        const current = get().items;
        const existing = current.find((it) => it.productId === productId);
        const target = clampQuantity(
          (existing?.quantity ?? 0) + quantity,
          maxStock,
        );
        if (target <= 0) {
          set({ items: current.filter((it) => it.productId !== productId) });
          return;
        }
        if (existing) {
          set({
            items: current.map((it) =>
              it.productId === productId ? { ...it, quantity: target } : it,
            ),
          });
        } else {
          set({ items: [...current, { productId, quantity: target }] });
        }
      },

      removeItem: (productId) => {
        set({
          items: get().items.filter((it) => it.productId !== productId),
        });
      },

      setQuantity: (productId, quantity, maxStock) => {
        const next = clampQuantity(quantity, maxStock);
        if (next <= 0) {
          set({
            items: get().items.filter((it) => it.productId !== productId),
          });
          return;
        }
        const current = get().items;
        const existing = current.find((it) => it.productId === productId);
        if (existing) {
          set({
            items: current.map((it) =>
              it.productId === productId ? { ...it, quantity: next } : it,
            ),
          });
        } else {
          set({ items: [...current, { productId, quantity: next }] });
        }
      },

      clear: () => set({ items: [] }),

      setUserId: (userId) => set({ userId }),

      markMounted: () => set({ hasMounted: true }),
    }),
    {
      name: "papamart-cart",
      storage: createJSONStorage(() => localStorage),
      partialize: (state) => ({
        userId: state.userId,
        items: state.items,
      }),
    },
  ),
);

export const PENDING_SESSION_STORAGE_KEY = "papamart-pending-session";

const PENDING_SESSION_EVENT = "papamart-pending-session-changed";

export function setPendingCheckoutSession(sessionId: string | null): void {
  if (typeof window === "undefined") return;
  if (sessionId) {
    window.localStorage.setItem(PENDING_SESSION_STORAGE_KEY, sessionId);
  } else {
    window.localStorage.removeItem(PENDING_SESSION_STORAGE_KEY);
  }
  window.dispatchEvent(new Event(PENDING_SESSION_EVENT));
}

export function subscribePendingCheckoutSession(callback: () => void): () => void {
  if (typeof window === "undefined") return () => {};
  window.addEventListener(PENDING_SESSION_EVENT, callback);
  window.addEventListener("storage", callback);
  return () => {
    window.removeEventListener(PENDING_SESSION_EVENT, callback);
    window.removeEventListener("storage", callback);
  };
}

export function readPendingCheckoutSession(): string | null {
  if (typeof window === "undefined") return null;
  return window.localStorage.getItem(PENDING_SESSION_STORAGE_KEY);
}
