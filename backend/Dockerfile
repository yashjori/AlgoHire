FROM eclipse-temurin:17-jdk-jammy

WORKDIR /app

# Copy maven wrapper files
COPY pom.xml .
COPY mvnw .
COPY .mvn .mvn

# 🔥 FIX: give execute permission
RUN chmod +x mvnw

# Download dependencies
RUN ./mvnw dependency:go-offline

# Copy source code
COPY src src

# Build jar
RUN ./mvnw clean package -DskipTests

EXPOSE 8080

CMD ["java", "-jar", "target/*.jar"]
