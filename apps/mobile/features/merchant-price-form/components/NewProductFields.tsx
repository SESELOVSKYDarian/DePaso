import { CategoryPicker } from "@/components/common/CategoryPicker";
import { FormField } from "@/components/common/FormField";

interface NewProductFieldsProps {
  name: string;
  onChangeName: (text: string) => void;
  category: string;
  onChangeCategory: (text: string) => void;
  brandName: string;
  onChangeBrandName: (text: string) => void;
  unit: string;
  onChangeUnit: (text: string) => void;
  unitSizeText: string;
  onChangeUnitSize: (text: string) => void;
  error?: string | undefined;
}

/** Los datos de un producto que todavía no está en el catálogo. */
export function NewProductFields(props: NewProductFieldsProps) {
  return (
    <>
      <FormField label="Nombre del producto" value={props.name} onChangeText={props.onChangeName} autoCapitalize="sentences" />
      <CategoryPicker value={props.category} onChange={props.onChangeCategory} />
      <FormField label="Marca (opcional)" value={props.brandName} onChangeText={props.onChangeBrandName} autoCapitalize="words" />
      <FormField label="Unidad" value={props.unit} onChangeText={props.onChangeUnit} placeholder="kg, l, u, g, ml" />
      <FormField
        label="Tamaño"
        value={props.unitSizeText}
        onChangeText={props.onChangeUnitSize}
        keyboardType="decimal-pad"
        placeholder="Ej. 1, 0.5, 500"
        error={props.error}
      />
    </>
  );
}
