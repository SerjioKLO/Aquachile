package cl.duoc.aquachile.evaluacion.entity;

import jakarta.persistence.*;
import lombok.*;
import java.time.LocalDate;
import java.time.LocalDateTime;

@Entity
@Table(name = "solicitudes")
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class Solicitud {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(nullable = false, unique = true, length = 20)
    private String codigo;

    @ManyToOne(fetch = FetchType.EAGER, optional = false)
    @JoinColumn(name = "candidato_id", nullable = false)
    private Candidato candidato;

    @ManyToOne(fetch = FetchType.EAGER, optional = false)
    @JoinColumn(name = "cargo_id", nullable = false)
    private Cargo cargo;

    @ManyToOne(fetch = FetchType.EAGER)
    @JoinColumn(name = "responsable_id")
    private Usuario responsable;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false, length = 10)
    @Builder.Default
    private Prioridad prioridad = Prioridad.MEDIA;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false, length = 20)
    @Builder.Default
    private EstadoSolicitud estado = EstadoSolicitud.PENDIENTE;

    @Column(name = "fecha_solicitud", nullable = false)
    private LocalDate fechaSolicitud;

    @OneToOne(mappedBy = "solicitud", cascade = CascadeType.ALL, orphanRemoval = true, fetch = FetchType.EAGER)
    private Evaluacion evaluacion;

    @Column(name = "creado_en", nullable = false, updatable = false)
    private LocalDateTime creadoEn;

    @Column(name = "actualizado_en", nullable = false)
    private LocalDateTime actualizadoEn;

    @PrePersist
    protected void onCreate() {
        LocalDateTime now = LocalDateTime.now();
        if (this.creadoEn == null) this.creadoEn = now;
        if (this.actualizadoEn == null) this.actualizadoEn = now;
        if (this.fechaSolicitud == null) this.fechaSolicitud = LocalDate.now();
        if (this.prioridad == null) this.prioridad = Prioridad.MEDIA;
        if (this.estado == null) this.estado = EstadoSolicitud.PENDIENTE;
    }

    @PreUpdate
    protected void onUpdate() {
        this.actualizadoEn = LocalDateTime.now();
    }
}
