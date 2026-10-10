package cl.duoc.aquachile.evaluacion.dto;

import lombok.*;

@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class EvaluacionDTO {
    private Long id;
    private String fechaEntrevista;
    private String conclusiones;
    private String dictamen;
    private String preguntasRespondidas;
}
