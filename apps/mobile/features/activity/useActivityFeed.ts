import type { CommunityFeedItem, CommunityFeedScope } from "@depaso/validation";
import { useFocusEffect } from "expo-router";
import { useCallback, useState } from "react";
import { communityClient } from "@/lib/apiClient";

type FeedState = { items: CommunityFeedItem[]; loaded: boolean; failed: boolean };
const EMPTY: FeedState = { items: [], loaded: false, failed: false };

/**
 * Los reportes de precios de la comunidad y los propios. Se vuelven a pedir cada vez que se
 * muestra la pestaña, y también al tirar hacia abajo.
 */
export function useActivityFeed() {
  const [tab, setTab] = useState<CommunityFeedScope>("community");
  const [feeds, setFeeds] = useState<Record<CommunityFeedScope, FeedState>>({ community: EMPTY, mine: EMPTY });
  const [refreshing, setRefreshing] = useState(false);

  const load = useCallback(async (scope: CommunityFeedScope) => {
    try {
      const { items } = await communityClient.feed(scope);
      setFeeds((current) => ({ ...current, [scope]: { items, loaded: true, failed: false } }));
    } catch {
      setFeeds((current) => ({ ...current, [scope]: { ...current[scope], loaded: true, failed: true } }));
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

  return { tab, setTab, feed: feeds[tab], refreshing, refresh };
}
