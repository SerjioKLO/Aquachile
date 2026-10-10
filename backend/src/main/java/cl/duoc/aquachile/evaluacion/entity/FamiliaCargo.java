package cl.duoc.aquachile.evaluacion.entity;

import jakarta.persistence.*;
import lombok.*;

@Entity
@Table(name = "familias_cargo")
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class FamiliaCargo {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(nullable = false, unique = true, length = 80)
    private String nombre;

    @Column(columnDefinition = "TEXT")
    private String descripcion;

    @Builder.Default
    @Column(nullable = false)
    private Boolean activo = true;
}
