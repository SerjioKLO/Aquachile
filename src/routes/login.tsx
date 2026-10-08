import { createFileRoute } from "@tanstack/react-router";
import { LoginPage } from "@/pages/LoginPage";

export const Route = createFileRoute("/login")({
  head: () => ({
    meta: [
      { title: "Ingreso | Sistema de Evaluación Psicolaboral" },
      {
        name: "description",
        content:
          "Acceda al sistema de gestión de selección y evaluación psicológica de candidatos seleccionando su rol.",
      },
      { property: "og:title", content: "Ingreso | Sistema de Evaluación Psicolaboral" },
      {
        property: "og:description",
        content: "Gestione candidatos, solicitudes y evaluaciones psicolaborales en un solo lugar.",
      },
    ],
  }),
  component: LoginPage,
});
