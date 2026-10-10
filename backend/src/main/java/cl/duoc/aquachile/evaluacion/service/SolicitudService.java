package cl.duoc.aquachile.evaluacion.service;

import cl.duoc.aquachile.evaluacion.dto.EvaluacionDTO;
import cl.duoc.aquachile.evaluacion.dto.SolicitudCreateDTO;
import cl.duoc.aquachile.evaluacion.dto.SolicitudDTO;
import cl.duoc.aquachile.evaluacion.entity.*;
import cl.duoc.aquachile.evaluacion.exception.BadRequestException;
import cl.duoc.aquachile.evaluacion.exception.ResourceNotFoundException;
import cl.duoc.aquachile.evaluacion.repository.*;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDate;
import java.time.format.DateTimeFormatter;
import java.util.List;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
public class SolicitudService {

    private final SolicitudRepository solicitudRepo;
    private final CandidatoRepository candidatoRepo;
    private final CargoRepository cargoRepo;
    private final UsuarioRepository usuarioRepo;
    private final EvaluacionRepository evaluacionRepo;

    private static final DateTimeFormatter DATE_FORMATTER = DateTimeFormatter.ofPattern("yyyy-MM-dd");

    @Transactional(readOnly = true)
    public List<SolicitudDTO> listarSolicitudes(
            String estadoStr,
            Long familiaId,
            String desdeStr,
            String hastaStr,
            String candidatoBusqueda,
            String cargoBusqueda
    ) {
        EstadoSolicitud estado = null;
        if (estadoStr != null && !estadoStr.isBlank() && !estadoStr.equalsIgnoreCase("todos")) {
            estado = EstadoSolicitud.fromValor(estadoStr);
        }

        LocalDate desde = (desdeStr != null && !desdeStr.isBlank()) ? LocalDate.parse(desdeStr, DATE_FORMATTER) : null;
        LocalDate hasta = (hastaStr != null && !hastaStr.isBlank()) ? LocalDate.parse(hastaStr, DATE_FORMATTER) : null;

        List<Solicitud> lista = solicitudRepo.buscarConFiltros(estado, familiaId, desde, hasta, candidatoBusqueda, cargoBusqueda);
        return lista.stream().map(this::convertirADTO).collect(Collectors.toList());
    }

    @Transactional(readOnly = true)
    public SolicitudDTO obtenerPorId(Long id) {
        Solicitud s = solicitudRepo.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Solicitud no encontrada con ID: " + id));
        return convertirADTO(s);
    }

    @Transactional
    public SolicitudDTO crearSolicitud(SolicitudCreateDTO dto) {
        Candidato candidato = candidatoRepo.findById(dto.getCandidatoId())
                .orElseThrow(() -> new ResourceNotFoundException("Candidato no encontrado con ID: " + dto.getCandidatoId()));

        Cargo cargo;
        if (dto.getCargoId() != null) {
            cargo = cargoRepo.findById(dto.getCargoId())
                    .orElse(candidato.getCargo());
        } else if (dto.getCargoNombre() != null && !dto.getCargoNombre().isBlank()) {
            cargo = cargoRepo.findByNombre(dto.getCargoNombre().trim())
                    .orElse(candidato.getCargo());
        } else {
            cargo = candidato.getCargo();
        }

        Usuario responsable = null;
        if (dto.getResponsableId() != null) {
            responsable = usuarioRepo.findById(dto.getResponsableId()).orElse(null);
        } else if (dto.getPsicologoNombre() != null && !dto.getPsicologoNombre().isBlank()) {
            responsable = usuarioRepo.findAll().stream()
                    .filter(u -> u.getNombreCompleto().equalsIgnoreCase(dto.getPsicologoNombre().trim()))
                    .findFirst()
                    .orElse(null);
        }

        // Si no se asignó responsable, asignar el primer evaluador por defecto
        if (responsable == null) {
            responsable = usuarioRepo.findByRolCodigo("PROFESIONAL_EVALUADOR").stream().findFirst().orElse(null);
        }

        long count = solicitudRepo.count();
        String codigo = String.format("SOL-%04d", 1001 + count);

        Prioridad prioridad = Prioridad.fromValor(dto.getPrioridad());
        LocalDate fecha = (dto.getFechaSolicitud() != null && !dto.getFechaSolicitud().isBlank())
                ? LocalDate.parse(dto.getFechaSolicitud(), DATE_FORMATTER)
                : LocalDate.now();

        Solicitud solicitud = Solicitud.builder()
                .codigo(codigo)
                .candidato(candidato)
                .cargo(cargo)
                .responsable(responsable)
                .prioridad(prioridad)
                .estado(EstadoSolicitud.PENDIENTE)
                .fechaSolicitud(fecha)
                .build();

        Solicitud guardada = solicitudRepo.save(solicitud);

        // Crear registro de evaluación inicial vacía
        Evaluacion evaluacion = Evaluacion.builder()
                .solicitud(guardada)
                .preguntasRespondidas("{}")
                .build();
        evaluacionRepo.save(evaluacion);
        guardada.setEvaluacion(evaluacion);

        return convertirADTO(guardada);
    }

