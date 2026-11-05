export const ROLES = [
  {
    id: "analista",
    nombre: "Analista de Reclutamiento",
    descripcion: "Registra candidatos y genera solicitudes de evaluaci\xF3n."
  },
  {
    id: "evaluador",
    nombre: "Profesional Evaluador",
    descripcion: "Realiza las entrevistas y registra dict\xE1menes cl\xEDnicos."
  },
  {
    id: "admin",
    nombre: "Administrador Acad\xE9mico",
    descripcion: "Gestiona usuarios simulados, cat\xE1logos de cargos y restablecimiento de datos."
  },
  {
    id: "jefatura",
    nombre: "Jefatura o Contraparte Simulada",
    descripcion: "Visualiza dashboard gerencial e indicadores en modo de solo lectura."
  }
];
export const USUARIOS = [
  { usuario: "analista", clave: "1234", rol: "analista", nombre: "Ps. Camila Rojas" },
  { usuario: "evaluador", clave: "1234", rol: "evaluador", nombre: "Ps. Andr\xE9s Miranda" },
  { usuario: "admin", clave: "1234", rol: "admin", nombre: "Administrador Duoc UC" },
  { usuario: "jefatura", clave: "1234", rol: "jefatura", nombre: "Marcelo Cris\xF3stomo (Jefatura)" }
];
export const PERMISOS_POR_ROL = {
  analista: [
    "ver_panel",
    "ver_candidatos",
    "editar_candidatos",
    "ver_solicitudes",
    "crear_solicitudes"
  ],
  evaluador: ["ver_panel", "ver_candidatos", "ver_solicitudes", "evaluar"],
  admin: [
    "ver_panel",
    "ver_candidatos",
    "editar_candidatos",
    "ver_solicitudes",
    "crear_solicitudes",
    "evaluar",
    "administrar"
  ],
  jefatura: ["ver_panel", "ver_candidatos", "ver_solicitudes"]
};
export const FAMILIAS = [
  "Operaciones / Producci\xF3n",
  "Tecnolog\xEDa / IT",
  "Ventas / Comercial",
  "Recursos Humanos",
  "Calidad y Medio Ambiente",
  "Finanzas y Administraci\xF3n"
];
export const ESTADOS = ["Pendiente", "En proceso", "Finalizada"];
export const DICTAMENES = ["Recomendado", "Con observaciones", "No recomendado"];
export const CARGOS_INICIALES = [
  {
    id: "cg1",
    nombre: "Ejecutiva Comercial",
    familia: "Ventas / Comercial",
    descripcion: "Gesti\xF3n de ventas y relaci\xF3n con clientes.",
    activo: true
  },
  {
    id: "cg2",
    nombre: "Supervisor de Planta",
    familia: "Operaciones / Producci\xF3n",
    descripcion: "Supervisi\xF3n operativa de turnos productivos.",
    activo: true
  },
  {
    id: "cg3",
    nombre: "Analista Contable",
    familia: "Finanzas y Administraci\xF3n",
    descripcion: "An\xE1lisis de balances y registros contables.",
    activo: true
  },
  {
    id: "cg4",
    nombre: "Desarrollador Backend",
    familia: "Tecnolog\xEDa / IT",
    descripcion: "Dise\xF1o e implementaci\xF3n de APIs y microservicios.",
    activo: true
  },
  {
    id: "cg5",
    nombre: "Enfermera de Planta",
    familia: "Operaciones / Producci\xF3n",
    descripcion: "Atenci\xF3n de salud ocupacional en faenas productivas.",
    activo: true
  },
  {
    id: "cg6",
    nombre: "Jefe de Sucursal",
    familia: "Ventas / Comercial",
    descripcion: "Liderazgo de equipo comercial de sucursal.",
    activo: true
  },
  {
    id: "cg7",
    nombre: "Ingeniera de Datos",
    familia: "Tecnolog\xEDa / IT",
    descripcion: "Modelado de pipelines y anal\xEDtica de datos corporativos.",
    activo: true
  },
  {
    id: "cg8",
    nombre: "Operador Log\xEDstico",
    familia: "Operaciones / Producci\xF3n",
    descripcion: "Gesti\xF3n de despacho y almacenamiento de insumos.",
    activo: true
  },
  {
    id: "cg9",
    nombre: "Asistente Administrativa",
    familia: "Finanzas y Administraci\xF3n",
    descripcion: "Apoyo documental y gesti\xF3n de archivos.",
    activo: true
  },
  {
    id: "cg10",
    nombre: "T\xE9cnico en Mantenimiento",
    familia: "Operaciones / Producci\xF3n",
    descripcion: "Mantenimiento preventivo y correctivo de maquinarias.",
    activo: true
  },
  {
    id: "cg11",
    nombre: "Ejecutiva de Cuentas",
    familia: "Ventas / Comercial",
    descripcion: "Fidelizaci\xF3n de cartera corporativa de clientes.",
    activo: true
  },
  {
    id: "cg12",
    nombre: "Soporte TI",
    familia: "Tecnolog\xEDa / IT",
    descripcion: "Atenci\xF3n a usuarios internos y soporte de sistemas.",
    activo: true
  }
];
export const PSICOLOGOS = [
  "Ps. Camila Rojas",
  "Ps. Andr\xE9s Miranda",
  "Ps. Valentina Soto",
  "Ps. Ignacio Fuentes"
];
export const PREGUNTAS_POR_FAMILIA = {
  "Ventas / Comercial": [
    "Describa una negociaci\xF3n dif\xEDcil y c\xF3mo la resolvi\xF3.",
    "\xBFC\xF3mo maneja el rechazo reiterado de clientes?",
    "\xBFQu\xE9 estrategias usa para cumplir metas comerciales exigentes?",
    "Relate una situaci\xF3n donde super\xF3 una meta trimestral."
  ],
  "Operaciones / Producci\xF3n": [
    "\xBFC\xF3mo reacciona ante una falla cr\xEDtica en el turno?",
    "Describa su forma de coordinar equipos bajo presi\xF3n.",
    "\xBFQu\xE9 medidas de seguridad prioriza en su labor diaria?",
    "Relate un error operativo y el aprendizaje obtenido."
  ],
  "Finanzas y Administraci\xF3n": [
    "\xBFC\xF3mo organiza tareas cuando hay plazos superpuestos?",
    "Describa su nivel de rigurosidad con la documentaci\xF3n.",
    "\xBFC\xF3mo act\xFAa frente a una inconsistencia en registros?",
    "Relate una mejora de proceso que haya propuesto."
  ],
  "Tecnolog\xEDa / IT": [
    "\xBFC\xF3mo aborda un incidente en producci\xF3n?",
    "Describa su forma de trabajar en equipos \xE1giles.",
    "\xBFC\xF3mo mantiene actualizado su conocimiento t\xE9cnico?",
    "Relate un conflicto t\xE9cnico y c\xF3mo lleg\xF3 a acuerdo."
  ],
  "Recursos Humanos": [
    "\xBFC\xF3mo aborda un proceso de reclutamiento masivo?",
    "Describa c\xF3mo maneja un conflicto entre miembros de un equipo.",
    "\xBFQu\xE9 indicadores usa para medir el clima laboral?",
    "Relate una capacitaci\xF3n que haya dise\xF1ado o coordinado."
  ],
  "Calidad y Medio Ambiente": [
    "\xBFC\xF3mo maneja una no conformidad detectada en terreno?",
    "Describa su experiencia con auditor\xEDas internas o normas ISO.",
    "\xBFQu\xE9 controles aplica para prevenir impactos ambientales?",
    "Relate una mejora ambiental que haya implementado."
  ]
};
export function evaluacionVacia() {
  return {
    fechaEntrevista: "",
    conclusiones: "",
    dictamen: "",
    preguntasUsadas: {},
    notasPregunta: {}
  };
}
export function formatearFecha(iso) {
  if (!iso) return "\u2014";
  const [a, m, d] = iso.slice(0, 10).split("-");
  return `${d}-${m}-${a}`;
}
export const CANDIDATOS_INICIALES = [];
export const SOLICITUDES_INICIALES = [];
