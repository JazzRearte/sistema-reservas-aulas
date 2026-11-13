
# Sistema de Reservas de Aulas

**Aplicación web Full Stack para gestionar reservas de aulas, con autenticación, roles y seguimiento de solicitudes.**

Proyecto académico desarrollado en **Desarrollo de Software — Ingeniería en Sistemas de Información, UTN Facultad Regional Córdoba (2026)**.

## Descripción

El sistema centraliza la consulta de aulas y la gestión de solicitudes de reserva. Los usuarios pueden crear, consultar, modificar y cancelar reservas; los administradores pueden aprobarlas o rechazarlas y consultar un resumen de solicitudes. Las operaciones se protegen mediante autenticación con Keycloak y autorización basada en roles.

## Funcionalidades principales

- Consulta de aulas disponibles.
- Creación, edición y cancelación de reservas.
- Consulta del historial de reservas.
- Aprobación y rechazo de solicitudes por administradores.
- Panel de resumen para administración.
- Autenticación con Keycloak y validación de tokens JWT.
- Control de permisos según rol.
- Pruebas automatizadas del backend con Jest y Supertest.

## Tecnologías

| Área | Tecnologías |
| --- | --- |
| Frontend | React, Vite, React Router, Axios |
| Backend | Node.js, Express, JavaScript |
| Autenticación y seguridad | Keycloak 26.4.0, OAuth 2.0 / OpenID Connect, PKCE, JWT, JWKS, JOSE |
| Persistencia | Archivos JSON (alcance académico) |
| Testing | Jest, Supertest |
| Infraestructura | Docker, Docker Compose |

## Arquitectura y organización

```text
sistema-reservas-aulas/
├── backend/
│   ├── controllers/
│   ├── data/
│   ├── middlewares/
│   ├── routes/
│   ├── services/
│   ├── tests/
│   └── index.js
├── frontend/
│   └── src/
├── docker-compose.yml
└── README.md
```

El frontend consume la API REST del backend. Keycloak gestiona la autenticación y el backend valida los tokens y permisos. Los datos de la aplicación se almacenan en archivos JSON locales.

## Autora

- **Jazmín Rearte Allende**

Trabajo práctico grupal — **Desarrollo de Software, UTN Facultad Regional Córdoba, curso 3K1 (2026)**.

> **Nota sobre datos de demostración:** los registros de usuarios, reservas e historial se distribuyen vacíos para evitar publicar datos personales. Las cuentas de prueba deben configurarse en Keycloak siguiendo las instrucciones siguientes.

---

## Instalación, configuración y ejecución

### 1. Requisitos previos

Para ejecutar el proyecto se necesita:

- Node.js compatible con Vite 8 (20.19+ o 22.12+)
- npm
- Docker Desktop con Docker Compose
- Navegador web

Puertos utilizados:

- Frontend: 3000
- Backend: 3001
- Keycloak: 8080

Estos puertos deben estar disponibles.

### 2. Iniciar Keycloak

Desde la carpeta principal del proyecto:

```bash
docker compose up -d
```

Esperar a que Keycloak termine de iniciar.

Abrir: http://localhost:8080

Ingresar a la consola de administración con las credenciales de desarrollo definidas en `docker-compose.yml`:

- Usuario: `admin`
- Contraseña: `admin`

**IMPORTANTE:** estas credenciales son únicamente para el entorno local de desarrollo. No deben utilizarse en producción.

El archivo `docker-compose.yml` utiliza un volumen persistente llamado `keycloak_data`.

Esto permite conservar el realm, los clientes y los usuarios al reiniciar el contenedor.

### 3. Configurar Keycloak

El archivo `docker-compose.yml` inicia Keycloak, pero la configuración del realm debe realizarse manualmente si se utiliza una instalación nueva.

#### 3.1. Crear el realm

Desde la consola de administración:

