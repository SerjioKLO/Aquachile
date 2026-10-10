package cl.duoc.aquachile.evaluacion.service;

import cl.duoc.aquachile.evaluacion.dto.CandidatoDTO;
import cl.duoc.aquachile.evaluacion.entity.Cargo;
import cl.duoc.aquachile.evaluacion.entity.FamiliaCargo;
import cl.duoc.aquachile.evaluacion.entity.Candidato;
import cl.duoc.aquachile.evaluacion.exception.BadRequestException;
import cl.duoc.aquachile.evaluacion.exception.ResourceNotFoundException;
import cl.duoc.aquachile.evaluacion.repository.CargoRepository;
import cl.duoc.aquachile.evaluacion.repository.FamiliaCargoRepository;
import cl.duoc.aquachile.evaluacion.repository.CandidatoRepository;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

import java.time.LocalDateTime;
import java.util.List;
import java.util.Optional;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.*;

@ExtendWith(MockitoExtension.class)
class CandidatoServiceTest {

    @Mock
    private CandidatoRepository candidatoRepo;

    @Mock
    private CargoRepository cargoRepo;

    @Mock
    private FamiliaCargoRepository familiaRepo;

    @InjectMocks
    private CandidatoService candidatoService;

    private FamiliaCargo familia;
    private Cargo cargo;
    private Candidato candidato;

    @BeforeEach
    void setUp() {
        familia = FamiliaCargo.builder().id(1L).nombre("Tecnología / IT").activo(true).build();
        cargo = Cargo.builder().id(1L).nombre("Desarrollador Backend").familia(familia).activo(true).build();
        candidato = Candidato.builder()
                .id(1L)
                .rut("12.345.678-9")
                .nombre("Juan Pérez")
                .correo("juan@correo.cl")
                .telefono("912345678")
                .cargo(cargo)
                .activo(true)
                .creadoEn(LocalDateTime.now())
                .actualizadoEn(LocalDateTime.now())
                .build();
    }

    @Test
    void testListarCandidatos() {
        when(candidatoRepo.buscarConFiltros("Juan", null)).thenReturn(List.of(candidato));

        List<CandidatoDTO> resultado = candidatoService.listarCandidatos("Juan", null);

        assertNotNull(resultado);
        assertEquals(1, resultado.size());
        assertEquals("Juan Pérez", resultado.get(0).getNombre());
        verify(candidatoRepo, times(1)).buscarConFiltros("Juan", null);
    }

    @Test
    void testObtenerPorIdExitoso() {
        when(candidatoRepo.findById(1L)).thenReturn(Optional.of(candidato));

        CandidatoDTO dto = candidatoService.obtenerPorId(1L);

        assertNotNull(dto);
        assertEquals("Juan Pérez", dto.getNombre());
        assertEquals("12.345.678-9", dto.getRut());
    }

    @Test
    void testObtenerPorIdNoEncontrado() {
        when(candidatoRepo.findById(99L)).thenReturn(Optional.empty());

        assertThrows(ResourceNotFoundException.class, () -> candidatoService.obtenerPorId(99L));
    }

    @Test
    void testGuardarCandidatoRutDuplicado() {
        Candidato otro = Candidato.builder().id(2L).rut("12.345.678-9").build();
        when(candidatoRepo.findByRut("12.345.678-9")).thenReturn(Optional.of(otro));

        CandidatoDTO nuevoDTO = CandidatoDTO.builder()
                .id(null)
                .rut("12.345.678-9")
                .nombre("Pedro Gómez")
                .correo("pedro@correo.cl")
                .telefono("987654321")
                .cargoId(1L)
                .build();

        assertThrows(BadRequestException.class, () -> candidatoService.guardarCandidato(nuevoDTO));
    }

    @Test
    void testEliminarCandidato() {
        when(candidatoRepo.findById(1L)).thenReturn(Optional.of(candidato));
        when(candidatoRepo.save(any(Candidato.class))).thenReturn(candidato);

        candidatoService.eliminarCandidato(1L);

        assertFalse(candidato.getActivo());
        verify(candidatoRepo, times(1)).save(candidato);
    }
}
