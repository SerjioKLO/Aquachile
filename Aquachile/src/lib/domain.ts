export type Rol = "analista" | "evaluador" | "admin" | "jefatura";

export const ROLES: { id: Rol; nombre: string; descripcion: string }[] = [
  {
    id: "analista",
    nombre: "Analista de Reclutamiento",
    descripcion: "Registra candidatos y genera solicitudes de evaluación.",
  },
  {
    id: "evaluador",
    nombre: "Profesional Evaluador",
    descripcion: "Realiza las entrevistas y registra dictámenes clínicos.",
  },
  {
    id: "admin",
    nombre: "Administrador Académico",
    descripcion: "Gestiona usuarios simulados, catálogos de cargos y restablecimiento de datos.",
  },
  {
    id: "jefatura",
    nombre: "Jefatura o Contraparte Simulada",
    descripcion: "Visualiza dashboard gerencial e indicadores en modo de solo lectura.",
  },
];

export const USUARIOS: { usuario: string; clave: string; rol: Rol; nombre: string }[] = [
  { usuario: "analista", clave: "1234", rol: "analista", nombre: "Ps. Camila Rojas" },
  { usuario: "evaluador", clave: "1234", rol: "evaluador", nombre: "Ps. Andrés Miranda" },
  { usuario: "admin", clave: "1234", rol: "admin", nombre: "Administrador Duoc UC" },
  { usuario: "jefatura", clave: "1234", rol: "jefatura", nombre: "Marcelo Crisóstomo (Jefatura)" },
];

export type Permiso =
  | "ver_panel"
  | "ver_candidatos"
  | "editar_candidatos"
  | "ver_solicitudes"
  | "crear_solicitudes"
  | "evaluar"
  | "administrar";

export const PERMISOS_POR_ROL: Record<Rol, Permiso[]> = {
  analista: [
    "ver_panel",
    "ver_candidatos",
    "editar_candidatos",
    "ver_solicitudes",
    "crear_solicitudes",
  ],
  evaluador: ["ver_panel", "ver_candidatos", "ver_solicitudes", "evaluar"],
  admin: [
    "ver_panel",
    "ver_candidatos",
    "editar_candidatos",
    "ver_solicitudes",
    "crear_solicitudes",
    "evaluar",
    "administrar",
  ],
  jefatura: ["ver_panel", "ver_candidatos", "ver_solicitudes"],
};

export type FamiliaCargo =
  | "Operaciones / Producción"
  | "Tecnología / IT"
  | "Ventas / Comercial"
  | "Recursos Humanos"
  | "Calidad y Medio Ambiente"
  | "Finanzas y Administración";

export const FAMILIAS: FamiliaCargo[] = [
  "Operaciones / Producción",
  "Tecnología / IT",
  "Ventas / Comercial",
  "Recursos Humanos",
  "Calidad y Medio Ambiente",
  "Finanzas y Administración",
];

export type EstadoSolicitud = "Pendiente" | "En proceso" | "Finalizada";
export const ESTADOS: EstadoSolicitud[] = ["Pendiente", "En proceso", "Finalizada"];

export type Dictamen = "Recomendado" | "Con observaciones" | "No recomendado";
export const DICTAMENES: Dictamen[] = ["Recomendado", "Con observaciones", "No recomendado"];

export type Prioridad = "Alta" | "Media" | "Baja";

export interface Candidato {
  id: string;
  rut: string;
  nombre: string;
  correo: string;
  telefono: string;
  familia: FamiliaCargo;
  cargo: string;
  activo: boolean;
  creado: string;
}

export interface Evaluacion {
  fechaEntrevista: string;
  conclusiones: string;
  dictamen: Dictamen | "";
  preguntasUsadas: Record<string, boolean>;
  notasPregunta: Record<string, string>;
}

export interface Solicitud {
  id: string;
  codigo: string;
  candidatoId: string;
  cargo: string;
  familia: FamiliaCargo;
  psicologo: string;
  prioridad: Prioridad;
  fechaSolicitud: string;
  estado: EstadoSolicitud;
  actualizada: string;
  evaluacion: Evaluacion;
}