1. Seleccionar Create realm.
2. Asignar el nombre: `dds-materia`.
3. Guardar los cambios.

#### 3.2. Crear el cliente

Dentro del realm `dds-materia`:

1. Ir a Clients.
2. Seleccionar Create client.
3. Seleccionar OpenID Connect.
4. Establecer Client ID: `frontend`.
5. Continuar con la configuración.

Configurar el cliente para una aplicación React:

- Client authentication: OFF
- Standard flow: ON
- Direct access grants: OFF
- PKCE: S256

Configurar las direcciones:

```text
Root URL: http://localhost:3000
Home URL: http://localhost:3000
Valid redirect URIs: http://localhost:3000/*
Web origins: http://localhost:3000
```

Guardar los cambios.

#### 3.3. Crear los roles

Dentro del realm `dds-materia`:

1. Ir a Realm roles.
2. Crear el rol `usuario`.
3. Crear el rol `admin`.

El rol `usuario` permite utilizar las funcionalidades generales del sistema.

El rol `admin` habilita las operaciones administrativas.

Los roles deben estar incluidos en el access token dentro de `realm_access.roles`.

#### 3.4. Habilitar el registro

En Realm settings, habilitar el registro de usuarios desde la configuración de inicio de sesión.

Los usuarios nuevos deben recibir el rol `usuario`.

Se recomienda configurar `usuario` como rol predeterminado del realm.

#### 3.5. Usuarios de prueba

El sistema contempla dos cuentas de prueba para Keycloak local.

| Usuario | Contraseña | Rol |
|---|---|---|
| parcial2-usuario | parcial2 | usuario |
| parcial2-admin | parcial2 | admin |

Para ingresar al sistema:

1. Iniciar Keycloak mediante Docker.
2. Iniciar el backend y el frontend.
3. Abrir http://localhost:3000.
4. Seleccionar "Iniciar sesión".
5. Ingresar las credenciales correspondientes.

**Usuario común:** puede consultar aulas, crear reservas, editar sus reservas pendientes, cancelarlas y consultar su historial.

**Administrador:** puede consultar todas las reservas, editarlas, aprobarlas, rechazarlas, cancelarlas y acceder al panel de resumen.

**Importante:** estas credenciales son exclusivamente de prueba para el entorno académico. Si se configura Keycloak desde cero, deben crearse los usuarios y asignarles sus respectivos roles.

### 4. Configurar el backend

Abrir una terminal en la carpeta backend:

```bash
cd backend
npm install
```

Crear o actualizar el archivo `backend/.env`:

```env
PORT=3001

KEYCLOAK_URL=http://localhost:8080
KEYCLOAK_REALM=dds-materia
KEYCLOAK_CLIENT_ID=frontend

HORA_APERTURA=08:00
HORA_CIERRE=22:00
```

Los horarios son configurables mediante variables de entorno.

Para iniciar el servidor en modo desarrollo:

```bash
npm run dev
```

También puede iniciarse mediante:

```bash
npm start
```

El backend estará disponible en:

http://localhost:3001

Para verificar su funcionamiento:

http://localhost:3001/api/health

La respuesta esperada es:

```json
{
  "estado": "ok"
}
```

### 5. Configurar el frontend

Abrir otra terminal en la carpeta frontend:

```bash
cd frontend
npm install
npm run dev
```

Abrir en el navegador:

http://localhost:3000

La configuración de Keycloak se encuentra en:

`frontend/src/config/keycloak.js`

Utiliza los siguientes valores:

- URL: http://localhost:8080
- Realm: `dds-materia`
- Client ID: `frontend`

### 6. Rutas del frontend

El frontend utiliza React Router para gestionar la navegación entre las distintas pantallas.

#### Rutas públicas

| Ruta | Descripción |
|---|---|
| /login | Pantalla de inicio de sesión |
| /register | Pantalla de registro |

La autenticación se realiza mediante Keycloak.

#### Rutas protegidas

