import { LegalBullet, LegalNotice, LegalParagraph, LegalScreen } from "@/components/LegalScreen";

export default function TermsScreen() {
  return (
    <LegalScreen>
      <LegalParagraph>
        Fuente completa: docs/legal-functional/LEGAL.md (25 cláusulas del Blueprint Legal
        &amp; Funcional v1.0). Puntos ya decididos:
      </LegalParagraph>
      <LegalBullet>
        DePaso es una herramienta informativa. No vendemos productos ni somos el
        comercio — el precio final lo determina siempre el comercio.
      </LegalBullet>
      <LegalBullet>
        Los precios y ahorros que mostramos son estimaciones y pueden variar por sucursal,
        stock, promociones o medio de pago. Verificá el valor final en el comercio.
      </LegalBullet>
      <LegalBullet>Nunca prometemos "el precio garantizado" ni "siempre el más barato".</LegalBullet>
      <LegalBullet>Para crear una cuenta declarás tener 18 años o más.</LegalBullet>
      <LegalBullet>
        Los aportes de la comunidad (reportes de precio) deben ser de buena fe —
        moderamos con trazabilidad, nunca por discrepar de un precio.
      </LegalBullet>
      <LegalNotice>
        Este documento tiene campos pendientes de completar con datos reales del negocio
        (razón social, CUIT, domicilio legal, emails de contacto) antes del lanzamiento.
      </LegalNotice>
    </LegalScreen>
  );
}
