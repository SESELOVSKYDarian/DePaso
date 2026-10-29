import { LegalBullet, LegalHeading, LegalParagraph, LegalScreen } from "@/components/common/LegalScreen";

export default function TermsScreen() {
  return (
    <LegalScreen>
      <LegalParagraph>Última actualización: 10 de septiembre de 2026.</LegalParagraph>
      <LegalParagraph>
        Estos Términos y Condiciones regulan el uso de la aplicación DePaso (la &quot;Aplicación&quot;). Al crear una cuenta o
        usar la Aplicación aceptás estas condiciones. Si no estás de acuerdo con alguna, no la uses.
      </LegalParagraph>

      <LegalHeading>1. Qué es DePaso</LegalHeading>
      <LegalParagraph>
        DePaso es una herramienta que compara precios de supermercados y comercios de Mar del Plata y te sugiere dónde
        comprar lo de tu lista sin desviarte de tu recorrido. DePaso no vende productos, no cobra por las compras ni
        interviene en la operación entre vos y el comercio.
      </LegalParagraph>

      <LegalHeading>2. Tu cuenta</LegalHeading>
      <LegalBullet>Tenés que ser mayor de 18 años y darnos datos verdaderos.</LegalBullet>
      <LegalBullet>Sos responsable de tu contraseña y de lo que se haga desde tu cuenta. Avisanos si creés que alguien más entró.</LegalBullet>
      <LegalBullet>Podés tener una sola cuenta. Podemos suspender cuentas duplicadas o usadas para manipular la información.</LegalBullet>
      <LegalBullet>Podés borrar tu cuenta cuando quieras desde la Aplicación o escribiéndonos.</LegalBullet>

      <LegalHeading>3. Precios, promociones y ahorros</LegalHeading>
      <LegalParagraph>
        Los precios provienen de publicaciones oficiales de los comercios, de los propios comercios registrados y de
        aportes de la comunidad. Por eso pueden estar desactualizados o variar por sucursal, stock, día, medio de pago o
        cantidad. Los ahorros y los desvíos que mostramos son estimaciones.
      </LegalParagraph>
      <LegalBullet>El precio final siempre lo define el comercio al momento de la compra: verificalo antes de pagar.</LegalBullet>
      <LegalBullet>
        Las promociones de bancos y billeteras se muestran como referencia. Sus condiciones, topes y vigencia son
        de cada entidad.
      </LegalBullet>
      <LegalBullet>No garantizamos que una opción sea siempre la más barata ni que un producto esté disponible.</LegalBullet>

      <LegalHeading>4. Ubicación y recorridos</LegalHeading>
      <LegalParagraph>
        Usamos tu ubicación únicamente cuando vos lo permitís, para calcular recorridos y comercios cercanos. Podés
        cargar direcciones a mano en lugar de compartir tu ubicación. Las distancias, tiempos y cuadras son aproximados
        y no reemplazan una navegación en tiempo real.
      </LegalParagraph>

      <LegalHeading>5. Aportes de la comunidad</LegalHeading>
      <LegalParagraph>
        Si reportás un precio o subís una foto, declarás que es real y que lo viste vos. Nos das permiso para mostrarlo
        dentro de la Aplicación. Los aportes deben respetar las Normas de la comunidad y podemos ocultarlos o
        retirarlos si no las cumplen.
      </LegalParagraph>

      <LegalHeading>6. Comercios</LegalHeading>
      <LegalParagraph>
        Los comercios que administran su sucursal en DePaso son responsables de que sus precios y nombres sean
        correctos. DePaso puede verificar los pedidos de alta y suspender cuentas que publiquen información falsa.
      </LegalParagraph>

      <LegalHeading>7. Uso permitido</LegalHeading>
      <LegalBullet>No uses la Aplicación para fines ilegales ni para perjudicar a otras personas o comercios.</LegalBullet>
      <LegalBullet>No copies masivamente la información, no uses bots ni intentes vulnerar la seguridad del servicio.</LegalBullet>
      <LegalBullet>No te hagas pasar por otra persona ni por un comercio que no administrás.</LegalBullet>

      <LegalHeading>8. Disponibilidad y responsabilidad</LegalHeading>
      <LegalParagraph>
        Hacemos lo posible para que DePaso funcione sin interrupciones, pero puede haber cortes por mantenimiento o por
        causas ajenas. DePaso no responde por diferencias de precio, faltantes de stock, decisiones de compra tomadas
        con la información de la Aplicación ni por el contenido de sitios o servicios de terceros, salvo en los casos en
        que la ley lo establezca.
      </LegalParagraph>

      <LegalHeading>9. Propiedad intelectual</LegalHeading>
      <LegalParagraph>
        La marca DePaso, el diseño y el código de la Aplicación son propiedad de sus titulares. Las marcas y logos de
        comercios y productos pertenecen a sus dueños y se muestran solo para identificarlos.
      </LegalParagraph>

      <LegalHeading>10. Cambios en estos términos</LegalHeading>
      <LegalParagraph>
        Podemos actualizar estos términos. Si el cambio es importante te lo vamos a avisar en la Aplicación antes de que
        empiece a regir. Si seguís usando DePaso después, entendemos que lo aceptás.
      </LegalParagraph>

      <LegalHeading>11. Ley aplicable y contacto</LegalHeading>
      <LegalParagraph>
        Estos términos se rigen por las leyes de la República Argentina. Ante cualquier conflicto serán competentes los
        tribunales ordinarios de la ciudad de Mar del Plata, sin perjuicio de los derechos que la Ley de Defensa del
        Consumidor te reconoce. Para consultas o reclamos escribinos a soporte@depaso.com.ar.
      </LegalParagraph>
    </LegalScreen>
  );
}
