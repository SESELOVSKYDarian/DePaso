// Mezcla música, whoosh en cada corte y clicks en los golpes con el reel mudo
// (out/reel-silent.mp4) -> out/depaso-reel.mp4. Tiempos: src/reel/timing.ts
import { spawnSync } from "node:child_process";
import { readFileSync } from "node:fs";

const fuente = readFileSync("src/reel/timing.ts", "utf8");
const lista = (nombre) => JSON.parse(fuente.match(new RegExp(`export const ${nombre} = (\\[[^\\]]*\\])`))[1]);
const cierre = fuente.match(/cierre: \{ desde: (\d+), dura: (\d+) \}/);
const FPS = 30;
const total = (Number(cierre[1]) + Number(cierre[2])) / FPS;

const ffmpeg = "node_modules/@remotion/compositor-win32-x64-msvc/ffmpeg.exe";
const args = ["-y", "-i", "out/reel-silent.mp4", "-ss", "8", "-t", String(total), "-i", "public/audio/cipher.oga"];
// la música entra suave, baja un poco en la escena realista y sube cuando aparece DePaso
const filtros = [`[1:a]volume='0.9*min(1,t/1.2)*min(1,(${total}-t)/3)*if(lt(t,8),0.55,1)':eval=frame[musica]`];
const mezcla = ["[musica]"];

const sumar = (archivo, cuadros, volumen) => {
  for (const cuadro of cuadros) {
    const idx = args.filter((a) => a === "-i").length;
    const ms = Math.round((cuadro / FPS) * 1000);
    args.push("-i", archivo);
    filtros.push(`[${idx}:a]adelay=${ms}|${ms},volume=${volumen}[s${idx}]`);
    mezcla.push(`[s${idx}]`);
  }
};
sumar("public/audio/whoosh.mp3", lista("WHOOSH"), 0.5);
sumar("public/audio/click-soft.mp3", lista("CLICK"), 0.6);
filtros.push(`${mezcla.join("")}amix=inputs=${mezcla.length}:normalize=0:duration=first[audio]`);

args.push(
  "-filter_complex", filtros.join(";"),
  "-map", "0:v", "-map", "[audio]",
  "-c:v", "copy", "-c:a", "aac", "-b:a", "192k", "-t", String(total),
  "out/depaso-reel.mp4",
);

const r = spawnSync(ffmpeg, args, { stdio: "inherit" });
process.exit(r.status ?? 1);
