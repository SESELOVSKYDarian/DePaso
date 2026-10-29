import type { ActivityItem, AnnouncementResponse } from "@depaso/validation";
import { useFocusEffect } from "expo-router";
import { useCallback, useState } from "react";
import { activityClient } from "@/lib/apiClient";

export type ActivityTab = "news" | "mine";

interface FeedState<T> {
  items: T[];
  loaded: boolean;
  failed: boolean;
}
const EMPTY = { items: [], loaded: false, failed: false };

/**
 * Lo que muestra Actividad: "Novedades" (lo que publica el equipo) y "Para vos" (avisos propios:
 * listas compartidas, precios que bajaron y ofertas cerca). Se vuelve a pedir cada vez que se
 * muestra la pestaña y al tirar hacia abajo.
 */
export function useActivityFeed() {
  const [tab, setTab] = useState<ActivityTab>("news");
  const [news, setNews] = useState<FeedState<AnnouncementResponse>>(EMPTY);
  const [mine, setMine] = useState<FeedState<ActivityItem>>(EMPTY);
  const [refreshing, setRefreshing] = useState(false);

  const load = useCallback(async (which: ActivityTab) => {
    try {
      if (which === "news") {
        const { announcements } = await activityClient.announcements();
        setNews({ items: announcements, loaded: true, failed: false });
      } else {
        const { items } = await activityClient.feed();
        setMine({ items, loaded: true, failed: false });
      }
    } catch {
      const keepFailed = <T,>(current: FeedState<T>): FeedState<T> => ({ ...current, loaded: true, failed: true });
      if (which === "news") setNews(keepFailed);
      else setMine(keepFailed);
    }
  }, []);

  useFocusEffect(
    useCallback(() => {
      void load(tab);
    }, [load, tab]),
  );

  const refresh = async () => {
    setRefreshing(true);
    await load(tab);
    setRefreshing(false);
  };

  return { tab, setTab, news, mine, refreshing, refresh };
}
