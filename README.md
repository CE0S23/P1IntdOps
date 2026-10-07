# P1IntdOps - API REST con CI/CD Automatizado

Este proyecto es una API RESTful desarrollada en Node.js y Express con una base de datos SQLite integrada. Incluye un servidor concurrente TCP Socket y un pipeline de Integración y Despliegue Continuo (CI/CD) automatizado mediante GitHub Actions y AWS EC2.

## Arquitectura
- **Backend:** Node.js + Express.js
- **Base de Datos:** SQLite3 (Persistencia local)
- **Protocolos:** HTTP (Puerto 80) y TCP Sockets (Puerto 6061)
- **Infraestructura:** Docker + Docker Hub + AWS EC2 (Ubuntu)
- **CI/CD:** GitHub Actions (Pruebas, Code Coverage >70%, Build, Push, y Deploy)

## Endpoints HTTP Disponibles

| Método | Ruta            | Descripción                        |
|--------|-----------------|------------------------------------|
| GET    | /usuarios       | Obtener lista de todos los usuarios |
| POST   | /usuarios       | Crear un nuevo usuario             |
| GET    | /usuarios/:id   | Obtener un usuario por ID          |
| PUT    | /usuarios/:id   | Actualizar un usuario por ID       |
| DELETE | /usuarios/:id   | Eliminar un usuario por ID         |
| GET    | /backup         | Generar respaldo de la base de datos |
| DELETE | /vaciar         | Vaciar todas las tablas de la BD   |
| GET    | /api/health     | Verificar estado del servicio      |

## Comandos Locales (Desarrollo)

1. **Instalar dependencias:**
   ```bash
   npm install
   ```

2. **Ejecutar pruebas y cobertura (Code Coverage):**
   ```bash
   npm run test:coverage
   ```

3. **Levantar el servidor localmente:**
   ```bash
   node index.js
   ```

4. **Construir imagen Docker localmente:**
   ```bash
   docker build -t webapp:local .
   ```

5. **Ejecutar contenedor Docker localmente:**
   ```bash
   docker run -d -p 80:80 -p 6061:6061 --name webapp-container webapp:local
   ```

## Configuración de Despliegue (GitHub Secrets)

Para que el pipeline funcione, el repositorio debe contar con los siguientes secretos configurados en **Settings → Secrets and variables → Actions**:

| Secret | Descripción |
|---|---|
| `DOCKER_USERNAME` | Usuario de Docker Hub |
| `DOCKER_PASSWORD` | Token de acceso personal (PAT) de Docker Hub |
| `EC2_HOST` | Dirección IP pública de la instancia AWS EC2 |
| `EC2_USER` | Usuario SSH de la instancia (ej. `ubuntu`) |
| `EC2_SSH_KEY` | Contenido de la llave privada `.pem` |

## Pipeline CI/CD (GitHub Actions)

El archivo `.github/workflows/main.yml` ejecuta automáticamente en cada `push` o `pull_request` a `main`:

1. Descarga el código fuente
2. Configura Node.js 18
3. Instala dependencias (`npm install`)
4. Ejecuta pruebas y valida cobertura ≥ 70% (`npm run test:coverage`)
5. Inicia sesión en Docker Hub (mediante secretos)
6. Construye y publica la imagen con etiquetas `:latest` y `:<commit-sha>`
7. Se conecta a AWS EC2 por SSH y despliega el nuevo contenedor en el puerto 80
