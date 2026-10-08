import { createFileRoute } from "@tanstack/react-router";
import { CandidatosPage } from "@/pages/CandidatosPage";

export const Route = createFileRoute("/candidatos")({
  head: () => ({
    meta: [
      { title: "Candidatos | Evaluación Psicolaboral" },
      {
        name: "description",
        content:
          "Registro y búsqueda de candidatos por nombre y familia de cargo, con edición y validaciones.",
      },
      { property: "og:title", content: "Candidatos | Evaluación Psicolaboral" },
      {
        property: "og:description",
        content: "Administre la base de postulantes del proceso de selección psicolaboral.",
      },
    ],
  }),
  component: CandidatosPage,
});
