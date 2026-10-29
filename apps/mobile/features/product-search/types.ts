import { Ionicons } from "@expo/vector-icons";
import { useEffect, useRef, useState, type ComponentProps } from "react";

export type IconName = ComponentProps<typeof Ionicons>["name"];

/**
 * Caché de la sesión: volver a una caja ya abierta es instantáneo y al entrar a una categoría
 * se precargan sus tipos, así el toque siguiente ya tiene los productos.
 */
export type SearchKey = { q: string; type?: string | undefined; brandId?: string | undefined };
