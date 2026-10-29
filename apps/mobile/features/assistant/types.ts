import type { AssistantItem, AssistantResponse, ProductSearchResult } from "@depaso/validation";

export interface ReviewItem {
  item: AssistantItem;
  quantity: number;
  /** `null` = "me da igual la marca". */
  brandId: string | null;
  product: ProductSearchResult | null;
  loading: boolean;
  removed: boolean;
  /** Mostrando el buscador para elegir otro producto. */
  picking: boolean;
}

export type Mode = "voice" | "typing" | "review";

export type Phase = "idle" | "recording" | "transcribing" | "parsing";
