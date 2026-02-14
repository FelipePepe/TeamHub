# Migración de SonarQube a PostgreSQL

## Contexto
SonarQube estaba usando la base de datos embebida H2, que no soporta upgrades, escalado ni migraciones.

## Solución Implementada
Configurado SonarQube con PostgreSQL usando Docker Compose.

## Uso

### 1. Detener el contenedor anterior
```bash
docker stop sonarqube-custom
docker rm sonarqube-custom
```

### 2. Iniciar con Docker Compose
```bash
docker-compose -f docker-compose.sonarqube.yml up -d
```

### 3. Verificar logs
```bash
docker-compose -f docker-compose.sonarqube.yml logs -f sonarqube
```

### 4. Acceder a SonarQube
http://localhost:9000

**Credenciales por defecto:**
- Usuario: `admin`
- Contraseña: `admin`

### 5. Detener servicios
```bash
docker-compose -f docker-compose.sonarqube.yml down
```

### 6. Detener y eliminar volúmenes (CUIDADO: elimina datos)
```bash
docker-compose -f docker-compose.sonarqube.yml down -v
```

## Configuración

### Base de Datos PostgreSQL
- **Host:** postgres (interno en Docker)
- **Puerto:** 5432
- **Database:** sonarqube
- **Usuario:** sonarqube
- **Password:** sonarqube123

### SonarQube
- **Puerto:** 9000
- **JDBC URL:** jdbc:postgresql://postgres:5432/sonarqube

## Volúmenes Persistentes
- `sonarqube_data`: Datos de SonarQube
- `sonarqube_logs`: Logs de SonarQube
- `sonarqube_extensions`: Plugins y extensiones
- `postgres_data`: Datos de PostgreSQL

## Notas
- PostgreSQL tiene un healthcheck que asegura que esté listo antes de que SonarQube intente conectar
- Ambos servicios tienen `restart: unless-stopped` para reinicio automático
- Los contenedores están en una red privada `sonarqube_network`