export interface CargoItem {
  id: string;
  nombre: string;
  familia: FamiliaCargo;
  descripcion: string;
  activo: boolean;
}

export const CARGOS_INICIALES: CargoItem[] = [
  {
    id: "cg1",
    nombre: "Ejecutiva Comercial",
    familia: "Ventas / Comercial",
    descripcion: "Gestión de ventas y relación con clientes.",
    activo: true,
  },
  {
    id: "cg2",
    nombre: "Supervisor de Planta",
    familia: "Operaciones / Producción",
    descripcion: "Supervisión operativa de turnos productivos.",
    activo: true,
  },
  {
    id: "cg3",
    nombre: "Analista Contable",
    familia: "Finanzas y Administración",
    descripcion: "Análisis de balances y registros contables.",
    activo: true,
  },
  {
    id: "cg4",
    nombre: "Desarrollador Backend",
    familia: "Tecnología / IT",
    descripcion: "Diseño e implementación de APIs y microservicios.",
    activo: true,
  },
  {
    id: "cg5",
    nombre: "Enfermera de Planta",
    familia: "Operaciones / Producción",
    descripcion: "Atención de salud ocupacional en faenas productivas.",
    activo: true,
  },
  {
    id: "cg6",
    nombre: "Jefe de Sucursal",
    familia: "Ventas / Comercial",
    descripcion: "Liderazgo de equipo comercial de sucursal.",
    activo: true,
  },
  {
    id: "cg7",
    nombre: "Ingeniera de Datos",
    familia: "Tecnología / IT",
    descripcion: "Modelado de pipelines y analítica de datos corporativos.",
    activo: true,
  },
  {
    id: "cg8",
    nombre: "Operador Logístico",
    familia: "Operaciones / Producción",
    descripcion: "Gestión de despacho y almacenamiento de insumos.",
    activo: true,
  },
  {
    id: "cg9",
    nombre: "Asistente Administrativa",
    familia: "Finanzas y Administración",
    descripcion: "Apoyo documental y gestión de archivos.",
    activo: true,
  },
  {
    id: "cg10",
    nombre: "Técnico en Mantenimiento",
    familia: "Operaciones / Producción",
    descripcion: "Mantenimiento preventivo y correctivo de maquinarias.",
    activo: true,
  },
  {
    id: "cg11",
    nombre: "Ejecutiva de Cuentas",
    familia: "Ventas / Comercial",
    descripcion: "Fidelización de cartera corporativa de clientes.",
    activo: true,
  },
  {
    id: "cg12",
    nombre: "Soporte TI",
    familia: "Tecnología / IT",
    descripcion: "Atención a usuarios internos y soporte de sistemas.",
    activo: true,
  },
];

export const PSICOLOGOS = [
  "Ps. Camila Rojas",
  "Ps. Andrés Miranda",
  "Ps. Valentina Soto",
  "Ps. Ignacio Fuentes",
];

