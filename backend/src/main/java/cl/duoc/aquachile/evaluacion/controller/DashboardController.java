package cl.duoc.aquachile.evaluacion.controller;

import cl.duoc.aquachile.evaluacion.dto.DashboardKpiDTO;
import cl.duoc.aquachile.evaluacion.service.DashboardService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/dashboard")
@RequiredArgsConstructor
public class DashboardController {

    private final DashboardService dashboardService;

    @GetMapping("/stats")
    public ResponseEntity<DashboardKpiDTO> obtenerKpis() {
        return ResponseEntity.ok(dashboardService.obtenerKpis());
    }
}
