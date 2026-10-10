package cl.duoc.aquachile.evaluacion.controller;

import cl.duoc.aquachile.evaluacion.dto.CandidatoDTO;
import cl.duoc.aquachile.evaluacion.service.CandidatoService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/candidatos")
@RequiredArgsConstructor
public class CandidatoController {

    private final CandidatoService candidatoService;

    @GetMapping
    public ResponseEntity<List<CandidatoDTO>> listarCandidatos(
            @RequestParam(required = false) String busqueda,
            @RequestParam(required = false) Long familiaId
    ) {
        return ResponseEntity.ok(candidatoService.listarCandidatos(busqueda, familiaId));
    }

    @GetMapping("/{id}")
    public ResponseEntity<CandidatoDTO> obtenerCandidato(@PathVariable Long id) {
        return ResponseEntity.ok(candidatoService.obtenerPorId(id));
    }

    @PostMapping
    public ResponseEntity<CandidatoDTO> crearCandidato(@Valid @RequestBody CandidatoDTO dto) {
        dto.setId(null);
        CandidatoDTO creado = candidatoService.guardarCandidato(dto);
        return ResponseEntity.status(HttpStatus.CREATED).body(creado);
    }

    @PutMapping("/{id}")
    public ResponseEntity<CandidatoDTO> actualizarCandidato(
            @PathVariable Long id,
            @Valid @RequestBody CandidatoDTO dto
    ) {
        dto.setId(id);
        CandidatoDTO actualizado = candidatoService.guardarCandidato(dto);
        return ResponseEntity.ok(actualizado);
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<Void> eliminarCandidato(@PathVariable Long id) {
        candidatoService.eliminarCandidato(id);
        return ResponseEntity.noContent().build();
    }
}
