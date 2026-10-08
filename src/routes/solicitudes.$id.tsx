import { createFileRoute } from "@tanstack/react-router";
import { DetalleSolicitudPage } from "@/pages/DetalleSolicitudPage";

export const Route = createFileRoute("/solicitudes/$id")({
  head: () => ({
    meta: [
      { title: "Detalle de evaluación | Evaluación Psicolaboral" },
      {
        name: "description",
        content:
          "Ficha de evaluación psicológica: flujo de estados, conclusiones clínicas y dictamen del postulante.",
      },
      { property: "og:title", content: "Detalle de evaluación | Evaluación Psicolaboral" },
      {
        property: "og:description",
        content: "Registre entrevista, conclusiones y dictamen del candidato evaluado.",
      },
    ],
  }),
  component: SolicitudDetalleRoute,
});

function SolicitudDetalleRoute() {
  const { id } = Route.useParams();
  return <DetalleSolicitudPage id={id} />;
}