export const PREGUNTAS_POR_FAMILIA: Record<FamiliaCargo, string[]> = {
  "Ventas / Comercial": [
    "Describa una negociación difícil y cómo la resolvió.",
    "¿Cómo maneja el rechazo reiterado de clientes?",
    "¿Qué estrategias usa para cumplir metas comerciales exigentes?",
    "Relate una situación donde superó una meta trimestral.",
  ],
  "Operaciones / Producción": [
    "¿Cómo reacciona ante una falla crítica en el turno?",
    "Describa su forma de coordinar equipos bajo presión.",
    "¿Qué medidas de seguridad prioriza en su labor diaria?",
    "Relate un error operativo y el aprendizaje obtenido.",
  ],
  "Finanzas y Administración": [
    "¿Cómo organiza tareas cuando hay plazos superpuestos?",
    "Describa su nivel de rigurosidad con la documentación.",
    "¿Cómo actúa frente a una inconsistencia en registros?",
    "Relate una mejora de proceso que haya propuesto.",
  ],
  "Tecnología / IT": [
    "¿Cómo aborda un incidente en producción?",
    "Describa su forma de trabajar en equipos ágiles.",
    "¿Cómo mantiene actualizado su conocimiento técnico?",
    "Relate un conflicto técnico y cómo llegó a acuerdo.",
  ],
  "Recursos Humanos": [
    "¿Cómo aborda un proceso de reclutamiento masivo?",
    "Describa cómo maneja un conflicto entre miembros de un equipo.",
    "¿Qué indicadores usa para medir el clima laboral?",
    "Relate una capacitación que haya diseñado o coordinado.",
  ],
  "Calidad y Medio Ambiente": [
    "¿Cómo maneja una no conformidad detectada en terreno?",
    "Describa su experiencia con auditorías internas o normas ISO.",
    "¿Qué controles aplica para prevenir impactos ambientales?",
    "Relate una mejora ambiental que haya implementado.",
  ],
};

export function evaluacionVacia(): Evaluacion {
  return {
    fechaEntrevista: "",
    conclusiones: "",
    dictamen: "",
    preguntasUsadas: {},
    notasPregunta: {},
  };
}

export function formatearFecha(iso: string) {
  if (!iso) return "—";
  const [a, m, d] = iso.slice(0, 10).split("-") as [string, string, string];
  return `${d}-${m}-${a}`;
}

const hoy = new Date();
function diasAtras(n: number) {
  const f = new Date(hoy);
  f.setDate(f.getDate() - n);
  return f.toISOString().slice(0, 10);
}

export const CANDIDATOS_INICIALES: Candidato[] = (
  [
    [
      "12.345.678-9",
      "María Fernanda Aguilar",
      "m.aguilar@correo.cl",
      "912345678",
      "Ventas / Comercial",
      "Ejecutiva Comercial",
    ],
    [
      "13.876.221-4",
      "Rodrigo Salinas Pérez",
      "r.salinas@correo.cl",
      "987654321",
      "Operaciones / Producción",
      "Supervisor de Planta",
    ],
    [
      "16.442.908-2",
      "Catalina Núñez Vera",
      "c.nunez@correo.cl",
      "944112233",
      "Finanzas y Administración",
      "Analista Contable",
    ],
    [
      "17.998.334-1",
      "Diego Contreras Lillo",
      "d.contreras@correo.cl",
      "955667788",
      "Tecnología / IT",
      "Desarrollador Backend",
    ],
    [
      "18.221.667-0",
      "Javiera Muñoz Tapia",
      "j.munoz@correo.cl",
      "933221144",
      "Operaciones / Producción",
      "Enfermera de Planta",
    ],
    [
      "15.334.112-8",
      "Sebastián Ortega Ruiz",
      "s.ortega@correo.cl",
      "966554433",
      "Ventas / Comercial",
      "Jefe de Sucursal",
    ],
    [
      "19.554.220-6",
      "Antonia Pizarro Godoy",
      "a.pizarro@correo.cl",
      "977889900",
      "Tecnología / IT",
      "Ingeniera de Datos",
    ],
    [
      "14.002.556-3",
      "Luis Alberto Cárdenas",
      "l.cardenas@correo.cl",
      "922334455",
      "Operaciones / Producción",
      "Operador Logístico",
    ],
    [
      "20.114.998-5",
      "Fernanda Rivas Soto",
      "f.rivas@correo.cl",
      "911223344",
      "Finanzas y Administración",
      "Asistente Administrativa",
    ],
    [
      "16.887.004-7",
      "Matías Herrera Lagos",
      "m.herrera@correo.cl",
      "988776655",
      "Operaciones / Producción",
      "Técnico en Mantenimiento",
    ],
    [
      "13.221.775-k",
      "Paulina Vergara Díaz",
      "p.vergara@correo.cl",
      "999001122",
      "Ventas / Comercial",
      "Ejecutiva de Cuentas",
    ],
    [
      "18.660.331-2",
      "Cristóbal Araya Mella",
      "c.araya@correo.cl",
      "934567890",
      "Tecnología / IT",
      "Soporte TI",
    ],
  ] as const
).map(([rut, nombre, correo, telefono, familia, cargo], i) => ({
  id: `c${i + 1}`,
  rut: rut as string,
  nombre: nombre as string,
  correo: correo as string,
  telefono: telefono as string,
  familia: familia as FamiliaCargo,
  cargo: cargo as string,
  activo: true,
  creado: diasAtras(40 - i * 3),
}));

