/**
 * Tipo de producto ("gaseosas", "vinos", "shampoo"…) derivado del nombre.
 *
 * SEPA no categoriza: casi todo el catálogo llega como "Sin categorizar". Los nombres, en
 * cambio, son bastante regulares: la palabra que dice qué es el producto va primero
 * ("VINO TINTO MALBEC…", "SH PLUSBELLE BRILLO") y a menudo abreviada ("sh", "ac", "cerv",
 * "gall"). Se recorre el nombre de izquierda a derecha y gana la primera palabra conocida.
 *
 * Es una heurística, no una verdad: lo que no se reconoce queda en `null` y se sigue
 * encontrando por texto. Se puede afinar agregando palabras acá; después hay que volver a
 * correr el backfill (`pnpm data:sepa:backfill-types`).
 */

export interface ProductTypeDef {
  id: string;
  /** Texto para el chip de filtro, en plural. */
  label: string;
  /** Palabras (ya normalizadas: minúsculas y sin tildes) que identifican el tipo. */
  words: readonly string[];
}

export const PRODUCT_TYPES: readonly ProductTypeDef[] = [
  // --- Bebidas sin alcohol
  { id: "gaseosa", label: "Gaseosas", words: ["gaseosa", "gaseosas", "cola", "coca", "pepsi", "sprite", "fanta", "manaos", "schweppes", "tonica", "cunnington", "seven"] },
  { id: "agua", label: "Aguas y sodas", words: ["agua", "aguas", "soda", "sodas", "sifon", "saborizada", "saborizadas"] },
  { id: "jugo", label: "Jugos", words: ["jugo", "jugos", "jug", "nectar", "limonada", "polvo", "smoothie"] },
  { id: "energizante", label: "Energizantes e isotónicas", words: ["energizante", "energizantes", "isotonica", "isotonico", "gatorade", "powerade"] },
  { id: "bebida", label: "Otras bebidas", words: ["bebida", "bebidas"] },
  // --- Bebidas con alcohol
  { id: "cerveza", label: "Cervezas", words: ["cerveza", "cervezas", "cerv", "stout"] },
  { id: "vino", label: "Vinos", words: ["vino", "vinos", "vin", "malbec", "cabernet", "torrontes", "chardonnay", "syrah", "bonarda", "merlot"] },
  { id: "espumante", label: "Espumantes y sidras", words: ["espumante", "espumantes", "champagne", "champan", "sidra", "sidras"] },
  { id: "destilado", label: "Whisky, vodka y licores", words: ["whisky", "whiskey", "vodka", "gin", "ron", "tequila", "licor", "licores", "aperitivo", "aperitivos", "vermouth", "fernet", "amargo", "amargos", "cognac", "grappa"] },
  // --- Infusiones
  { id: "yerba", label: "Yerba", words: ["yerba", "yerbas"] },
  { id: "mate", label: "Mates y termos", words: ["mate", "mates", "termo", "termos", "bombilla", "bombillas"] },
  { id: "cafe", label: "Café", words: ["cafe", "cafes", "capuchino", "cappuccino", "nescafe"] },
  { id: "te", label: "Té e infusiones", words: ["te", "tes", "infusion", "infusiones", "manzanilla", "boldo", "cedron"] },
  { id: "edulcorante", label: "Azúcar y edulcorantes", words: ["edulcorante", "edulcorantes", "azucar", "azucares", "stevia", "sucralosa"] },
  // --- Lácteos y huevos
  { id: "leche", label: "Leches", words: ["leche", "leches", "lech"] },
  { id: "yogur", label: "Yogures", words: ["yogur", "yogures", "yog", "yogurt", "yoghurt"] },
  { id: "queso", label: "Quesos", words: ["queso", "quesos", "ques", "muzzarella", "mozzarella", "muzarella", "cremoso", "sardo", "rallado", "provolone", "reggianito", "roquefort", "ricota", "cheddar"] },
  { id: "crema_leche", label: "Cremas de leche", words: ["nata", "chantilly"] },
  { id: "manteca", label: "Manteca y margarina", words: ["manteca", "mantecas", "margarina"] },
  { id: "huevo", label: "Huevos", words: ["huevo", "huevos"] },
  { id: "postre", label: "Postres y gelatinas", words: ["postre", "postres", "flan", "gelatina", "gelatinas", "mousse"] },
  // --- Almacén
  { id: "galletita", label: "Galletitas", words: ["galletitas", "galletita", "galletas", "galleta", "gall", "galle", "gal", "tostadas", "tostada", "crackers", "cracker", "obleas", "oblea", "grisines", "grisin", "pepas"] },
  { id: "alfajor", label: "Alfajores", words: ["alfajor", "alfajores"] },
  { id: "golosina", label: "Chocolates y golosinas", words: ["chocolate", "chocolates", "choc", "choco", "tableta", "tabletas", "bombon", "bombones", "caramelos", "caramelo", "car", "chicle", "chicles", "gomitas", "gomita", "golosina", "golosinas", "chupetin", "chupetines", "turron", "turrones", "confites"] },
  { id: "snack", label: "Snacks", words: ["snack", "snacks", "mani", "manies", "papas", "palitos", "nachos", "pochoclo", "pochoclos", "chizitos", "chips", "barra", "barras"] },
  { id: "cereal", label: "Cereales y avena", words: ["cereal", "cereales", "avena", "granola", "copos", "muesli", "musli"] },
  { id: "harina", label: "Harinas y premezclas", words: ["harina", "harinas", "premezcla", "premezclas", "bizcochuelo", "polenta", "almidon", "maizena", "levadura"] },
  { id: "pasta", label: "Fideos y pastas", words: ["fideos", "fideo", "fid", "pasta", "pastas", "ravioles", "raviol", "sorrentinos", "tallarines", "noodles", "capeletis", "canelones", "noquis", "lasagna", "lasana", "spaghetti", "espaguetis", "mostachol", "tirabuzon"] },
  { id: "arroz", label: "Arroz y legumbres", words: ["arroz", "lentejas", "lenteja", "garbanzos", "porotos", "poroto", "legumbres", "arvejas", "arveja", "quinoa"] },
  { id: "aceite", label: "Aceites y vinagres", words: ["aceite", "aceites", "vinagre", "vinagres", "aceto"] },
  { id: "conserva", label: "Conservas y encurtidos", words: ["aceitunas", "aceitu", "pickles", "encurtidos", "pepinos", "morron", "morrones", "choclo", "duraznos", "durazno", "palmitos", "conserva", "conservas", "pure", "tomate", "tomates"] },
  { id: "salsa", label: "Salsas y condimentos", words: ["salsa", "salsas", "mayonesa", "ketchup", "mostaza", "aderezo", "aderezos", "condimento", "condimentos", "pimienta", "sal", "pimenton", "oregano", "comino", "aji", "chimichurri"] },
  { id: "sopa", label: "Sopas y caldos", words: ["sopa", "sopas", "caldo", "caldos"] },
  { id: "dulce", label: "Dulces y mermeladas", words: ["dulce", "dulces", "mermelada", "merm", "mermeladas", "miel", "jalea", "arrope", "membrillo"] },
  { id: "helado", label: "Helados y congelados", words: ["helado", "helados", "congelado", "congelados"] },
  { id: "pan", label: "Pan y panificados", words: ["pan", "panes", "prepizza", "pizza", "pizzas", "tapa", "tapas", "bizcochos", "bizcocho", "budin", "budines", "magdalena", "magdalenas", "factura", "facturas", "medialuna", "medialunas", "muffin", "muffins", "torta", "tortas"] },
  // --- Carnes y fiambres
  { id: "fiambre", label: "Fiambres", words: ["jamon", "salame", "salamin", "mortadela", "bondiola", "fiambre", "fiambres", "panceta", "salchichon"] },
  { id: "carne", label: "Carnes y rebozados", words: ["carne", "carnes", "hamburguesa", "hamburguesas", "medallon", "medallones", "milanesa", "milanesas", "nugget", "nuggets", "pollo", "chorizo", "salchicha", "salchichas", "morcilla", "asado", "bife", "bifes"] },
  { id: "pescado", label: "Pescados y mariscos", words: ["atun", "caballa", "sardina", "sardinas", "anchoa", "anchoas", "merluza", "salmon", "pescado"] },
  // --- Limpieza
  { id: "detergente", label: "Detergentes", words: ["detergente", "detergentes", "det", "lavavajilla", "lavavajillas", "lavavaj"] },
  { id: "lavado_ropa", label: "Lavado de ropa", words: ["lavarropas", "suavizante", "suavizantes", "suav", "quitamanchas", "blanqueador"] },
  { id: "lavandina", label: "Lavandina y desinfectantes", words: ["lavandina", "lavandinas", "cloro", "desinfectante", "desinfectantes", "desinf"] },
  { id: "limpiador", label: "Limpiadores", words: ["limpiador", "limpiadores", "limp", "limpiapisos", "limpia", "multiuso", "desengrasante", "antigrasa", "cif", "cera"] },
  { id: "jabon", label: "Jabones", words: ["jabon", "jabones", "jab"] },
  { id: "esponja", label: "Esponjas y paños", words: ["esponja", "esponjas", "pano", "panos", "trapo", "trapos", "rejilla", "rejillas", "virulana", "escobillon", "escoba", "secador", "balde", "guante", "guantes"] },
  { id: "bolsa", label: "Bolsas y envoltorios", words: ["bolsa", "bolsas", "film", "aluminio"] },
  { id: "aromatizante", label: "Aromatizantes y repelentes", words: ["aromatizante", "aromatizantes", "difusor", "difusores", "sahumerio", "sahumerios", "vela", "velas", "insecticida", "insecticidas", "repelente", "repelentes", "aerosol", "aromatizador", "aromat"] },
  { id: "papel", label: "Papel y servilletas", words: ["papel", "rollo", "rollos", "servilleta", "servilletas", "panuelos", "panuelo"] },
  // --- Cuidado personal y bebés
  { id: "shampoo", label: "Shampoo", words: ["shampoo", "shamp", "sh", "sha", "champu", "shampu"] },
  { id: "acondicionador", label: "Acondicionadores", words: ["acondicionador", "acondicionadores", "acond", "aco", "ac", "enjuague", "enj"] },
  { id: "desodorante", label: "Desodorantes", words: ["desodorante", "desodorantes", "deo", "des", "antitranspirante", "antitranspirantes", "ant"] },
  { id: "tintura", label: "Tinturas", words: ["tintura", "tinturas", "coloracion", "tinte", "tintes", "color"] },
  { id: "gel", label: "Geles y fijadores", words: ["gel", "gomina", "fijador"] },
  { id: "afeitado", label: "Afeitado", words: ["afeitar", "afeitada", "maquina", "maq", "cuchillas"] },
  { id: "piel", label: "Cremas y cuidado de la piel", words: ["cr", "hidratante", "locion", "lociones", "bronceador", "talco", "colonia"] },
  { id: "higiene_bucal", label: "Higiene bucal", words: ["dental", "dentifrico", "cepillo", "cep", "hilo"] },
  { id: "higiene_femenina", label: "Higiene femenina", words: ["tampon", "tampones", "prot", "toa", "toalla", "toallas"] },
  { id: "bebe", label: "Pañales y bebés", words: ["panal", "panales", "toallitas", "toallita", "mamadera", "chupete", "biberon"] },
  // --- Hogar y otros
  { id: "mascota", label: "Mascotas", words: ["balanceado", "mascota", "mascotas", "perro", "perros", "gato", "gatos"] },
  { id: "hogar", label: "Hogar y cocina", words: ["vaso", "vasos", "plato", "platos", "taza", "tazas", "hermetico", "canasta", "cesto", "organizador", "botella", "jarra", "olla", "sarten", "tapper", "colador", "cubiertos", "cubierto", "maceta", "bowl", "rebozador"] },
  { id: "electro", label: "Electro y tecnología", words: ["lampara", "lamparas", "pila", "pilas", "cargador", "cable", "auricular", "auriculares", "smart", "cel", "celular", "led", "ventilador", "estufa", "aire", "heladera", "microondas", "horno"] },
  { id: "ropa", label: "Ropa y calzado", words: ["remera", "remeras", "short", "pantalon", "medias", "buzo", "campera", "calza", "calzas", "boxer", "bombacha", "zapatilla", "zapatillas", "ojotas", "bermuda"] },
  { id: "farmacia", label: "Farmacia y botiquín", words: ["hisopos", "algodon", "alcohol", "pomada", "curitas", "gasa", "venda"] },
  { id: "juguete", label: "Juguetes", words: ["peluche", "muneca", "munecas", "playset", "globo", "globos", "juguete", "juguetes"] },
  { id: "libro", label: "Libros y papelería", words: ["lb", "libro", "libros", "cuaderno", "cuadernos", "lapiz", "lapices", "birome", "marcador", "marcadores"] },
];

