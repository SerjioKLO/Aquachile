package cl.duoc.aquachile.evaluacion.service;

import cl.duoc.aquachile.evaluacion.dto.LoginRequestDTO;
import cl.duoc.aquachile.evaluacion.dto.UsuarioDTO;
import cl.duoc.aquachile.evaluacion.entity.Usuario;
import cl.duoc.aquachile.evaluacion.exception.BadRequestException;
import cl.duoc.aquachile.evaluacion.repository.UsuarioRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
@RequiredArgsConstructor
public class AuthService {

    private final UsuarioRepository usuarioRepo;

    @Transactional(readOnly = true)
    public UsuarioDTO login(LoginRequestDTO request) {
        String username = request.getUsuario().trim().toLowerCase();
        Usuario usuario = usuarioRepo.findByUsername(username)
                .orElseThrow(() -> new BadRequestException("Usuario o contraseña incorrectos"));

        if (!usuario.getPasswordHash().equals(request.getClave())) {
            throw new BadRequestException("Usuario o contraseña incorrectos");
        }

        if (!Boolean.TRUE.equals(usuario.getActivo())) {
            throw new BadRequestException("El usuario se encuentra inactivo");
        }

        return UsuarioDTO.builder()
                .id(usuario.getId())
                .username(usuario.getUsername())
                .nombreCompleto(usuario.getNombreCompleto())
                .rolCodigo(usuario.getRol().getCodigo())
                .rolNombre(usuario.getRol().getNombre())
                .build();
    }
}
