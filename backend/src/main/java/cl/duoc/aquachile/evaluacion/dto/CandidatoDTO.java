package cl.duoc.aquachile.evaluacion.dto;

import jakarta.validation.constraints.Email;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;
import lombok.*;

@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class CandidatoDTO {
    private Long id;
    private Long cargoId;
    private String cargoNombre;
    private String familiaNombre;
    
    @NotBlank(message = "El RUT es obligatorio")
    private String rut;
    
    @NotBlank(message = "El nombre es obligatorio")
    @Size(min = 5, message = "El nombre debe tener al menos 5 caracteres")
    private String nombre;
    
    @NotBlank(message = "El correo es obligatorio")
    @Email(message = "El correo debe tener un formato válido")
    private String correo;
    
    @NotBlank(message = "El teléfono es obligatorio")
    private String telefono;
    
    private Boolean activo;
    private String creadoEn;
}
