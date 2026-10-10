package cl.duoc.aquachile.evaluacion.entity;

import com.fasterxml.jackson.annotation.JsonCreator;
import com.fasterxml.jackson.annotation.JsonValue;

public enum Dictamen {
    RECOMENDADO("Recomendado"),
    CON_OBSERVACIONES("Con observaciones"),
    NO_RECOMENDADO("No recomendado");

    private final String valor;

    Dictamen(String valor) {
        this.valor = valor;
    }

    @JsonValue
    public String getValor() {
        return valor;
    }

    @JsonCreator
    public static Dictamen fromValor(String valor) {
        if (valor == null || valor.isBlank()) return null;
        for (Dictamen d : values()) {
            if (d.valor.equalsIgnoreCase(valor) || d.name().equalsIgnoreCase(valor)) {
                return d;
            }
        }
        return null;
    }
}
