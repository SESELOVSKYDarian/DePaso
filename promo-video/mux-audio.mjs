// Mezcla la música y los whoosh con el video mudo (out/silent.mp4) -> out/depaso-presentacion.mp4
// Se usa el ffmpeg que trae Remotion. Los tiempos salen de src/theme.ts y src/scenes/features.ts.
import { spawnSync } from "node:child_process";
import { readFileSync } from "node:fs";

const FPS = 30;
const intro = 150;
const escena = 195;
const salidaFrames = 180;
const escenas = (readFileSync("src/scenes/features.ts", "utf8").match(/etiqueta:/g) ?? []).length;
const total = (intro + escenas * escena + salidaFrames) / FPS;

const ffmpeg = "node_modules/@remotion/compositor-win32-x64-msvc/ffmpeg.exe";
const whoosh = "public/audio/whoosh.mp3";

const args = ["-y", "-i", "out/silent.mp4", "-ss", "8", "-t", String(total), "-i", "public/audio/cipher.oga"];
const filtros = [`[1:a]volume='0.8*min(1,t/1.5)*min(1,(${total}-t)/3.5)':eval=frame[musica]`];
const mezcla = ["[musica]"];

for (let i = 0; i < escenas; i++) {
  const ms = Math.round(((intro + i * escena) / FPS) * 1000);
  args.push("-i", whoosh);
  filtros.push(`[${i + 2}:a]adelay=${ms}|${ms},volume=0.4[w${i}]`);
  mezcla.push(`[w${i}]`);
}
filtros.push(`${mezcla.join("")}amix=inputs=${mezcla.length}:normalize=0:duration=first[audio]`);

args.push(
  "-filter_complex", filtros.join(";"),
  "-map", "0:v", "-map", "[audio]",
  "-c:v", "copy", "-c:a", "aac", "-b:a", "192k", "-t", String(total),
  "out/depaso-presentacion.mp4",
);

const r = spawnSync(ffmpeg, args, { stdio: "inherit" });
process.exit(r.status ?? 1);
