import { PRODUCT_TYPES, classifyProductType } from "@depaso/domain";
import { describe, expect, it } from "vitest";

describe("classifyProductType", () => {
  const cases: Array<[string, string | null]> = [
    ["VINO TINTO MALBEC FINCA LAS MORAS", "vino"],
    ["GASEOSA COCA COLA ZERO 2.25L", "gaseosa"],
    ["Coca Cola sabor original 1.5L", "gaseosa"],
    ["CERV QUILMES CLASICA LATA 473ML", "cerveza"],
    ["YERBA MATE TARAGUI X 1 KG", "yerba"],
    ["SH PLUSBELLE BRILLO", "shampoo"],
    ["SHA ANTICASPA", "shampoo"],
    ["AC H&S MANZANA FRESH", "acondicionador"],
    ["ACOND 3MM HIDRAT EXTRA", "acondicionador"],
    ["DES AER DOVE ALL BODY DEO LAVENDER X 150 ML", "desodorante"],
    ["ANT NIVEA DRY COMFORT", "desodorante"],
    ["FID ARCOR MOSTACHOL", "pasta"],
    ["GAL. 9 DE ORO ANI.CHOC120 180 gr", "galletita"],
    ["ARROZ LARGO FINO GALLO", "arroz"],
    ["LECHE ENTERA LA SERENISIMA 1L", "leche"],
    ["YOG ENT SERENISIMA FRUTILLA", "yogur"],
    ["QUESO CREMOSO LA PAULINA", "queso"],
    ["ACEITE DE GIRASOL NATURA 900ML", "aceite"],
    ["DULCE DE LECHE LA SERENISIMA", "dulce"],
    ["SAL AHUMADA X 125 GR HUMOS", "salsa"],
    ["SOPA INSTANTANEA KNORR", "sopa"],
    ["MAQ AF BIC COMFORT 2 SENS PO X5U", "afeitado"],
    ["GEL AFEITAR SENSIT NIVEA", "afeitado"],
    ["GEL ACT.PATO TROPICAL", "gel"],
    ["PROT ALWAYS RESPI S/P PQX15U", "higiene_femenina"],
    ["TOA ALWAYS XTR TRIP/D SUA PQX8U", "higiene_femenina"],
    ["PAÑAL HUGGIES ULTRA", "bebe"],
    ["CEP COLGATE BRILLANT STAR X2UN", "higiene_bucal"],
    ["PASTA DENTAL COLGATE TRIPLE", "higiene_bucal"],
    ["ENJ B LISTERINE SAND/MEN BTX250ML", "higiene_bucal"],
    ["ENJ PANTENE HIDRATACION", "acondicionador"],
    ["CR COLGATE MAX WH CRY MINT X180GR", "higiene_bucal"],
    ["CR BIOHIDRATANTE PONDS POTEX50G", "piel"],
    ["CREMA DE LECHE LA SERENISIMA", "crema_leche"],
    ["CREMA CORP VN PIEL EQUIL", "piel"],
    ["JAB ALA PVO L/MANO COR EC", "lavado_ropa"],
    ["JABON DE TOCADOR LUX", "jabon"],
    ["DET A/E ALA CORE MAX SUA PQ X3KG", "lavado_ropa"],
    ["DETERGENTE ALA LIMON 750ML", "detergente"],
    ["ALIMENTO PARA PERROS PEDIGREE", "mascota"],
    ["AL. CAT CHOW ADULT POLLO", "mascota"],
    ["POLVO ARCOR NARANJA", "jugo"],
    ["MATE AUTOCEBANTE MINOICO 350 CC", "mate"],
    ["SET 10 PLATOS SOUL LIFE DESCARTABLE", "hogar"],
    ["CEL GALAXY A26 5G BLACK", "electro"],
    ["AIRE ACON BGH BS26WCAT FC", "electro"],
    ["LB 101 CUENTOS CORTOS PARA COMPARTIR", "libro"],
    ["ZZZ PRODUCTO RARO", null],
    ["", null],
  ];

  it.each(cases)("%s -> %s", (name, expected) => {
    expect(classifyProductType(name)).toBe(expected);
  });
});

describe("PRODUCT_TYPES", () => {
  it("no repite una palabra en dos tipos (si no, gana el último sin aviso)", () => {
    const seen = new Map<string, string>();
    const repeated: string[] = [];
    for (const type of PRODUCT_TYPES) {
      for (const word of type.words) {
        const previous = seen.get(word);
        if (previous && previous !== type.id) repeated.push(`${word}: ${previous} / ${type.id}`);
        seen.set(word, type.id);
      }
    }
    expect(repeated).toEqual([]);
  });

  it("ids y etiquetas únicos", () => {
    expect(new Set(PRODUCT_TYPES.map((t) => t.id)).size).toBe(PRODUCT_TYPES.length);
    expect(new Set(PRODUCT_TYPES.map((t) => t.label)).size).toBe(PRODUCT_TYPES.length);
  });
});
