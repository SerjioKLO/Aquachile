package cl.duoc.aquachile.evaluacion.service;

import cl.duoc.aquachile.evaluacion.dto.CandidatoDTO;
import cl.duoc.aquachile.evaluacion.entity.Cargo;
import cl.duoc.aquachile.evaluacion.entity.FamiliaCargo;
import cl.duoc.aquachile.evaluacion.entity.Candidato;
import cl.duoc.aquachile.evaluacion.exception.BadRequestException;
import cl.duoc.aquachile.evaluacion.exception.ResourceNotFoundException;
import cl.duoc.aquachile.evaluacion.repository.CargoRepository;
import cl.duoc.aquachile.evaluacion.repository.FamiliaCargoRepository;
import cl.duoc.aquachile.evaluacion.repository.CandidatoRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.format.DateTimeFormatter;
import java.util.List;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
public class CandidatoService {

    private final CandidatoRepository candidatoRepo;
    private final CargoRepository cargoRepo;
    private final FamiliaCargoRepository familiaRepo;

    private static final DateTimeFormatter DATE_FORMATTER = DateTimeFormatter.ofPattern("yyyy-MM-dd");

    @Transactional(readOnly = true)
    public List<CandidatoDTO> listarCandidatos(String busqueda, Long familiaId) {
        List<Candidato> lista = candidatoRepo.buscarConFiltros(busqueda, familiaId);
        return lista.stream().map(this::convertirADTO).collect(Collectors.toList());
    }

    @Transactional(readOnly = true)
    public CandidatoDTO obtenerPorId(Long id) {
        Candidato c = candidatoRepo.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Candidato no encontrado con ID: " + id));
        return convertirADTO(c);
    }

    @Transactional
    public CandidatoDTO guardarCandidato(CandidatoDTO dto) {
        // Validación de unicidad de RUT
        candidatoRepo.findByRut(dto.getRut().trim()).ifPresent(existente -> {
            if (dto.getId() == null || !existente.getId().equals(dto.getId())) {
                throw new BadRequestException("Ya existe un candidato con el RUT: " + dto.getRut());
            }
        });

        // Buscar o resolver el cargo
        Cargo cargo = resolverCargo(dto.getCargoId(), dto.getCargoNombre(), dto.getFamiliaNombre());

        Candidato candidato;
        if (dto.getId() != null) {
            candidato = candidatoRepo.findById(dto.getId())
                    .orElseThrow(() -> new ResourceNotFoundException("Candidato no encontrado con ID: " + dto.getId()));
        } else {
            candidato = new Candidato();
        }

        candidato.setRut(dto.getRut().trim());
        candidato.setNombre(dto.getNombre().trim());
        candidato.setCorreo(dto.getCorreo().trim());
        candidato.setTelefono(dto.getTelefono().trim());
        candidato.setCargo(cargo);
        candidato.setActivo(dto.getActivo() == null ? true : dto.getActivo());

        Candidato guardado = candidatoRepo.save(candidato);
        return convertirADTO(guardado);
    }

    @Transactional
    public void eliminarCandidato(Long id) {
        Candidato c = candidatoRepo.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Candidato no encontrado con ID: " + id));
        c.setActivo(false);
        candidatoRepo.save(c);
    }

    private Cargo resolverCargo(Long cargoId, String cargoNombre, String familiaNombre) {
        if (cargoId != null) {
            return cargoRepo.findById(cargoId)
                    .orElseThrow(() -> new ResourceNotFoundException("Cargo no encontrado con ID: " + cargoId));
        }

        if (cargoNombre != null && !cargoNombre.isBlank()) {
            return cargoRepo.findByNombre(cargoNombre.trim())
                    .orElseGet(() -> {
                        FamiliaCargo fam = null;
                        if (familiaNombre != null && !familiaNombre.isBlank()) {
                            fam = familiaRepo.findByNombre(familiaNombre.trim()).orElse(null);
                        }
                        if (fam == null) {
                            fam = familiaRepo.findByNombre("Operaciones / Producción")
                                    .orElseGet(() -> familiaRepo.save(FamiliaCargo.builder()
                                            .nombre("Operaciones / Producción")
                                            .activo(true)
                                            .build()));
                        }
                        return cargoRepo.save(Cargo.builder()
                                .nombre(cargoNombre.trim())
                                .familia(fam)
                                .activo(true)
                                .build());
                    });
        }

        throw new BadRequestException("Debe especificar un cargo válido");
    }

    public CandidatoDTO convertirADTO(Candidato c) {
        return CandidatoDTO.builder()
                .id(c.getId())
                .cargoId(c.getCargo().getId())
                .cargoNombre(c.getCargo().getNombre())
                .familiaNombre(c.getCargo().getFamilia().getNombre())
                .rut(c.getRut())
                .nombre(c.getNombre())
                .correo(c.getCorreo())
                .telefono(c.getTelefono())
                .activo(c.getActivo())
                .creadoEn(c.getCreadoEn() != null ? c.getCreadoEn().format(DATE_FORMATTER) : "")
                .build();
    }
}
