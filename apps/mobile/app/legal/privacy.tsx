import { LegalBullet, LegalHeading, LegalParagraph, LegalScreen } from "@/components/LegalScreen";

export default function PrivacyScreen() {
  return (
    <LegalScreen>
      <LegalParagraph>Última actualización: 10 de septiembre de 2026.</LegalParagraph>
      <LegalParagraph>
        En DePaso cuidamos tus datos. Esta política explica qué información recopilamos, para qué la usamos y qué
        derechos tenés, de acuerdo con la Ley 25.326 de Protección de Datos Personales de la República Argentina.
      </LegalParagraph>

      <LegalHeading>1. Qué datos recopilamos</LegalHeading>
      <LegalBullet>Datos de tu cuenta: nombre, apellido, email y, si ingresás con Google, Meta o Discord, el email verificado de ese servicio. Tu contraseña se guarda cifrada y nunca podemos verla.</LegalBullet>
      <LegalBullet>Tus listas de compra, productos, marcas preferidas y los comercios que marcás como favoritos.</LegalBullet>
      <LegalBullet>Los lugares que guardás (casa, trabajo, etc.) y tus rutas. Solo guardamos un lugar o una ruta si vos lo pedís.</LegalBullet>
      <LegalBullet>Tu ubicación aproximada cuando das permiso, solo en el momento en que la usás para armar un recorrido. No te seguimos durante el día.</LegalBullet>
      <LegalBullet>Los medios de pago que declarás tener (por ejemplo Visa o Cuenta DNI). Nunca pedimos números de tarjeta, claves ni códigos de seguridad.</LegalBullet>
      <LegalBullet>Si usás el dictado por voz, el audio se envía para pasarlo a texto y se descarta enseguida: no lo guardamos.</LegalBullet>
      <LegalBullet>Datos técnicos básicos, como el modelo del dispositivo y errores de la Aplicación, para corregir fallas.</LegalBullet>

      <LegalHeading>2. Para qué los usamos</LegalHeading>
      <LegalBullet>Para darte el servicio: comparar precios, armar tu compra de paso y mostrarte tu recorrido.</LegalBullet>
      <LegalBullet>Para aplicar las promociones de los medios de pago que declaraste.</LegalBullet>
      <LegalBullet>Para mantener la seguridad de las cuentas y prevenir fraudes o abusos.</LegalBullet>
      <LegalBullet>Para mejorar la Aplicación y detectar errores.</LegalBullet>
      <LegalBullet>Para enviarte novedades y promociones, solo si lo aceptaste. Podés dejar de recibirlas cuando quieras.</LegalBullet>

      <LegalHeading>3. Con quién los compartimos</LegalHeading>
      <LegalParagraph>No vendemos tus datos. Solo los compartimos con proveedores que nos ayudan a prestar el servicio y que están obligados a protegerlos:</LegalParagraph>
      <LegalBullet>Servicios de alojamiento y base de datos donde funciona la Aplicación.</LegalBullet>
      <LegalBullet>Servicios de mapas y direcciones, que reciben las direcciones o coordenadas que consultás.</LegalBullet>
      <LegalBullet>Servicios de inteligencia artificial y voz a texto, que reciben el texto o el audio que le pedís a la Aplicación procesar.</LegalBullet>
      <LegalBullet>Autoridades, cuando una ley o una orden judicial lo exija.</LegalBullet>
      <LegalParagraph>Los precios que aportás a la comunidad se muestran sin tu nombre.</LegalParagraph>

      <LegalHeading>4. Cuánto tiempo los guardamos</LegalHeading>
      <LegalParagraph>
        Guardamos tus datos mientras tengas la cuenta. Si la borrás, eliminamos tus datos personales, salvo los que
        debamos conservar por obligación legal o para resolver reclamos, por el tiempo que la ley establezca.
      </LegalParagraph>

      <LegalHeading>5. Tus derechos</LegalHeading>
      <LegalParagraph>
        Podés pedir en cualquier momento acceder a tus datos, corregirlos, actualizarlos o suprimirlos, y descargar una
        copia desde la Aplicación. También podés revocar el permiso de ubicación desde los ajustes del teléfono. Para
        ejercer tus derechos escribinos a privacidad@depaso.com.ar.
      </LegalParagraph>
      <LegalParagraph>
        La Agencia de Acceso a la Información Pública, en su carácter de órgano de control de la Ley 25.326, tiene la
        atribución de atender las denuncias y reclamos de quienes consideren afectados sus derechos.
      </LegalParagraph>

      <LegalHeading>6. Seguridad</LegalHeading>
      <LegalParagraph>
        Usamos conexiones cifradas, guardamos las contraseñas de forma segura y limitamos el acceso a los datos. Ningún
        sistema es infalible: si ocurriera un incidente que te afecte, te lo vamos a informar.
      </LegalParagraph>

      <LegalHeading>7. Menores de edad</LegalHeading>
      <LegalParagraph>DePaso es para mayores de 18 años. Si detectamos una cuenta de un menor, la damos de baja.</LegalParagraph>

      <LegalHeading>8. Cambios en esta política</LegalHeading>
      <LegalParagraph>
        Si cambiamos esta política te avisaremos dentro de la Aplicación antes de que empiece a regir.
      </LegalParagraph>
    </LegalScreen>
  );
}
