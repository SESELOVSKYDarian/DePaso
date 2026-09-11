import { LegalBullet, LegalParagraph, LegalScreen } from "@/components/LegalScreen";

const RULES = [
  "Reportá el precio realmente visto y la sucursal correcta.",
  "Indicá si el precio requiere promoción, tarjeta, club o cantidad mínima.",
  "No votes para favorecer o perjudicar a un comercio.",
  "No uses múltiples cuentas, bots ni grupos coordinados.",
  "Si adjuntás una foto, evitá datos personales de otras personas o datos completos de pago.",
  "Los reportes pueden ser ponderados, ocultados o enviados a revisión si son anómalos.",
  "Reportar distinto a otros no es infracción — el problema es la manipulación deliberada.",
  "DePaso puede mostrar varios precios cuando no hay consenso suficiente.",
  "La comunidad ayuda a mejorar la información; el comercio conserva el precio final aplicable al momento de la compra.",
];

export default function CommunityGuidelinesScreen() {
  return (
    <LegalScreen>
      <LegalParagraph>
        Fuente: docs/legal-functional/BUSINESS-RULES.md. Estas normas son obligatorias
        para participar del sistema de precios comunitarios de DePaso.
      </LegalParagraph>
      {RULES.map((rule) => (
        <LegalBullet key={rule}>{rule}</LegalBullet>
      ))}
    </LegalScreen>
  );
}
