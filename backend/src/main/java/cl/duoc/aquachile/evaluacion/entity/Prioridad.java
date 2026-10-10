package cl.duoc.aquachile.evaluacion.entity;

import com.fasterxml.jackson.annotation.JsonCreator;
import com.fasterxml.jackson.annotation.JsonValue;

public enum Prioridad {
    ALTA("Alta"),
    MEDIA("Media"),
    BAJA("Baja");

    private final String valor;

    Prioridad(String valor) {
        this.valor = valor;
    }

    @JsonValue
    public String getValor() {
        return valor;
    }

    @JsonCreator
    public static Prioridad fromValor(String valor) {
        if (valor == null) return MEDIA;
        for (Prioridad p : values()) {
            if (p.valor.equalsIgnoreCase(valor) || p.name().equalsIgnoreCase(valor)) {
                return p;
            }
        }
        return MEDIA;
    }
}
