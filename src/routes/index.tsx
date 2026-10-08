import { createFileRoute } from "@tanstack/react-router";
import { PostulacionPage } from "@/pages/PostulacionPage";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "Postulación de Empleo | AquaChile" },
      {
        name: "description",
        content:
          "Completa el formulario de postulación de empleo de AquaChile: tus datos, la familia del cargo y tu currículum.",
      },
      { property: "og:title", content: "Postulación de Empleo | AquaChile" },
      {
        property: "og:description",
        content: "Postula a las vacantes de AquaChile: completa tus datos y adjunta tu CV.",
      },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: PostulacionPage,
});
