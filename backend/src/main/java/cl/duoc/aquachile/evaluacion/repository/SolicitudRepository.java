package cl.duoc.aquachile.evaluacion.repository;

import cl.duoc.aquachile.evaluacion.entity.EstadoSolicitud;
import cl.duoc.aquachile.evaluacion.entity.Solicitud;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.time.LocalDate;
import java.util.List;
import java.util.Optional;

@Repository
public interface SolicitudRepository extends JpaRepository<Solicitud, Long> {

    Optional<Solicitud> findByCodigo(String codigo);

    List<Solicitud> findAllByOrderByFechaSolicitudDesc();

    List<Solicitud> findTop6ByOrderByActualizadoEnDesc();

    long countByEstado(EstadoSolicitud estado);

    @Query("SELECT s FROM Solicitud s WHERE " +
           "(:estado IS NULL OR s.estado = :estado) AND " +
           "(:familiaId IS NULL OR s.cargo.familia.id = :familiaId) AND " +
           "(:desde IS NULL OR s.fechaSolicitud >= :desde) AND " +
           "(:hasta IS NULL OR s.fechaSolicitud <= :hasta) AND " +
           "(:candidatoBusqueda IS NULL OR :candidatoBusqueda = '' OR " +
           " LOWER(s.candidato.nombre) LIKE LOWER(CONCAT('%', :candidatoBusqueda, '%')) OR " +
           " LOWER(s.candidato.rut) LIKE LOWER(CONCAT('%', :candidatoBusqueda, '%'))) AND " +
           "(:cargoBusqueda IS NULL OR :cargoBusqueda = '' OR " +
           " LOWER(s.cargo.nombre) LIKE LOWER(CONCAT('%', :cargoBusqueda, '%'))) " +
           "ORDER BY s.fechaSolicitud DESC")
    List<Solicitud> buscarConFiltros(
            @Param("estado") EstadoSolicitud estado,
            @Param("familiaId") Long familiaId,
            @Param("desde") LocalDate desde,
            @Param("hasta") LocalDate hasta,
            @Param("candidatoBusqueda") String candidatoBusqueda,
            @Param("cargoBusqueda") String cargoBusqueda
    );
}
