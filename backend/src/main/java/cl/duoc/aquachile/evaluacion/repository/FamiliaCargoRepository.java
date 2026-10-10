package cl.duoc.aquachile.evaluacion.repository;

import cl.duoc.aquachile.evaluacion.entity.FamiliaCargo;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
public interface FamiliaCargoRepository extends JpaRepository<FamiliaCargo, Long> {
    Optional<FamiliaCargo> findByNombre(String nombre);
    List<FamiliaCargo> findByActivoTrue();
}