    @Transactional
    public SolicitudDTO cambiarEstado(Long id, String nuevoEstadoStr) {
        Solicitud s = solicitudRepo.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Solicitud no encontrada con ID: " + id));

        EstadoSolicitud nuevoEstado = EstadoSolicitud.fromValor(nuevoEstadoStr);

        if (nuevoEstado == EstadoSolicitud.FINALIZADA) {
            Evaluacion eval = s.getEvaluacion();
            if (eval == null || eval.getDictamen() == null || eval.getConclusiones() == null || eval.getConclusiones().isBlank()) {
                throw new BadRequestException("Complete conclusiones y dictamen antes de finalizar la solicitud.");
            }
        }

        s.setEstado(nuevoEstado);
        Solicitud actualizada = solicitudRepo.save(s);
        return convertirADTO(actualizada);
    }

    public SolicitudDTO convertirADTO(Solicitud s) {
        EvaluacionDTO evalDTO = null;
        if (s.getEvaluacion() != null) {
            evalDTO = EvaluacionDTO.builder()
                    .id(s.getEvaluacion().getId())
                    .fechaEntrevista(s.getEvaluacion().getFechaEntrevista() != null
                            ? s.getEvaluacion().getFechaEntrevista().format(DATE_FORMATTER) : "")
                    .conclusiones(s.getEvaluacion().getConclusiones() != null
                            ? s.getEvaluacion().getConclusiones() : "")
                    .dictamen(s.getEvaluacion().getDictamen() != null
                            ? s.getEvaluacion().getDictamen().getValor() : "")
                    .preguntasRespondidas(s.getEvaluacion().getPreguntasRespondidas() != null
                            ? s.getEvaluacion().getPreguntasRespondidas() : "{}")
                    .build();
        }

        return SolicitudDTO.builder()
                .id(s.getId())
                .codigo(s.getCodigo())
                .candidatoId(s.getCandidato().getId())
                .candidatoNombre(s.getCandidato().getNombre())
                .candidatoRut(s.getCandidato().getRut())
                .cargoId(s.getCargo().getId())
                .cargoNombre(s.getCargo().getNombre())
                .familiaNombre(s.getCargo().getFamilia().getNombre())
                .responsableId(s.getResponsable() != null ? s.getResponsable().getId() : null)
                .responsableNombre(s.getResponsable() != null ? s.getResponsable().getNombreCompleto() : "Sin asignar")
                .prioridad(s.getPrioridad().getValor())
                .estado(s.getEstado().getValor())
                .fechaSolicitud(s.getFechaSolicitud().format(DATE_FORMATTER))
                .actualizada(s.getActualizadoEn() != null ? s.getActualizadoEn().format(DATE_FORMATTER) : "")
                .evaluacion(evalDTO)
                .build();
    }
}
