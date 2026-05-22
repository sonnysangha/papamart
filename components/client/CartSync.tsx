"use client";

import { useEffect, useSyncExternalStore } from "react";
import { useAuth } from "@clerk/nextjs";
import { useQuery } from "convex/react";
import { api } from "@/convex/_generated/api";
import {
  readPendingCheckoutSession,
  setPendingCheckoutSession,
  subscribePendingCheckoutSession,
  useCartStore,
} from "@/lib/cart-store";

function usePendingSessionId(): string | null {
  return useSyncExternalStore(
    subscribePendingCheckoutSession,
    readPendingCheckoutSession,
    () => null,
  );
}

export default function CartSync() {
  const { isSignedIn, isLoaded, userId } = useAuth();
  const storeUserId = useCartStore((s) => s.userId);
  const clear = useCartStore((s) => s.clear);
  const setUserId = useCartStore((s) => s.setUserId);
  const markMounted = useCartStore((s) => s.markMounted);
  const hasMounted = useCartStore((s) => s.hasMounted);

  const pendingSessionId = usePendingSessionId();

  useEffect(() => {
    markMounted();
  }, [markMounted]);

  useEffect(() => {
    if (!hasMounted || !isLoaded) {
      return;
    }
    if (!isSignedIn) {
      if (storeUserId !== null) {
        clear();
        setUserId(null);
      }
      return;
    }
    if (userId && storeUserId !== userId) {
      clear();
      setUserId(userId);
    }
  }, [
    hasMounted,
    isLoaded,
    isSignedIn,
    userId,
    storeUserId,
    clear,
    setUserId,
  ]);

  const order = useQuery(
    api.orders.getBySessionId,
    pendingSessionId ? { sessionId: pendingSessionId } : "skip",
  );

  useEffect(() => {
    if (!hasMounted || !pendingSessionId) {
      return;
    }
    if (order && order.status === "paid") {
      clear();
      setPendingCheckoutSession(null);
    }
  }, [order, pendingSessionId, hasMounted, clear]);

  return null;
}
