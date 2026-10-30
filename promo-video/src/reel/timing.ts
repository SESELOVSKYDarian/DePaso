// Reel vertical: escenas y en qué cuadro arranca cada una (30 fps)
export const REEL_W = 1080;
export const REEL_H = 1920;

export const ESCENAS = {
  realista: { desde: 0, dura: 240 }, // HyperFrames: noche, lluvia, precios que no cierran
  logo: { desde: 240, dura: 75 },
  frase: { desde: 315, dura: 120 },
  celular: { desde: 435, dura: 150 },
  mapa: { desde: 585, dura: 135 },
  ahorro: { desde: 720, dura: 90 },
  tunel: { desde: 810, dura: 90 },
  cierre: { desde: 900, dura: 120 },
};

export const REEL_FRAMES = ESCENAS.cierre.desde + ESCENAS.cierre.dura;

// cortes que llevan un whoosh y golpes que llevan un click (los usa mux-reel.mjs)
export const WHOOSH = [240, 315, 435, 585, 720, 810, 900];
export const CLICK = [252, 470, 520, 640, 662, 684, 728, 740, 752, 770];
