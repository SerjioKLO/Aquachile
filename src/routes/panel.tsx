import { createFileRoute } from "@tanstack/react-router";
import { PanelPage } from "@/pages/PanelPage";

export const Route = createFileRoute("/panel")({
  head: () => ({
    meta: [
      { title: "Panel principal | Evaluación Psicolaboral" },
      {
        name: "description",
        content:
          "Indicadores de candidatos y evaluaciones psicolaborales: pendientes, en proceso y finalizadas.",
      },
      { property: "og:title", content: "Panel principal | Evaluación Psicolaboral" },
      {
        property: "og:description",
        content:
          "Resumen de candidatos, solicitudes y actividad reciente del proceso de selección.",
      },
    ],
  }),
  component: PanelPage,
});
