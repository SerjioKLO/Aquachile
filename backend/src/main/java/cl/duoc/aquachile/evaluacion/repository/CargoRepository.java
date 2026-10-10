package cl.duoc.aquachile.evaluacion.repository;

import cl.duoc.aquachile.evaluacion.entity.Cargo;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
public interface CargoRepository extends JpaRepository<Cargo, Long> {
    Optional<Cargo> findByNombre(String nombre);
    List<Cargo> findByFamiliaIdAndActivoTrue(Long familiaId);
    List<Cargo> findByActivoTrue();
}
