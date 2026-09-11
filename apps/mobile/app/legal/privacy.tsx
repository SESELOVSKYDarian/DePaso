import { LegalBullet, LegalNotice, LegalParagraph, LegalScreen } from "@/components/LegalScreen";

export default function PrivacyScreen() {
  return (
    <LegalScreen>
      <LegalParagraph>
        Fuente completa: docs/legal-functional/LEGAL.md (Blueprint Legal &amp; Funcional
        v1.0). Resumen de los puntos ya decididos:
      </LegalParagraph>
      <LegalBullet>
        Usamos tu ubicación sólo mientras usás la app, para calcular rutas y desvíos. No
        guardamos tu historial de movimientos.
      </LegalBullet>
      <LegalBullet>
        Los lugares que guardás (Casa, Trabajo) quedan hasta que vos los borres. Los
        lugares temporales de un día se eliminan solos, salvo que elijas guardarlos.
      </LegalBullet>
      <LegalBullet>
        No pedimos tu DNI ni el número completo de tu tarjeta para la función principal.
      </LegalBullet>
      <LegalBullet>
        Los reportes de precio de la comunidad se guardan de forma que no te identifican
        públicamente.
      </LegalBullet>
      <LegalBullet>
        Podés pedir tus datos, corregirlos o eliminar tu cuenta desde Configuración →
        Privacidad y datos.
      </LegalBullet>
      <LegalNotice>
        Este documento tiene campos pendientes de completar con datos reales del negocio
        (razón social, CUIT, domicilio legal, emails de contacto) antes del lanzamiento.
      </LegalNotice>
    </LegalScreen>
  );
}
