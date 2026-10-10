package cl.duoc.aquachile.evaluacion.dto;

import lombok.*;

@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class SolicitudDTO {
    private Long id;
    private String codigo;
    private Long candidatoId;
    private String candidatoNombre;
    private String candidatoRut;
    private Long cargoId;
    private String cargoNombre;
    private String familiaNombre;
    private Long responsableId;
    private String responsableNombre;
    private String prioridad;
    private String estado;
    private String fechaSolicitud;
    private String actualizada;
    private EvaluacionDTO evaluacion;
}