export const PRODUCT_TYPE_LABELS: Readonly<Record<string, string>> = Object.fromEntries(
  PRODUCT_TYPES.map((type) => [type.id, type.label]),
);

const TOKEN_TO_TYPE: ReadonlyMap<string, string> = new Map(
  PRODUCT_TYPES.flatMap((type) => type.words.map((word) => [word, type.id] as const)),
);

/** Minúsculas, sin tildes ni signos, espacios colapsados. */
function normalize(text: string): string {
  return text
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "")
    .toLowerCase()
    .replace(/[^a-z0-9/]+/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}

const BUCAL = /\b(dental|dentifrico|dientes|bucal|listerine|colgate|oral b|plax)\b/;
const FEMENINA = /\b(always|nosotras|calipso|carefree|ladysoft|tampon|tampones)\b/;
const MASCOTA = /\b(perro|perros|gato|gatos|mascota|mascotas|canino|felino|balanceado|cachorro|cat chow|dog chow|pedigree|whiskas)\b/;
const ROPA = /\b(ropa|lavarropas|pvo|polvo|a\/e|ae)\b/;
const COSMETICA = /\b(corporal|corp|manos|facial|pies|rostro|cuerpo|solar|hidratante|antiage|antiarrugas|aclaradora|piel|ponds|nivea|dove|vichy|neutrogena)\b/;

