export interface AutomatchVeredicto {
  paraSi: string;
  paraNo: string;
  dato: string;
  editorial: boolean;
}

export interface VeredictoEditorial {
  si?: string;
  no?: string;
  dato?: string;
}

type VeredictoVehicle = {
  nombre?: string;
  tipo?: string;
  uso?: string;
  ciudad?: string;
  precio?: number;
  carroceria?: string;
  condicion?: string;
};

function clean(value = "") {
  return String(value).replace(/\s+/g, " ").trim();
}

function bodyLabel(carroceria = "") {
  const value = carroceria.toLowerCase();
  if (value.includes("suv")) return "SUV";
  if (value.includes("hatch")) return "hatchback";
  if (value.includes("pick")) return "pick-up";
  if (value.includes("van")) return "van";
  if (value.includes("sedan") || value.includes("sedán")) return "sedán";
  return "";
}

function usoLabel(uso = "") {
  const value = uso.toLowerCase();
  if (value.includes("familiar")) return "familia y viajes";
  if (value.includes("trabajo")) return "trabajo y carga";
  if (value.includes("deport")) return "uso más picante, no solo el tráfico";
  return "el día a día en ciudad";
}

function tipoLabel(tipo = "") {
  const value = tipo.toLowerCase();
  if (value.includes("electr")) return "eléctrico";
  if (value.includes("hibrid") || value.includes("híbrid")) return "híbrido";
  if (value.includes("diesel") || value.includes("diésel")) return "diésel";
  return "a gasolina";
}

function generatedParaSi(vehicle: VeredictoVehicle) {
  const body = bodyLabel(vehicle.carroceria);
  const bodyBit = body ? ` un ${body}` : " un auto";
  const city = vehicle.ciudad
    ? ` con referencia en ${vehicle.ciudad}`
    : " en Colombia";
  return `Para quien busca${bodyBit} ${tipoLabel(vehicle.tipo)} pensado para ${usoLabel(vehicle.uso)}${city}, sin inflar el presupuesto.`;
}

function generatedParaNo(vehicle: VeredictoVehicle) {
  const uso = (vehicle.uso || "").toLowerCase();
  const tipo = (vehicle.tipo || "").toLowerCase();
  const body = (vehicle.carroceria || "").toLowerCase();

  if (tipo.includes("electr")) {
    return "No es para quien recorre carretera todas las semanas sin un plan claro de carga, o necesita siete puestos de verdad.";
  }
  if (uso.includes("deport") || body.includes("hatch")) {
    return "No es para quien prioriza baúl enorme, tercera fila o una camioneta alta sí o sí.";
  }
  if (uso.includes("trabajo") || body.includes("pick")) {
    return "No es para quien quiere un sedán bajo de ciudad o un eléctrico de poco kilometraje diario.";
  }
  if (uso.includes("familiar") || body.includes("suv") || body.includes("van")) {
    return "No es para quien busca un compacto barato de parqueadero estrecho, o un deportivo de fin de semana.";
  }
  return "No es para quien necesita otra carrocería, otro tipo de motor o un precio muy distinto al de esta ficha.";
}

function generatedDato(
  vehicle: VeredictoVehicle,
  specs: Record<string, unknown> = {},
) {
  const autonomia = clean(
    String(specs.autonomia || specs.autonomia_electrica || ""),
  );
  if (autonomia) {
    return `Autonomía declarada: ${autonomia}. Conviene cruzarla con tu uso real, no con el folleto.`;
  }

  const motor = clean(String(specs.motor || specs.potencia || ""));
  if (motor) {
    return `Dato de ficha: ${motor}. El match mira uso y presupuesto; esto es lo que la ficha comercial suele empujar al final.`;
  }

  if (vehicle.precio && vehicle.precio > 0) {
    const millones = Math.round(vehicle.precio / 1_000_000);
    return `Precio de referencia: ${millones} millones COP. El costo de uso (TCO) cuenta más que el sticker a cinco años.`;
  }

  return "Cruza este match con el costo de uso y con una nota editorial: el porcentaje solo dice qué tan cerca está de tu filtro.";
}

export function buildVeredicto(
  vehicle: VeredictoVehicle,
  specs: Record<string, unknown> = {},
  editorial: VeredictoEditorial = {},
): AutomatchVeredicto {
  const si = clean(editorial.si);
  const no = clean(editorial.no);
  const dato = clean(editorial.dato);
  const hasEditorial = Boolean(si || no || dato);

  return {
    paraSi: si || generatedParaSi(vehicle),
    paraNo: no || generatedParaNo(vehicle),
    dato: dato || generatedDato(vehicle, specs),
    editorial: hasEditorial,
  };
}
