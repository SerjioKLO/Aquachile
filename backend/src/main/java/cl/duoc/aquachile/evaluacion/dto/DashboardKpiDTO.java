package cl.duoc.aquachile.evaluacion.dto;

import lombok.*;
import java.util.List;

@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class DashboardKpiDTO {
    private long totalCandidatos;
    private long pendientes;
    private long enProceso;
    private long finalizadas;
    private List<SolicitudDTO> recientes;
}
