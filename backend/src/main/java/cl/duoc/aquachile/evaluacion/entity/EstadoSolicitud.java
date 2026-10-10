package cl.duoc.aquachile.evaluacion.entity;

import com.fasterxml.jackson.annotation.JsonCreator;
import com.fasterxml.jackson.annotation.JsonValue;

public enum EstadoSolicitud {
    PENDIENTE("Pendiente"),
    EN_PROCESO("En proceso"),
    FINALIZADA("Finalizada");

    private final String valor;

    EstadoSolicitud(String valor) {
        this.valor = valor;
    }

    @JsonValue
    public String getValor() {
        return valor;
    }

    @JsonCreator
    public static EstadoSolicitud fromValor(String valor) {
        if (valor == null) return PENDIENTE;
        for (EstadoSolicitud e : values()) {
            if (e.valor.equalsIgnoreCase(valor) || e.name().equalsIgnoreCase(valor)) {
                return e;
            }
        }
        return PENDIENTE;
    }
}
