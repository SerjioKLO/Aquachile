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
const hoy = /* @__PURE__ */ new Date();
function diasAtras(n) {
  const f = new Date(hoy);
  f.setDate(f.getDate() - n);
  return f.toISOString().slice(0, 10);
}
export const CANDIDATOS_INICIALES = [
  [
    "12.345.678-9",
    "Mar\xEDa Fernanda Aguilar",
    "m.aguilar@correo.cl",
    "912345678",
    "Ventas / Comercial",
    "Ejecutiva Comercial"
  ],
  [
    "13.876.221-4",
    "Rodrigo Salinas P\xE9rez",
    "r.salinas@correo.cl",
    "987654321",
    "Operaciones / Producci\xF3n",
    "Supervisor de Planta"
  ],
  [
    "16.442.908-2",
    "Catalina N\xFA\xF1ez Vera",
    "c.nunez@correo.cl",
    "944112233",
    "Finanzas y Administraci\xF3n",
    "Analista Contable"
  ],
  [
    "17.998.334-1",
    "Diego Contreras Lillo",
    "d.contreras@correo.cl",
    "955667788",
    "Tecnolog\xEDa / IT",
    "Desarrollador Backend"
  ],
  [
    "18.221.667-0",
    "Javiera Mu\xF1oz Tapia",
    "j.munoz@correo.cl",
    "933221144",
    "Operaciones / Producci\xF3n",
    "Enfermera de Planta"
  ],
  [
    "15.334.112-8",
    "Sebasti\xE1n Ortega Ruiz",
    "s.ortega@correo.cl",
    "966554433",
    "Ventas / Comercial",
    "Jefe de Sucursal"
  ],
  [
    "19.554.220-6",
    "Antonia Pizarro Godoy",
    "a.pizarro@correo.cl",
    "977889900",
    "Tecnolog\xEDa / IT",
    "Ingeniera de Datos"
  ],
  [
    "14.002.556-3",
    "Luis Alberto C\xE1rdenas",
    "l.cardenas@correo.cl",
    "922334455",
    "Operaciones / Producci\xF3n",
    "Operador Log\xEDstico"
  ],
  [
    "20.114.998-5",
    "Fernanda Rivas Soto",
    "f.rivas@correo.cl",
    "911223344",
    "Finanzas y Administraci\xF3n",
    "Asistente Administrativa"
  ],
  [
    "16.887.004-7",
    "Mat\xEDas Herrera Lagos",
    "m.herrera@correo.cl",
    "988776655",
    "Operaciones / Producci\xF3n",
    "T\xE9cnico en Mantenimiento"
  ],
  [
    "13.221.775-k",
    "Paulina Vergara D\xEDaz",
    "p.vergara@correo.cl",
    "999001122",
    "Ventas / Comercial",
    "Ejecutiva de Cuentas"
  ],
  [
    "18.660.331-2",
    "Crist\xF3bal Araya Mella",
    "c.araya@correo.cl",
    "934567890",
    "Tecnolog\xEDa / IT",
    "Soporte TI"
  ]
].map(([rut, nombre, correo, telefono, familia, cargo], i) => ({
  id: `c${i + 1}`,
  rut,
  nombre,
  correo,
  telefono,
  familia,
  cargo,
  activo: true,
  creado: diasAtras(40 - i * 3)
}));
const semillas = [
  { candidatoId: "c1", psicologo: PSICOLOGOS[0], prioridad: "Alta", dias: 2, estado: "Pendiente" },
  {
    candidatoId: "c2",
    psicologo: PSICOLOGOS[1],
    prioridad: "Media",
    dias: 4,
    estado: "En proceso"
  },
  {
    candidatoId: "c3",
    psicologo: PSICOLOGOS[2],
    prioridad: "Media",
    dias: 12,
    estado: "Finalizada",
    evaluacion: {
      fechaEntrevista: diasAtras(9),
      conclusiones: "Candidata con alto orden y rigurosidad. Buen manejo de plazos y comunicaci\xF3n clara con pares.",
      dictamen: "Recomendado"
    }
  },
  { candidatoId: "c4", psicologo: PSICOLOGOS[3], prioridad: "Alta", dias: 1, estado: "Pendiente" },
  {
    candidatoId: "c5",
    psicologo: PSICOLOGOS[0],
    prioridad: "Alta",
    dias: 15,
    estado: "Finalizada",
    evaluacion: {
      fechaEntrevista: diasAtras(13),
      conclusiones: "Muestra adecuada contenci\xF3n emocional; se sugiere acompa\xF1amiento inicial en turnos nocturnos.",
      dictamen: "Con observaciones"
    }
  },
  {
    candidatoId: "c6",
    psicologo: PSICOLOGOS[1],
    prioridad: "Baja",
    dias: 6,
    estado: "En proceso"
  },
  {
    candidatoId: "c7",
    psicologo: PSICOLOGOS[2],
    prioridad: "Media",
    dias: 3,
    estado: "Pendiente"
  },
  {
    candidatoId: "c8",
    psicologo: PSICOLOGOS[3],
    prioridad: "Baja",
    dias: 20,
    estado: "Finalizada",
    evaluacion: {
      fechaEntrevista: diasAtras(18),
      conclusiones: "Dificultad para sostener ritmo bajo presi\xF3n y baja tolerancia a la supervisi\xF3n directa.",
      dictamen: "No recomendado"
    }
  },
  {
    candidatoId: "c9",
    psicologo: PSICOLOGOS[0],
    prioridad: "Media",
    dias: 8,
    estado: "En proceso"
  },
  {
    candidatoId: "c11",
    psicologo: PSICOLOGOS[1],
    prioridad: "Alta",
    dias: 5,
    estado: "Pendiente"
  }
];
export const SOLICITUDES_INICIALES = semillas.map((s, i) => {
  const cand = CANDIDATOS_INICIALES.find((c) => c.id === s.candidatoId);
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
    evaluacion: { ...evaluacionVacia(), ...s.evaluacion }
  };
});
