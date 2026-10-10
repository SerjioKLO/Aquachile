package cl.duoc.aquachile.evaluacion.repository;

import cl.duoc.aquachile.evaluacion.entity.Evaluacion;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.Optional;

@Repository
public interface EvaluacionRepository extends JpaRepository<Evaluacion, Long> {
    Optional<Evaluacion> findBySolicitudId(Long solicitudId);
}
