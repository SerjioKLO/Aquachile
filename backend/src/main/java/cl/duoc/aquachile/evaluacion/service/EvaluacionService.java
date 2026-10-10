package cl.duoc.aquachile.evaluacion.service;

import cl.duoc.aquachile.evaluacion.dto.EvaluacionDTO;
import cl.duoc.aquachile.evaluacion.entity.Dictamen;
import cl.duoc.aquachile.evaluacion.entity.Evaluacion;
import cl.duoc.aquachile.evaluacion.entity.Solicitud;
import cl.duoc.aquachile.evaluacion.exception.ResourceNotFoundException;
import cl.duoc.aquachile.evaluacion.repository.EvaluacionRepository;
import cl.duoc.aquachile.evaluacion.repository.SolicitudRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDate;
import java.time.format.DateTimeFormatter;

@Service
@RequiredArgsConstructor
public class EvaluacionService {

    private final EvaluacionRepository evaluacionRepo;
    private final SolicitudRepository solicitudRepo;

    private static final DateTimeFormatter DATE_FORMATTER = DateTimeFormatter.ofPattern("yyyy-MM-dd");

    @Transactional
    public EvaluacionDTO guardarEvaluacion(Long solicitudId, EvaluacionDTO dto) {
        Solicitud solicitud = solicitudRepo.findById(solicitudId)
                .orElseThrow(() -> new ResourceNotFoundException("Solicitud no encontrada con ID: " + solicitudId));

        Evaluacion evaluacion = evaluacionRepo.findBySolicitudId(solicitudId)
                .orElseGet(() -> Evaluacion.builder().solicitud(solicitud).build());

        if (dto.getFechaEntrevista() != null && !dto.getFechaEntrevista().isBlank()) {
            evaluacion.setFechaEntrevista(LocalDate.parse(dto.getFechaEntrevista(), DATE_FORMATTER));
        }

        evaluacion.setConclusiones(dto.getConclusiones());

        if (dto.getDictamen() != null && !dto.getDictamen().isBlank()) {
            evaluacion.setDictamen(Dictamen.fromValor(dto.getDictamen()));
        } else {
            evaluacion.setDictamen(null);
        }

        if (dto.getPreguntasRespondidas() != null) {
            evaluacion.setPreguntasRespondidas(dto.getPreguntasRespondidas());
        }

        Evaluacion guardada = evaluacionRepo.save(evaluacion);

        return EvaluacionDTO.builder()
                .id(guardada.getId())
                .fechaEntrevista(guardada.getFechaEntrevista() != null
                        ? guardada.getFechaEntrevista().format(DATE_FORMATTER) : "")
                .conclusiones(guardada.getConclusiones() != null ? guardada.getConclusiones() : "")
                .dictamen(guardada.getDictamen() != null ? guardada.getDictamen().getValor() : "")
                .preguntasRespondidas(guardada.getPreguntasRespondidas() != null ? guardada.getPreguntasRespondidas() : "{}")
                .build();
    }
}
