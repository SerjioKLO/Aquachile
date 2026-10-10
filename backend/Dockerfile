# =============================================================================
# ETAPA 1: Compilación con Maven y Java 21
# =============================================================================
FROM maven:3.9.9-eclipse-temurin-21-alpine AS builder
WORKDIR /app

# Descarga previa de dependencias para optimizar caché de capas Docker
COPY pom.xml .
RUN mvn dependency:go-offline -B

# Copia de código fuente y empaquetado del archivo JAR
COPY src ./src
RUN mvn clean package -DskipTests

# =============================================================================
# ETAPA 2: Runtime ligero con JRE 21
# =============================================================================
FROM eclipse-temurin:21-jre-alpine AS runner
WORKDIR /app

# Crear usuario no root por seguridad
RUN addgroup -S spring && adduser -S spring -G spring
USER spring:spring

COPY --from=builder /app/target/*.jar app.jar

EXPOSE 8080

ENTRYPOINT ["java", "-Djava.security.egd=file:/dev/./urandom", "-jar", "app.jar"]
