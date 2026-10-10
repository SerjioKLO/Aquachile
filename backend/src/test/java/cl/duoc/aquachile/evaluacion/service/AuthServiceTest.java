package cl.duoc.aquachile.evaluacion.service;

import cl.duoc.aquachile.evaluacion.dto.LoginRequestDTO;
import cl.duoc.aquachile.evaluacion.dto.UsuarioDTO;
import cl.duoc.aquachile.evaluacion.entity.Rol;
import cl.duoc.aquachile.evaluacion.entity.Usuario;
import cl.duoc.aquachile.evaluacion.exception.BadRequestException;
import cl.duoc.aquachile.evaluacion.repository.UsuarioRepository;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

import java.util.Optional;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.Mockito.*;

@ExtendWith(MockitoExtension.class)
class AuthServiceTest {

    @Mock
    private UsuarioRepository usuarioRepo;

    @InjectMocks
    private AuthService authService;

    private Usuario usuario;

    @BeforeEach
    void setUp() {
        Rol rol = Rol.builder().id(1L).codigo("ANALISTA_RECLUTAMIENTO").nombre("Analista de Reclutamiento").build();
        usuario = Usuario.builder()
                .id(1L)
                .username("analista")
                .passwordHash("1234")
                .nombreCompleto("Ps. Camila Rojas")
                .rol(rol)
                .activo(true)
                .build();
    }

    @Test
    void testLoginExitoso() {
        when(usuarioRepo.findByUsername("analista")).thenReturn(Optional.of(usuario));

        LoginRequestDTO req = new LoginRequestDTO("analista", "1234");
        UsuarioDTO dto = authService.login(req);

        assertNotNull(dto);
        assertEquals("analista", dto.getUsername());
        assertEquals("ANALISTA_RECLUTAMIENTO", dto.getRolCodigo());
    }

    @Test
    void testLoginClaveIncorrecta() {
        when(usuarioRepo.findByUsername("analista")).thenReturn(Optional.of(usuario));

        LoginRequestDTO req = new LoginRequestDTO("analista", "clave_mala");
        assertThrows(BadRequestException.class, () -> authService.login(req));
    }

    @Test
    void testLoginUsuarioInexistente() {
        when(usuarioRepo.findByUsername("desconocido")).thenReturn(Optional.empty());

        LoginRequestDTO req = new LoginRequestDTO("desconocido", "1234");
        assertThrows(BadRequestException.class, () -> authService.login(req));
    }
}