/**
 * Casos con la misma palabra en rubros distintos ("crema" de leche o de manos, "pasta"
 * dental o de fideos, "jabón" de tocador o de ropa). Se resuelven mirando el resto del nombre.
 */
const CONTEXTUAL: Readonly<Record<string, (text: string) => string>> = {
  crema: (text) => (COSMETICA.test(text) ? "piel" : BUCAL.test(text) ? "higiene_bucal" : "crema_leche"),
  crem: (text) => (COSMETICA.test(text) ? "piel" : "crema_leche"),
  cr: (text) => (BUCAL.test(text) ? "higiene_bucal" : "piel"),
  pasta: (text) => (BUCAL.test(text) ? "higiene_bucal" : "pasta"),
  jabon: (text) => (ROPA.test(text) ? "lavado_ropa" : "jabon"),
  jab: (text) => (ROPA.test(text) ? "lavado_ropa" : "jabon"),
  detergente: (text) => (ROPA.test(text) ? "lavado_ropa" : "detergente"),
  det: (text) => (ROPA.test(text) ? "lavado_ropa" : "detergente"),
  enjuague: (text) => (BUCAL.test(text) ? "higiene_bucal" : "acondicionador"),
  enj: (text) => (BUCAL.test(text) || /\benj b\b/.test(text) ? "higiene_bucal" : "acondicionador"),
  toalla: (text) => (FEMENINA.test(text) ? "higiene_femenina" : "papel"),
  toallas: (text) => (FEMENINA.test(text) ? "higiene_femenina" : "papel"),
  gel: (text) => (/\b(afeitar|afe|afeitado)\b/.test(text) ? "afeitado" : "gel"),
  cepillo: (text) => (/\b(ropa|pelo|cabello|limpieza|esquinas|bano|inodoro)\b/.test(text) ? "esponja" : "higiene_bucal"),
  cep: (text) => (/\b(ropa|pelo|cabello|limpieza|esquinas|bano|inodoro)\b/.test(text) ? "esponja" : "higiene_bucal"),
  alimento: (text) => (MASCOTA.test(text) ? "mascota" : ""),
  alim: (text) => (MASCOTA.test(text) ? "mascota" : ""),
};

/** Devuelve el id del tipo (`"gaseosa"`, `"vino"`…) o `null` si no se reconoce. */
export function classifyProductType(productName: string): string | null {
  const text = normalize(productName);
  if (!text) return null;

  // Estos rubros se identifican por el contexto, aunque la primera palabra sea otra.
  if (MASCOTA.test(text)) return "mascota";
  if (FEMENINA.test(text)) return "higiene_femenina";

  for (const token of text.split(" ")) {
    const contextual = CONTEXTUAL[token];
    if (contextual) {
      const resolved = contextual(text);
      if (resolved) return resolved;
      continue;
    }
    const type = TOKEN_TO_TYPE.get(token);
    if (type) return type;
  }
  return null;
}
