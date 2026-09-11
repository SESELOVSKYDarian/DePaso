import { LegalPage, PendingNotice } from "@/components/legal";

export const metadata = { title: "Privacidad — DePaso" };

export default function PrivacyPage() {
  return (
    <LegalPage title="Política de Privacidad">
      <p>
        Fuente completa: <code>docs/legal-functional/LEGAL.md</code> (a partir del Blueprint
        Legal &amp; Funcional v1.0). Resumen de los puntos ya decididos:
      </p>
      <ul>
        <li>
          Usamos tu ubicación sólo <strong>mientras usás la app</strong>, para calcular rutas y
          desvíos. No guardamos tu historial de movimientos.
        </li>
        <li>
          Los lugares que guardás (Casa, Trabajo) quedan hasta que vos los borres. Los lugares
          temporales de un día se eliminan solos, salvo que elijas guardarlos.
        </li>
        <li>No pedimos tu DNI ni el número completo de tu tarjeta para la función principal.</li>
        <li>
          Los reportes de precio de la comunidad se guardan de forma que no te identifican
          públicamente.
        </li>
        <li>
          Podés pedir tus datos, corregirlos o eliminar tu cuenta desde Configuración →
          Privacidad y datos.
        </li>
      </ul>
      <PendingNotice />
    </LegalPage>
  );
}
