import { AbsoluteFill, Img, interpolate, spring, staticFile, useCurrentFrame, useVideoConfig } from "remotion";
import { colors, fonts } from "../theme";

// recorrido de casa al trabajo sobre un mapa oscuro; los comercios aparecen con su logo
const RUTA = "M 160 1500 L 160 1180 L 470 1180 L 470 820 L 760 820 L 760 460 L 920 460";
const LARGO = 2060;
const PINES = [
  { logo: "coto.png", x: 300, y: 1180, en: 40 },
  { logo: "dia.png", x: 470, y: 960, en: 62 },
  { logo: "carrefour.png", x: 640, y: 820, en: 84 },
];

export const MapRoute = () => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const avance = interpolate(frame, [6, 100], [0, 1], { extrapolateLeft: "clamp", extrapolateRight: "clamp" });
  const zoom = interpolate(frame, [0, 135], [1.12, 1]);
  const salida = interpolate(frame, [120, 135], [1, 0], { extrapolateLeft: "clamp" });

  return (
    <AbsoluteFill style={{ opacity: salida }}>
      <AbsoluteFill style={{ transform: `scale(${zoom})` }}>
        <svg width={1080} height={1920} viewBox="0 0 1080 1920">
          {/* manzanas */}
          {Array.from({ length: 9 }).map((_, f) =>
            Array.from({ length: 5 }).map((__, c) => (
              <rect key={`${f}-${c}`} x={30 + c * 220} y={60 + f * 205} width={180} height={165} rx={14} fill="#0d1420" />
            )),
          )}
          <path d="M 0 1640 Q 540 1560 1080 1700 L 1080 1920 L 0 1920 Z" fill="#0b1b33" />
          {/* ruta: halo y línea que se dibuja */}
          <path d={RUTA} stroke="rgba(124,176,255,.25)" strokeWidth={46} fill="none" strokeLinecap="round" strokeLinejoin="round"
            strokeDasharray={LARGO} strokeDashoffset={LARGO * (1 - avance)} />
          <path d={RUTA} stroke={colors.blue} strokeWidth={16} fill="none" strokeLinecap="round" strokeLinejoin="round"
            strokeDasharray={LARGO} strokeDashoffset={LARGO * (1 - avance)} />
          <circle cx={160} cy={1500} r={26} fill={colors.lime} />
          <circle cx={920} cy={460} r={26 * avance} fill={colors.lime} />
        </svg>
      </AbsoluteFill>

      {PINES.map((pin) => {
        const p = spring({ frame: frame - pin.en, fps, config: { damping: 10, stiffness: 170 } });
        return (
          <div
            key={pin.logo}
            style={{
              position: "absolute",
              left: pin.x - 60,
              top: pin.y - 150,
              width: 120,
              height: 120,
              borderRadius: 36,
              background: "#fff",
              padding: 14,
              boxShadow: "0 20px 50px rgba(0,0,0,.6)",
              transform: `scale(${p}) translateY(${interpolate(p, [0, 1], [40, 0])}px)`,
            }}
          >
            <Img src={staticFile(`logos/${pin.logo}`)} style={{ width: "100%", height: "100%", objectFit: "contain" }} />
          </div>
        );
      })}

      <div style={{ position: "absolute", left: 70, top: 1560, fontFamily: fonts.body, fontWeight: 700, fontSize: 30, color: colors.lime, letterSpacing: 6 }}>
        CASA → TRABAJO
      </div>
      <div style={{ position: "absolute", left: 70, right: 70, top: 1620, fontFamily: fonts.title, fontWeight: 700, fontSize: 92, lineHeight: 1.05, color: colors.text }}>
        Los comercios, en tu camino.
      </div>
    </AbsoluteFill>
  );
};
