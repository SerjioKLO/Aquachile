import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { Loader2 } from "lucide-react";

/**
 * Modal de confirmación reutilizable para eliminar un candidato.
 *
 * Props:
 *  - open: boolean — controla si el diálogo está visible.
 *  - onOpenChange: (open: boolean) => void — callback para cerrar el diálogo.
 *  - candidato: { nombre: string, rut: string } — datos del candidato a eliminar.
 *  - onConfirm: () => void — callback ejecutado al confirmar la eliminación.
 *  - loading: boolean — muestra estado de carga y deshabilita botones.
 */
export function ConfirmarEliminarCandidatoDialog({
  open,
  onOpenChange,
  candidato,
  onConfirm,
  loading,
}) {
  return (
    <AlertDialog open={open} onOpenChange={onOpenChange}>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>¿Eliminar candidato?</AlertDialogTitle>
          <AlertDialogDescription asChild>
            <div>
              Esta acción eliminará permanentemente a{" "}
              <strong>{candidato?.nombre}</strong>
              {candidato?.rut ? ` (RUT: ${candidato.rut})` : ""}, su currículum
              adjunto del almacenamiento y todas sus solicitudes de evaluación
              asociadas.{" "}
              <span className="font-semibold text-destructive">
                Esta acción no se puede deshacer.
              </span>
            </div>
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel disabled={loading}>Cancelar</AlertDialogCancel>
          <AlertDialogAction
            onClick={(e) => {
              e.preventDefault();
              onConfirm();
            }}
            disabled={loading}
            className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
          >
            {loading ? (
              <>
                <Loader2 className="size-4 animate-spin mr-2" />
                Eliminando…
              </>
            ) : (
              "Sí, eliminar candidato"
            )}
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}
