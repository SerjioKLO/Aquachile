package cl.duoc.aquachile.evaluacion.controller;

import cl.duoc.aquachile.evaluacion.dto.CatalogoDTO;
import cl.duoc.aquachile.evaluacion.service.CatalogoService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/catalogos")
@RequiredArgsConstructor
public class CatalogoController {

    private final CatalogoService catalogoService;

    @GetMapping
    public ResponseEntity<CatalogoDTO> obtenerCatalogos() {
        return ResponseEntity.ok(catalogoService.obtenerCatalogoCompleto());
    }
}
