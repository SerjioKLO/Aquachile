import { createFileRoute } from "@tanstack/react-router";
import { SolicitudesPage } from "@/pages/SolicitudesPage";

export const Route = createFileRoute("/solicitudes/")({
  head: () => ({
    meta: [
      { title: "Solicitudes de evaluación | Evaluación Psicolaboral" },
      {
        name: "description",
        content:
          "Filtre solicitudes de evaluación psicológica por estado, familia de cargo y rango de fechas.",
      },
      { property: "og:title", content: "Solicitudes de evaluación | Evaluación Psicolaboral" },
      {
        property: "og:description",
        content: "Seguimiento de solicitudes asignadas a psicólogos evaluadores.",
      },
    ],
  }),
  component: SolicitudesPage,
});
