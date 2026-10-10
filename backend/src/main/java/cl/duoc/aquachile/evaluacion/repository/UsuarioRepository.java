package cl.duoc.aquachile.evaluacion.repository;

import cl.duoc.aquachile.evaluacion.entity.Usuario;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
public interface UsuarioRepository extends JpaRepository<Usuario, Long> {
    Optional<Usuario> findByUsername(String username);
    List<Usuario> findByRolCodigo(String rolCodigo);
    List<Usuario> findByActivoTrue();
}
