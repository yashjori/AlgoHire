FROM eclipse-temurin:21-jdk-jammy

WORKDIR /app

COPY pom.xml .
COPY mvnw .
COPY .mvn .mvn

RUN chmod +x mvnw
RUN ./mvnw dependency:go-offline

COPY src src

# Build jar
RUN ./mvnw clean package -DskipTests

# 🔥 Copy jar to fixed name
RUN cp target/*.jar app.jar

EXPOSE 8080

CMD ["java", "-jar", "app.jar"]
