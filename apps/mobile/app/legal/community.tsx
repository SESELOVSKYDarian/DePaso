import { LegalBullet, LegalHeading, LegalParagraph, LegalScreen } from "@/components/LegalScreen";

export default function CommunityGuidelinesScreen() {
  return (
    <LegalScreen>
      <LegalParagraph>
        DePaso funciona mejor cuando todos aportan información real. Estas normas nos ayudan a que los precios sean
        confiables para toda la comunidad.
      </LegalParagraph>

      <LegalHeading>Cuando reportás un precio</LegalHeading>
      <LegalBullet>Reportá solo lo que viste vos, en la sucursal correcta y con el monto exacto.</LegalBullet>
      <LegalBullet>Aclará si el precio necesita una promoción, una tarjeta, un club o una cantidad mínima.</LegalBullet>
      <LegalBullet>Si adjuntás una foto, que se vea el producto y su precio. Evitá que salgan personas, datos personales o datos de pago.</LegalBullet>

      <LegalHeading>Lo que no se permite</LegalHeading>
      <LegalBullet>Cargar precios falsos, inventados o de otra sucursal.</LegalBullet>
      <LegalBullet>Votar o reportar para favorecer o perjudicar a un comercio.</LegalBullet>
      <LegalBullet>Usar varias cuentas, bots o grupos coordinados para influir en los precios.</LegalBullet>
      <LegalBullet>Insultar, discriminar o acosar a otras personas, o publicar contenido ofensivo o ilegal.</LegalBullet>
      <LegalBullet>Hacerte pasar por un comercio o por otra persona.</LegalBullet>

      <LegalHeading>Cómo cuidamos la información</LegalHeading>
      <LegalBullet>Los reportes se comparan entre sí y con otras fuentes: los que se alejan mucho de lo habitual se revisan antes de mostrarse.</LegalBullet>
      <LegalBullet>Si no hay acuerdo suficiente, podemos mostrar más de un precio para que veas las diferencias.</LegalBullet>
      <LegalBullet>Que tu reporte sea distinto al de otra persona no es una falta: puede haber diferencias reales. Lo que no se permite es manipular a propósito.</LegalBullet>

      <LegalHeading>Qué puede pasar si no se cumplen</LegalHeading>
      <LegalParagraph>
        Podemos ocultar o quitar un aporte, bajar su peso en el cálculo, limitar las funciones de la cuenta o
        suspenderla si la infracción es grave o se repite. Si creés que nos equivocamos, escribinos a
        soporte@depaso.com.ar y lo revisamos.
      </LegalParagraph>

      <LegalHeading>Importante</LegalHeading>
      <LegalParagraph>
        La comunidad ayuda a mantener la información al día, pero el precio final siempre lo define el comercio en el
        momento de la compra.
      </LegalParagraph>
    </LegalScreen>
  );
}
