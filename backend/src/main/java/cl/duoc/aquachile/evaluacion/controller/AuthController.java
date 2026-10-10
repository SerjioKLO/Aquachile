package cl.duoc.aquachile.evaluacion.controller;

import cl.duoc.aquachile.evaluacion.dto.LoginRequestDTO;
import cl.duoc.aquachile.evaluacion.dto.UsuarioDTO;
import cl.duoc.aquachile.evaluacion.service.AuthService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/auth")
@RequiredArgsConstructor
public class AuthController {

    private final AuthService authService;

    @PostMapping("/login")
    public ResponseEntity<UsuarioDTO> login(@Valid @RequestBody LoginRequestDTO request) {
        UsuarioDTO usuario = authService.login(request);
        return ResponseEntity.ok(usuario);
    }
}