| Ruta | Descripción | Acceso |
|---|---|---|
| /reservas | Listado de reservas | Usuario y administrador |
| /reservas/nueva | Crear una reserva | Usuario y administrador |
| /reservas/:id | Detalle e historial de una reserva | Usuario autorizado y administrador |
| /reservas/:id/editar | Editar una reserva | Según permisos |
| /resumen | Panel de resumen administrativo | Solo administrador |

#### Rutas adicionales

| Ruta | Descripción |
|---|---|
| / | Redirige a /reservas |
| * | Página no encontrada (404) |

#### Protección de rutas

Se utiliza el componente `RutaProtegida` para controlar el acceso a las pantallas privadas.

El acceso depende de la autenticación y, cuando corresponde, del rol del usuario.

El panel `/resumen` está reservado exclusivamente para administradores.

Además, el backend valida los tokens JWT y los permisos de cada operación, evitando depender únicamente de las restricciones visuales del frontend.

### 7. Funcionalidades del sistema

#### Usuarios

- Registrarse mediante Keycloak.
- Iniciar y cerrar sesión.
- Consultar aulas.
- Crear reservas.
- Consultar sus propias reservas.
- Editar reservas pendientes.
- Cancelar reservas permitidas.
- Consultar detalles e historial.

#### Administradores

- Consultar todas las reservas.
- Filtrar y ordenar reservas.
- Editar reservas.
- Aprobar reservas pendientes.
- Rechazar reservas pendientes.
- Cancelar reservas permitidas.
- Consultar estadísticas y resumen.

### 8. Reglas de negocio

El sistema valida:

- Existencia del aula.
- Estado activo del aula.
- Capacidad máxima del aula.
- Fecha y formato de horarios.
- Hora de inicio anterior a la hora de fin.
- Horario permitido para realizar reservas.
- Ausencia de superposición de reservas.
- Permisos según el rol del usuario.
- Transiciones válidas entre estados.

Las reservas pendientes y aprobadas se consideran al verificar conflictos de horarios.

Los estados utilizados son:

- `pendiente`
- `aprobada`
- `rechazada`
- `cancelada`

Las transiciones permitidas son:

- pendiente a aprobada
- pendiente a rechazada
- pendiente a cancelada
- aprobada a cancelada

Las reservas rechazadas y canceladas no tienen transiciones posteriores.

### 9. Seguridad

La autenticación se realiza mediante Keycloak.

El frontend utiliza Authorization Code Flow con PKCE.

El backend valida los access tokens JWT utilizando las claves públicas publicadas por Keycloak mediante JWKS.

Se comprueba:

- Firma del token.
- Emisor.
- Expiración.
- Cliente autorizado.
- Roles del usuario.
- Estado activo del usuario local.

Las rutas protegidas requieren un token Bearer válido.

Los usuarios desactivados en la persistencia local no pueden acceder a las rutas protegidas, aunque conserven un token válido.

### 10. API REST

#### Autenticación

```http
POST /api/auth/register
POST /api/auth/login
```

#### Aulas

```http
GET /api/aulas
GET /api/aulas/:id
```

#### Reservas

```http
GET /api/reservas
GET /api/reservas/:id
POST /api/reservas
PUT /api/reservas/:id

PATCH /api/reservas/:id/cancelar
PATCH /api/reservas/:id/aprobar
PATCH /api/reservas/:id/rechazar

GET /api/reservas/:id/historial
GET /api/reservas/resumen
```

#### Estado del servidor

```http
GET /api/health
```

Las rutas de reservas requieren autenticación.

Las operaciones administrativas requieren rol `admin`.

### 11. Persistencia

El backend utiliza archivos JSON para almacenar la información.

Los archivos se encuentran en `backend/data/`.

Entre ellos:

- `aulas.json`
- `usuarios.json`
- `reservas.json`
- `historial_reservas.json`

