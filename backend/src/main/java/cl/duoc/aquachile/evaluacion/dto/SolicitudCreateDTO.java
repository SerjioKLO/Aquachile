package cl.duoc.aquachile.evaluacion.dto;

import jakarta.validation.constraints.NotNull;
import lombok.*;

@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class SolicitudCreateDTO {
    @NotNull(message = "El ID del candidato es obligatorio")
    private Long candidatoId;
    
    private Long cargoId;
    private String cargoNombre;
    private Long responsableId;
    private String psicologoNombre;
    private String prioridad;
    private String fechaSolicitud;
}
