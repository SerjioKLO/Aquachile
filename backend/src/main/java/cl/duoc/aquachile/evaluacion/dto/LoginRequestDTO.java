package cl.duoc.aquachile.evaluacion.dto;

import jakarta.validation.constraints.NotBlank;
import lombok.*;

@Data
@NoArgsConstructor
@AllArgsConstructor
public class LoginRequestDTO {
    @NotBlank(message = "El usuario es obligatorio")
    private String usuario;
    
    @NotBlank(message = "La clave es obligatoria")
    private String clave;
}
