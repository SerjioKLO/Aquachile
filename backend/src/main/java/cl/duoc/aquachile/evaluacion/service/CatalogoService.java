package cl.duoc.aquachile.evaluacion.service;

import cl.duoc.aquachile.evaluacion.dto.CatalogoDTO;
import cl.duoc.aquachile.evaluacion.entity.Cargo;
import cl.duoc.aquachile.evaluacion.entity.FamiliaCargo;
import cl.duoc.aquachile.evaluacion.entity.Usuario;
import cl.duoc.aquachile.evaluacion.repository.CargoRepository;
import cl.duoc.aquachile.evaluacion.repository.FamiliaCargoRepository;
import cl.duoc.aquachile.evaluacion.repository.UsuarioRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
public class CatalogoService {

    private final FamiliaCargoRepository familiaRepo;
    private final CargoRepository cargoRepo;
    private final UsuarioRepository usuarioRepo;

    @Transactional(readOnly = true)
    public CatalogoDTO obtenerCatalogoCompleto() {
        List<CatalogoDTO.FamiliaItemDTO> familias = familiaRepo.findByActivoTrue().stream()
                .map(f -> CatalogoDTO.FamiliaItemDTO.builder()
                        .id(f.getId())
                        .nombre(f.getNombre())
                        .descripcion(f.getDescripcion())
                        .build())
                .collect(Collectors.toList());

        List<CatalogoDTO.CargoItemDTO> cargos = cargoRepo.findByActivoTrue().stream()
                .map(c -> CatalogoDTO.CargoItemDTO.builder()
                        .id(c.getId())
                        .familiaId(c.getFamilia().getId())
                        .familiaNombre(c.getFamilia().getNombre())
                        .nombre(c.getNombre())
                        .descripcion(c.getDescripcion())
                        .build())
                .collect(Collectors.toList());

        List<CatalogoDTO.EvaluadorItemDTO> evaluadores = usuarioRepo.findByActivoTrue().stream()
                .map(u -> CatalogoDTO.EvaluadorItemDTO.builder()
                        .id(u.getId())
                        .nombreCompleto(u.getNombreCompleto())
                        .username(u.getUsername())
                        .build())
                .collect(Collectors.toList());

        return CatalogoDTO.builder()
                .familias(familias)
                .cargos(cargos)
                .evaluadores(evaluadores)
                .build();
    }
}
