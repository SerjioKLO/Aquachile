package cl.duoc.aquachile.evaluacion.entity;

import com.fasterxml.jackson.annotation.JsonIgnore;
import jakarta.persistence.*;
import lombok.*;
import java.time.LocalDate;
import java.time.LocalDateTime;

@Entity
@Table(name = "evaluaciones")
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class Evaluacion {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @OneToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "solicitud_id", nullable = false, unique = true)
    @JsonIgnore
    private Solicitud solicitud;

    @Column(name = "fecha_entrevista")
    private LocalDate fechaEntrevista;

    @Column(columnDefinition = "TEXT")
    private String conclusiones;

    @Enumerated(EnumType.STRING)
    @Column(length = 30)
    private Dictamen dictamen;

    @Column(name = "preguntas_respondidas", columnDefinition = "JSON")
    private String preguntasRespondidas;

    @Column(name = "creado_en", nullable = false, updatable = false)
    private LocalDateTime creadoEn;

    @Column(name = "actualizado_en", nullable = false)
    private LocalDateTime actualizadoEn;

    @PrePersist
    protected void onCreate() {
        LocalDateTime now = LocalDateTime.now();
        if (this.creadoEn == null) this.creadoEn = now;
        if (this.actualizadoEn == null) this.actualizadoEn = now;
    }

    @PreUpdate
    protected void onUpdate() {
        this.actualizadoEn = LocalDateTime.now();
    }
}
