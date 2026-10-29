/**
 * Ajustes para que las listas largas (productos, precios, lugares) se muevan fluidas: se dibujan
 * pocas filas al principio, se arma un poco de más por tanda y se sacan de la memoria las que
 * quedaron lejos de la pantalla. Se pasa a cada `FlatList` con `{...LIST_PERFORMANCE}`.
 */
export const LIST_PERFORMANCE = {
  initialNumToRender: 10,
  maxToRenderPerBatch: 10,
  updateCellsBatchingPeriod: 50,
  windowSize: 7,
  removeClippedSubviews: true,
} as const;
