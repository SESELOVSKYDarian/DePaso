/**
 * Estilos del mapa de la ruta (el HTML que se carga en el WebView o en el iframe): punto de
 * origen, destino con etiqueta y pines de comercios con el logo de la cadena.
 */
export function routeMapCss(routeColor: string): string {
  return `
  html, body { margin: 0; padding: 0; height: 100%; }
  #map { position: absolute; top: 0; bottom: 0; width: 100%; }
  /* origen: punto azul con aro blanco; paradas del medio: puntos chicos; destino: punto con etiqueta */
  .depaso-pin {
    width: 18px; height: 18px; border-radius: 999px; background: ${routeColor}; border: 3px solid #fff;
    box-shadow: 0 0 0 6px rgba(91,176,255,0.28), 0 1px 4px rgba(0,0,0,0.4);
  }
  .depaso-pin.mid { width: 10px; height: 10px; border-width: 2px; box-shadow: 0 1px 3px rgba(0,0,0,0.4); }
  .depaso-end { display: flex; flex-direction: column; align-items: center; gap: 3px; }
  .depaso-end .tag {
    max-width: 130px; padding: 4px 10px; border-radius: 10px; overflow: hidden; white-space: nowrap; text-overflow: ellipsis;
    font-family: sans-serif; font-size: 12px; font-weight: 700; background: #fff; color: #111; box-shadow: 0 2px 8px rgba(0,0,0,0.4);
  }
  .depaso-end .dot { width: 14px; height: 14px; border-radius: 999px; background: #fff; border: 4px solid ${routeColor}; }
  /* comercios: el logo de la cadena en un cuadrado blanco redondeado */
  .depaso-store { display: flex; flex-direction: column; align-items: center; cursor: pointer; }
  .depaso-store .bubble {
    width: 36px; height: 36px; border-radius: 10px; display: flex; align-items: center; justify-content: center; overflow: hidden;
    background: #FFFFFF; color: #111111; border: 2px solid #FFFFFF; box-shadow: 0 2px 8px rgba(0,0,0,0.45);
    transition: transform 160ms ease-out;
  }
  .depaso-store .bubble img { width: 100%; height: 100%; object-fit: contain; }
  .depaso-store .label {
    margin-top: 3px; max-width: 100px; padding: 1px 7px; border-radius: 999px; overflow: hidden; display: none;
    white-space: nowrap; text-overflow: ellipsis; font-family: sans-serif; font-size: 11px; font-weight: 700;
    background: rgba(255,255,255,0.95); color: #111111; box-shadow: 0 1px 3px rgba(0,0,0,0.3);
  }
  .depaso-store.selected .label, .depaso-store.buy .label { display: block; }
  .depaso-store.selected .bubble { transform: scale(1.25); border-color: ${routeColor}; }
  .depaso-store.selected { z-index: 5; }
  .depaso-store.buy .bubble { width: 42px; height: 42px; border-color: ${routeColor}; }
`;
}
