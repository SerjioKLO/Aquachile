package cl.duoc.aquachile.evaluacion.service;

import cl.duoc.aquachile.evaluacion.dto.DashboardKpiDTO;
import cl.duoc.aquachile.evaluacion.dto.SolicitudDTO;
import cl.duoc.aquachile.evaluacion.entity.EstadoSolicitud;
import cl.duoc.aquachile.evaluacion.repository.CandidatoRepository;
import cl.duoc.aquachile.evaluacion.repository.SolicitudRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
public class DashboardService {

    private final CandidatoRepository candidatoRepo;
    private final SolicitudRepository solicitudRepo;
    private final SolicitudService solicitudService;

    @Transactional(readOnly = true)
    public DashboardKpiDTO obtenerKpis() {
        long totalCandidatos = candidatoRepo.count();
        long pendientes = solicitudRepo.countByEstado(EstadoSolicitud.PENDIENTE);
        long enProceso = solicitudRepo.countByEstado(EstadoSolicitud.EN_PROCESO);
        long finalizadas = solicitudRepo.countByEstado(EstadoSolicitud.FINALIZADA);

        List<SolicitudDTO> recientes = solicitudRepo.findTop6ByOrderByActualizadoEnDesc().stream()
                .map(solicitudService::convertirADTO)
                .collect(Collectors.toList());

        return DashboardKpiDTO.builder()
                .totalCandidatos(totalCandidatos)
                .pendientes(pendientes)
                .enProceso(enProceso)
                .finalizadas(finalizadas)
                .recientes(recientes)
                .build();
    }
}
