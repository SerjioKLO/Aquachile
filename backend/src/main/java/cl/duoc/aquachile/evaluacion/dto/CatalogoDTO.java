package cl.duoc.aquachile.evaluacion.dto;

import lombok.*;
import java.util.List;

@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class CatalogoDTO {

    @Data
    @NoArgsConstructor
    @AllArgsConstructor
    @Builder
    public static class FamiliaItemDTO {
        private Long id;
        private String nombre;
        private String descripcion;
    }

    @Data
    @NoArgsConstructor
    @AllArgsConstructor
    @Builder
    public static class CargoItemDTO {
        private Long id;
        private Long familiaId;
        private String familiaNombre;
        private String nombre;
        private String descripcion;
    }

    @Data
    @NoArgsConstructor
    @AllArgsConstructor
    @Builder
    public static class EvaluadorItemDTO {
        private Long id;
        private String nombreCompleto;
        private String username;
    }

    private List<FamiliaItemDTO> familias;
    private List<CargoItemDTO> cargos;
    private List<EvaluadorItemDTO> evaluadores;
}
