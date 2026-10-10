package cl.duoc.aquachile.evaluacion.controller;

import cl.duoc.aquachile.evaluacion.dto.EvaluacionDTO;
import cl.duoc.aquachile.evaluacion.dto.SolicitudCreateDTO;
import cl.duoc.aquachile.evaluacion.dto.SolicitudDTO;
import cl.duoc.aquachile.evaluacion.service.EvaluacionService;
import cl.duoc.aquachile.evaluacion.service.SolicitudService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api/solicitudes")
@RequiredArgsConstructor
public class SolicitudController {

    private final SolicitudService solicitudService;
    private final EvaluacionService evaluacionService;

    @GetMapping
    public ResponseEntity<List<SolicitudDTO>> listarSolicitudes(
            @RequestParam(required = false) String estado,
            @RequestParam(required = false) Long familiaId,
            @RequestParam(required = false) String desde,
            @RequestParam(required = false) String hasta,
            @RequestParam(required = false) String candidato,
            @RequestParam(required = false) String cargo
    ) {
        return ResponseEntity.ok(solicitudService.listarSolicitudes(estado, familiaId, desde, hasta, candidato, cargo));
    }

    @GetMapping("/{id}")
    public ResponseEntity<SolicitudDTO> obtenerSolicitud(@PathVariable Long id) {
        return ResponseEntity.ok(solicitudService.obtenerPorId(id));
    }

    @PostMapping
    public ResponseEntity<SolicitudDTO> crearSolicitud(@Valid @RequestBody SolicitudCreateDTO dto) {
        SolicitudDTO creada = solicitudService.crearSolicitud(dto);
        return ResponseEntity.status(HttpStatus.CREATED).body(creada);
    }

    @PatchMapping("/{id}/estado")
    public ResponseEntity<SolicitudDTO> cambiarEstado(
            @PathVariable Long id,
            @RequestBody Map<String, String> body
    ) {
        String estado = body.get("estado");
        SolicitudDTO actualizada = solicitudService.cambiarEstado(id, estado);
        return ResponseEntity.ok(actualizada);
    }

    @PutMapping("/{id}/evaluacion")
    public ResponseEntity<EvaluacionDTO> guardarEvaluacion(
            @PathVariable Long id,
            @RequestBody EvaluacionDTO dto
    ) {
        EvaluacionDTO guardada = evaluacionService.guardarEvaluacion(id, dto);
        return ResponseEntity.ok(guardada);
    }
}
