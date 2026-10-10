package cl.duoc.aquachile.evaluacion.service;

import cl.duoc.aquachile.evaluacion.dto.SolicitudCreateDTO;
import cl.duoc.aquachile.evaluacion.dto.SolicitudDTO;
import cl.duoc.aquachile.evaluacion.entity.*;
import cl.duoc.aquachile.evaluacion.exception.BadRequestException;
import cl.duoc.aquachile.evaluacion.exception.ResourceNotFoundException;
import cl.duoc.aquachile.evaluacion.repository.*;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

import java.time.LocalDate;
import java.time.LocalDateTime;
import java.util.Optional;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.*;

@ExtendWith(MockitoExtension.class)
class SolicitudServiceTest {

    @Mock
    private SolicitudRepository solicitudRepo;

    @Mock
    private CandidatoRepository candidatoRepo;

    @Mock
    private CargoRepository cargoRepo;

    @Mock
    private UsuarioRepository usuarioRepo;

    @Mock
    private EvaluacionRepository evaluacionRepo;

    @InjectMocks
    private SolicitudService solicitudService;

    private Solicitud solicitud;
    private Candidato candidato;
    private Cargo cargo;
    private Usuario evaluador;

    @BeforeEach
    void setUp() {
        FamiliaCargo familia = FamiliaCargo.builder().id(1L).nombre("Ventas / Comercial").activo(true).build();
        cargo = Cargo.builder().id(1L).nombre("Ejecutiva Comercial").familia(familia).activo(true).build();
        candidato = Candidato.builder()
                .id(1L)
                .rut("12.345.678-9")
                .nombre("María Fernanda")
                .cargo(cargo)
                .activo(true)
                .build();
        evaluador = Usuario.builder()
                .id(2L)
                .nombreCompleto("Ps. Andrés Miranda")
                .username("evaluador")
                .build();

        solicitud = Solicitud.builder()
                .id(1L)
                .codigo("SOL-1001")
                .candidato(candidato)
                .cargo(cargo)
                .responsable(evaluador)
                .prioridad(Prioridad.ALTA)
                .estado(EstadoSolicitud.PENDIENTE)
                .fechaSolicitud(LocalDate.now())
                .creadoEn(LocalDateTime.now())
                .actualizadoEn(LocalDateTime.now())
                .build();
    }

    @Test
    void testObtenerPorIdExitoso() {
        when(solicitudRepo.findById(1L)).thenReturn(Optional.of(solicitud));

        SolicitudDTO dto = solicitudService.obtenerPorId(1L);

        assertNotNull(dto);
        assertEquals("SOL-1001", dto.getCodigo());
        assertEquals("María Fernanda", dto.getCandidatoNombre());
    }

    @Test
    void testCrearSolicitud() {
        when(candidatoRepo.findById(1L)).thenReturn(Optional.of(candidato));
        when(solicitudRepo.count()).thenReturn(0L);
        when(solicitudRepo.save(any(Solicitud.class))).thenReturn(solicitud);
        when(evaluacionRepo.save(any(Evaluacion.class))).thenReturn(new Evaluacion());

        SolicitudCreateDTO createDTO = SolicitudCreateDTO.builder()
                .candidatoId(1L)
                .prioridad("Alta")
                .fechaSolicitud("2026-10-10")
                .build();

        SolicitudDTO creada = solicitudService.crearSolicitud(createDTO);

        assertNotNull(creada);
        assertEquals("SOL-1001", creada.getCodigo());
        verify(solicitudRepo, times(1)).save(any(Solicitud.class));
    }

    @Test
    void testCambiarEstadoAFinalizadaSinDictamenFalla() {
        Evaluacion evalVacia = Evaluacion.builder().solicitud(solicitud).conclusiones("").dictamen(null).build();
        solicitud.setEvaluacion(evalVacia);
        when(solicitudRepo.findById(1L)).thenReturn(Optional.of(solicitud));

        assertThrows(BadRequestException.class, () -> solicitudService.cambiarEstado(1L, "Finalizada"));
    }
}
