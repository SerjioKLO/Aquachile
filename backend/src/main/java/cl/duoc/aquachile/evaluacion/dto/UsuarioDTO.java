package cl.duoc.aquachile.evaluacion.dto;

import lombok.*;

@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class UsuarioDTO {
    private Long id;
    private String username;
    private String nombreCompleto;
    private String rolCodigo;
    private String rolNombre;
}