Esta persistencia se utiliza con fines académicos.

### 12. Pruebas automatizadas

Las pruebas se implementan con Jest y Supertest.

Para ejecutarlas:

```bash
cd backend
npm test
```

El proyecto cuenta con 73 pruebas distribuidas en 8 suites.

Las pruebas verifican funcionalidades como:

- Autenticación.
- Gestión de usuarios.
- Operaciones sobre reservas.
- Validaciones de datos.
- Permisos de acceso.
- Transiciones de estados.
- Reglas de negocio.

Resultado documentado durante el desarrollo:

- 73 pruebas aprobadas.
- 8 suites aprobadas.

### 13. Orden recomendado de ejecución

1. Iniciar Docker Desktop.
2. Ejecutar `docker compose up -d`.
3. Verificar la configuración de Keycloak.
4. Iniciar el backend con `npm run dev`.
5. Iniciar el frontend con `npm run dev`.
6. Abrir http://localhost:3000.
7. Registrarse o iniciar sesión.

### 14. Detener el proyecto

Para detener frontend y backend, utilizar `Ctrl+C` en sus respectivas terminales.

Para detener Keycloak:

```bash
docker compose down
```

Este comando no elimina el volumen persistente.

No utilizar `docker compose down -v` si se desea conservar la configuración y los usuarios de Keycloak.

### 15. Consideraciones para GitHub

El repositorio debe incluir:

- Código fuente del backend.
- Código fuente del frontend.
- Archivos JSON necesarios.
- Pruebas automatizadas.
- `docker-compose.yml`.
- `README.md`.
- Ejemplo de configuración de entorno.

No incluir:

- Carpetas `node_modules`.
- Archivos `.env` con información sensible.
- Contraseñas privadas.
- Archivos temporales innecesarios.

### 16. Alcance y limitaciones conocidas

El Sistema de Reservas de Aulas fue desarrollado con fines académicos para la materia Desarrollo de Software de la UTN Facultad Regional Córdoba.

#### Persistencia de datos

El sistema utiliza archivos JSON para almacenar usuarios, aulas, reservas e historial de operaciones.

Esta implementación permite conservar la información al reiniciar el backend sin necesidad de instalar una base de datos externa.

Como limitación, la persistencia mediante archivos JSON no está diseñada para soportar un gran volumen de usuarios ni múltiples escrituras simultáneas.

#### Autenticación con Keycloak

La autenticación se realiza mediante Keycloak, ejecutado localmente con Docker.

El sistema utiliza OAuth 2.0/OpenID Connect y tokens JWT validados por el backend mediante JWKS.

La configuración del realm, los clientes, los roles y los usuarios debe realizarse siguiendo las instrucciones del README cuando se utiliza una instalación nueva de Keycloak.

Las contraseñas son administradas por Keycloak y no se almacenan en los archivos JSON del backend. Por este motivo, el campo `passwordHash` de los usuarios locales tiene valor `null`.

#### Entorno de ejecución

El proyecto está preparado para ejecutarse en un entorno local de desarrollo.

La configuración de Docker y Keycloak utiliza credenciales de prueba y no está destinada a un entorno de producción.

#### Pruebas automatizadas

El backend cuenta con pruebas automatizadas desarrolladas mediante Jest y Supertest.

Se documentaron 73 pruebas aprobadas distribuidas en 8 suites.

Estas pruebas permiten comprobar las funcionalidades principales, las validaciones, los permisos y las reglas de negocio.

No sustituyen las pruebas de integración completas con una instalación nueva de Keycloak ni las pruebas de carga y concurrencia.

#### Consideraciones finales

El proyecto implementa las funcionalidades principales solicitadas en el trabajo práctico, incluyendo autenticación, gestión de reservas, validaciones de negocio, control de permisos, historial y administración.

Las limitaciones mencionadas corresponden principalmente a decisiones de infraestructura y al alcance académico de la solución.
