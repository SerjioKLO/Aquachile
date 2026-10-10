package cl.duoc.aquachile.evaluacion.repository;

import cl.duoc.aquachile.evaluacion.entity.Candidato;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
public interface CandidatoRepository extends JpaRepository<Candidato, Long> {

    Optional<Candidato> findByRut(String rut);

    List<Candidato> findByActivoTrueOrderByCreadoEnDesc();

    @Query("SELECT c FROM Candidato c WHERE c.activo = true AND " +
           "(:busqueda IS NULL OR :busqueda = '' OR " +
           " LOWER(c.nombre) LIKE LOWER(CONCAT('%', :busqueda, '%')) OR " +
           " LOWER(c.rut) LIKE LOWER(CONCAT('%', :busqueda, '%'))) AND " +
           "(:familiaId IS NULL OR c.cargo.familia.id = :familiaId)")
    List<Candidato> buscarConFiltros(@Param("busqueda") String busqueda, @Param("familiaId") Long familiaId);
}
