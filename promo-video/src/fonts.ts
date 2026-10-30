import { continueRender, delayRender, staticFile } from "remotion";

// carga Fredoka y Montserrat antes de dibujar el primer cuadro
const handle = delayRender("fuentes");

const cargas = [
  new FontFace("Fredoka", `url(${staticFile("fonts/Fredoka.ttf")})`, { weight: "300 700" }),
  new FontFace("Montserrat", `url(${staticFile("fonts/Montserrat.ttf")})`, { weight: "400" }),
  new FontFace("Montserrat", `url(${staticFile("fonts/Montserrat-Bold.ttf")})`, { weight: "600 800" }),
].map((fuente) => fuente.load().then((f) => document.fonts.add(f)));

Promise.all(cargas).then(() => continueRender(handle));