interface SemillaSolicitud {
  candidatoId: string;
  psicologo: string;
  prioridad: Prioridad;
  dias: number;
  estado: EstadoSolicitud;
  evaluacion?: Partial<Evaluacion>;
}

const semillas: SemillaSolicitud[] = [
  { candidatoId: "c1", psicologo: PSICOLOGOS[0]!, prioridad: "Alta", dias: 2, estado: "Pendiente" },
  {
    candidatoId: "c2",
    psicologo: PSICOLOGOS[1]!,
    prioridad: "Media",
    dias: 4,
    estado: "En proceso",
  },
  {
    candidatoId: "c3",
    psicologo: PSICOLOGOS[2]!,
    prioridad: "Media",
    dias: 12,
    estado: "Finalizada",
    evaluacion: {
      fechaEntrevista: diasAtras(9),
      conclusiones:
        "Candidata con alto orden y rigurosidad. Buen manejo de plazos y comunicación clara con pares.",
      dictamen: "Recomendado",
    },
  },
  { candidatoId: "c4", psicologo: PSICOLOGOS[3]!, prioridad: "Alta", dias: 1, estado: "Pendiente" },
  {
    candidatoId: "c5",
    psicologo: PSICOLOGOS[0]!,
    prioridad: "Alta",
    dias: 15,
    estado: "Finalizada",
    evaluacion: {
      fechaEntrevista: diasAtras(13),
      conclusiones:
        "Muestra adecuada contención emocional; se sugiere acompañamiento inicial en turnos nocturnos.",
      dictamen: "Con observaciones",
    },
  },
  {
    candidatoId: "c6",
    psicologo: PSICOLOGOS[1]!,
    prioridad: "Baja",
    dias: 6,
    estado: "En proceso",
  },
  {
    candidatoId: "c7",
    psicologo: PSICOLOGOS[2]!,
    prioridad: "Media",
    dias: 3,
    estado: "Pendiente",
  },
  {
    candidatoId: "c8",
    psicologo: PSICOLOGOS[3]!,
    prioridad: "Baja",
    dias: 20,
    estado: "Finalizada",
    evaluacion: {
      fechaEntrevista: diasAtras(18),
      conclusiones:
        "Dificultad para sostener ritmo bajo presión y baja tolerancia a la supervisión directa.",
      dictamen: "No recomendado",
    },
  },
  {
    candidatoId: "c9",
    psicologo: PSICOLOGOS[0]!,
    prioridad: "Media",
    dias: 8,
    estado: "En proceso",
  },
  {
    candidatoId: "c11",
    psicologo: PSICOLOGOS[1]!,
    prioridad: "Alta",
    dias: 5,
    estado: "Pendiente",
  },
];

export const SOLICITUDES_INICIALES: Solicitud[] = semillas.map((s, i) => {
  const cand = CANDIDATOS_INICIALES.find((c) => c.id === s.candidatoId)!;
  return {
    id: `s${i + 1}`,
    codigo: `SOL-${String(1001 + i)}`,
    candidatoId: cand.id,
    cargo: cand.cargo,
    familia: cand.familia,
    psicologo: s.psicologo,
    prioridad: s.prioridad,
    fechaSolicitud: diasAtras(s.dias),
    estado: s.estado,
    actualizada: diasAtras(Math.max(0, s.dias - 2)),
    evaluacion: { ...evaluacionVacia(), ...s.evaluacion },
  };
});
