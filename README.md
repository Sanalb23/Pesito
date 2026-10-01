# Documentación de la API - Pesito

Esta es la documentación oficial y completa de la API del proyecto **Pesito**. Describe todos los endpoints disponibles, sus mecanismos de autenticación, parámetros, esquemas de entrada/salida, lógica de negocio y códigos de respuesta.

---

## 📌 Configuración General

- **URL Base:** `https://pesito-ejyz.onrender.com`
- **Formato de datos:** `application/json` para peticiones con cuerpo (POST, PUT, PATCH, etc.) y respuestas.

---

## 🔒 Mecanismo de Autenticación

La API utiliza tokens de acceso **JWT (JSON Web Token)** almacenados en cookies seguras **HTTP-Only**.

- **Cookies de Autenticación:**
  - `access_token`: Token de acceso de corta duración (expira en 1 hora / `3600000 ms`).
  - `refresh_token`: Token de renovación de larga duración (expira en 14 días / `1209600000 ms`).
- **Configuración de las Cookies:**
  - `httpOnly: true` (Protegidas contra lecturas desde JavaScript en el cliente).
  - `secure: true` en producción (Se transmiten en conexiones HTTPS).
  - `sameSite: 'strict'` (Protección contra ataques CSRF).
- **Middleware de Autenticación (`verifyToken`):**
  - Examina `req.cookies.access_token`.
  - Si la cookie no está presente: Retorna estatus `401 Unauthorized` con el cuerpo `{"message": "Token no proporcionado"}`.
  - Si el token expiró o es inválido: Retorna estatus `401 Unauthorized` con el cuerpo `{"message": "Token inválido"}`.
  - Si es válido: Asigna `req.user = { id: decoded.id }` y permite el paso al controlador.

---

## 🚀 Índice de Endpoints

| Módulo | Método | Ruta | Autenticación | Descripción |
| --- | --- | --- | --- | --- |
| **Auth** | `POST` | `/auth/register` | No | Registra un nuevo usuario validando unicidad de email y nickname. |
| **Auth** | `POST` | `/auth/login` | No | Inicia sesión y genera las cookies de acceso y renovación. |
| **Auth** | `POST` | `/auth/logout` | No | Cierra la sesión limpiando las cookies de acceso y renovación. |
| **Auth** | `POST` | `/auth/refresh` | No (Cookie) | Renueva la cookie `access_token` usando el `refresh_token`. |
| **User** | `GET` | `/users/search` | **Sí** | Busca usuarios por coincidencia parcial de nickname. |
| **User** | `GET` | `/users/me/matches` | **Sí** | Obtiene el historial de partidos del usuario autenticado. |
| **User** | `GET` | `/users/:userId/matches` | **Sí** | Obtiene el historial de partidos de un usuario específico. |
| **Game** | `GET` | `/games` | No | Obtiene la lista de todos los juegos registrados. |
| **Game** | `GET` | `/games/:gameId/leagues` | No | Obtiene las ligas asociadas a un juego. |
| **Game** | `GET` | `/games/:gameId/leagues/:leagueId/teams` | No | Obtiene los equipos de una liga y juego específicos. |
| **Match** | `POST` | `/matches` | **Sí** | Solicita la creación de un partido en estado inactivo y notifica al rival. |
| **Match** | `PATCH` | `/matches/:matchId/confirm` | **Sí** | Confirma y activa un partido registrado. |
| **Match** | `POST` | `/matches/:matchId/request-edit` | **Sí** | Solicita la edición de datos/estadísticas de un partido. |
| **Match** | `PUT` | `/matches/:matchId` | **Sí** | Confirma la edición y actualiza los datos del partido. |
| **Match** | `POST` | `/matches/:matchId/request-delete` | **Sí** | Solicita la eliminación de un partido. |
| **Match** | `DELETE` | `/matches/:matchId` | **Sí** | Confirma y ejecuta la eliminación del partido. |
| **Match** | `GET` | `/matches/:matchId` | **Sí** | Obtiene los datos detallados y estadísticas de un partido. |
| **Friends** | `GET` | `/friends` | **Sí** | Obtiene el listado de amigos confirmados del usuario logueado. |
| **Friends** | `GET` | `/friends/:userId` | **Sí** | Obtiene el estado contextual de relación de amistad con `userId`. |
| **Friends** | `POST` | `/friends/:userId` | **Sí** | Envía una solicitud de amistad a un usuario. |
| **Friends** | `PATCH` | `/friends/:userId` | **Sí** | Acepta una solicitud de amistad recibida. |
| **Friends** | `DELETE` | `/friends/:userId` | **Sí** | Elimina o rechaza la relación de amistad con un usuario. |
| **Notifications** | `GET` | `/notifications` | **Sí** | Obtiene el historial de notificaciones del usuario logueado. |
| **Notifications** | `POST` | `/notifications` | **Sí** | Crea una nueva notificación (sistema o usuario). |
| **Notifications** | `PATCH` | `/notifications/all` | **Sí** | Marca todas las notificaciones del usuario como leídas. |
| **Notifications** | `PATCH` | `/notifications/:notificationId` | **Sí** | Marca una notificación específica como leída. |
| **Notifications** | `DELETE` | `/notifications/:notificationId` | **Sí** | Elimina una notificación específica. |

---

## 🔑 1. Autenticación (`/auth`)

### 1.1 Registrar Usuario
- **Ruta:** `POST /auth/register`
- **Autenticación Requerida:** No
- **Descripción:** Crea un nuevo usuario en la base de datos, encripta la contraseña con `bcrypt` (10 salt rounds) e inicia sesión automáticamente seteando las cookies de acceso y renovación. La validación de unicidad de email y nickname se delega a las restricciones del motor PostgreSQL (captura de error `23505`).

#### Cuerpo de la Petición (`application/json`):
```json
{
  "nickname": "jugador1",
  "email": "jugador1@ejemplo.com",
  "password": "miPassword123"
}
```

| Campo | Tipo | Requerido | Reglas de Validación |
| --- | --- | --- | --- |
| `nickname` | `string` | Sí | Único en el sistema (`users_nickname_key`). No debe contener espacios. |
| `email` | `string` | Sí | Único en el sistema (`users_email_key`). |
| `password` | `string` | Sí | Mínimo 8 caracteres, máximo 12 caracteres. |

#### Respuestas:
- **`201 Created`**: Usuario creado y autenticado correctamente.
  ```json
  {
    "message": "Usuario registrado exitosamente",
    "user": {
      "id": 1,
      "nickname": "jugador1",
      "email": "jugador1@ejemplo.com"
    }
  }
  ```
- **`400 Bad Request`**: Error de validación o datos duplicados.
  - Email ya registrado (`users_email_key`): `{"message": "El email ya está en uso"}`
  - Nickname ya registrado (`users_nickname_key`): `{"message": "El nickname ya está en uso"}`
  - Contraseña inválida: `{"message": "La contraseña debe tener entre 8 y 12 caracteres"}`
  - Nickname con espacios: `{"message": "El nickname no debe contener espacios"}`
- **`500 Internal Server Error`**: Error interno del servidor.
  ```json
  { "error": "Error al registrar el usuario" }
  ```

---

### 1.2 Iniciar Sesión
- **Ruta:** `POST /auth/login`
- **Autenticación Requerida:** No
- **Descripción:** Autentica a un usuario existente mediante email y contraseña. Retorna los datos del usuario (excluyendo el hash de contraseña) y emite la cookie `access_token`.

#### Cuerpo de la Petición (`application/json`):
```json
{
  "email": "jugador1@ejemplo.com",
  "password": "miPassword123"
}
```

| Campo | Tipo | Requerido | Descripción |
| --- | --- | --- | --- |
| `email` | `string` | Sí | Correo electrónico registrado. |
| `password` | `string` | Sí | Contraseña en texto plano. |

#### Respuestas:
- **`200 OK`**: Login exitoso.
  ```json
  {
    "message": "Login exitoso",
    "user": {
      "id": 1,
      "nickname": "jugador1",
      "email": "jugador1@ejemplo.com"
    }
  }
  ```
- **`400 Bad Request`**: Credenciales inválidas.
  - Usuario no encontrado: `{"message": "El usuario no existe"}`
  - Contraseña incorrecta: `{"message": "Contraseña incorrecta"}`
- **`500 Internal Server Error`**: Error en el proceso de autenticación.
  ```json
  { "error": "Error al iniciar sesión" }
  ```

---

### 1.3 Cerrar Sesión
- **Ruta:** `POST /auth/logout`
- **Autenticación Requerida:** No
- **Descripción:** Elimina las cookies de sesión `access_token` y `refresh_token` del cliente.

#### Respuestas:
- **`200 OK`**: Sesión cerrada.
  ```json
  { "message": "Se ha cerrado sesión correctamente" }
  ```
- **`500 Internal Server Error`**:
  ```json
  { "error": "Error al cerrar sesión" }
  ```

---

### 1.4 Renovación de Token
- **Ruta:** `POST /auth/refresh`
- **Autenticación Requerida:** No (Utiliza la cookie `refresh_token`)
- **Descripción:** Emite un nuevo `access_token` en cookie utilizando el `refresh_token` almacenado en las cookies del usuario.

#### Respuestas:
- **`200 OK`**: Token renovado exitosamente.
  ```json
  {
    "message": "Token renovado exitosamente",
    "user": {
      "id": 1,
      "nickname": "jugador1",
      "email": "jugador1@ejemplo.com"
    }
  }
  ```
- **`401 Unauthorized`**: Si la cookie `refresh_token` no fue proporcionada.
  ```json
  { "message": "Refresh Token no proporcionado" }
  ```
- **`403 Forbidden`**: Si el `refresh_token` es inválido o ha expirado.
  ```json
  { "message": "Refresh Token inválido o expirado" }
  ```
- **`404 Not Found`**: Si el usuario especificado en el token no existe en la base de datos.
  ```json
  { "message": "Usuario no encontrado" }
  ```

---

## 👤 2. Usuarios (`/users`)

### 2.1 Buscar Usuarios por Nickname
- **Ruta:** `GET /users/search`
- **Autenticación Requerida:** **Sí** (`verifyToken`)
- **Descripción:** Busca usuarios cuyo `nickname` coincida parcialmente con el término ingresado (`ILIKE '%query%'`).

#### Parámetros de Consulta (Query Parameters):
| Parámetro | Tipo | Requerido | Descripción |
| --- | --- | --- | --- |
| `query` | `string` | Sí | Término de búsqueda (no puede estar vacío ni contener solo espacios). |

**Ejemplo de Petición:** `GET /users/search?query=jugador`

#### Respuestas:
- **`200 OK`**: Lista de usuarios coincidentes.
  ```json
  [
    {
      "id": 1,
      "nickname": "jugador1"
    },
    {
      "id": 5,
      "nickname": "jugadorPro"
    }
  ]
  ```
- **`400 Bad Request`**: Si el parámetro `query` no fue proporcionado o está vacío.
  ```json
  { "message": "Debes ingresar un termino de busqueda" }
  ```
- **`401 Unauthorized`**: Token ausente o inválido.
- **`404 Not Found`**: Si no se encuentra ningún usuario coincidente.
  ```json
  { "message": "Usuario no encontrado" }
  ```
- **`500 Internal Server Error`**: Error en la base de datos o servidor.

---

### 2.2 Obtener Partidos del Usuario Autenticado
- **Ruta:** `GET /users/me/matches`
- **Autenticación Requerida:** **Sí** (`verifyToken`)
- **Descripción:** Obtiene todos los partidos jugados por el usuario actual (ya sea como local o como visitante), ordenados cronológicamente de forma descendente.

#### Respuestas:
- **`200 OK`**: Lista de partidos del usuario en sesión.
  ```json
  [
    {
      "id": 12,
      "home_user_id": 1,
      "home_user_nickname": "jugador1",
      "home_team_name": "Real Madrid",
      "away_user_id": 3,
      "away_user_nickname": "jugador3",
      "away_team_name": "FC Barcelona",
      "home_goals": 2,
      "away_goals": 1,
      "date": "2026-09-20T20:30:00.000Z"
    }
  ]
  ```
- **`401 Unauthorized`**: Token ausente o inválido.
- **`500 Internal Server Error`**:
  ```json
  { "error": "Error al obtener los partidos" }
  ```

---

### 2.3 Obtener Partidos de un Usuario por ID
- **Ruta:** `GET /users/:userId/matches`
- **Autenticación Requerida:** **Sí** (`verifyToken`)
- **Descripción:** Obtiene los partidos jugados por el usuario especificado en los parámetros de la ruta.

#### Parámetros de Ruta (Path Parameters):
| Parámetro | Tipo | Requerido | Descripción |
| --- | --- | --- | --- |
| `userId` | `integer` | Sí | ID numérico positivo del usuario. |

**Ejemplo de Petición:** `GET /users/5/matches`

#### Respuestas:
- **`200 OK`**: Lista de partidos del usuario solicitado.
- **`400 Bad Request`**: Si el `userId` no es numérico o es `<= 0`.
  ```json
  { "error": "Usuario no valido" }
  ```
- **`401 Unauthorized`**: Token ausente o inválido.
- **`500 Internal Server Error`**:
  ```json
  { "error": "Error al obtener los partidos" }
  ```

---

## 🎮 3. Juegos, Ligas y Equipos (`/games`)

### 3.1 Obtener Todos los Juegos
- **Ruta:** `GET /games`
- **Autenticación Requerida:** No
- **Descripción:** Retorna la lista completa de videojuegos registrados, ordenados por año de lanzamiento en forma descendente (`release_year DESC`).

#### Respuestas:
- **`200 OK`**: Lista de juegos.
  ```json
  [
    {
      "id": 1,
      "name": "eFootball 2024",
      "release_year": 2023
    },
    {
      "id": 2,
      "name": "PES 2021",
      "release_year": 2020
    }
  ]
  ```
- **`500 Internal Server Error`**:
  ```json
  { "error": "Error al obtener los juegos" }
  ```

---

### 3.2 Obtener Ligas de un Juego
- **Ruta:** `GET /games/:gameId/leagues`
- **Autenticación Requerida:** No
- **Descripción:** Obtiene las ligas que tienen equipos registrados para el juego especificado (`gameId`), ordenadas alfabéticamente por nombre.

#### Parámetros de Ruta (Path Parameters):
| Parámetro | Tipo | Requerido | Descripción |
| --- | --- | --- | --- |
| `gameId` | `integer` | Sí | ID del juego a consultar. |

#### Respuestas:
- **`200 OK`**: Lista de ligas distintas.
  ```json
  [
    {
      "id": 4,
      "name": "LaLiga EA Sports"
    },
    {
      "id": 8,
      "name": "Premier League"
    }
  ]
  ```
- **`500 Internal Server Error`**:
  ```json
  { "error": "Error al obtener las ligas" }
  ```

---

### 3.3 Obtener Equipos por Juego y Liga
- **Ruta:** `GET /games/:gameId/leagues/:leagueId/teams`
- **Autenticación Requerida:** No
- **Descripción:** Obtiene la lista de equipos pertenecientes a una liga y juego específicos.

> ⚠️ **Nota Importante:** El campo `id` devuelto en el arreglo corresponde a la clave primaria de la tabla relacional `teams_games` (`tg.id`), el cual debe ser enviado como `homeTeamId` o `awayTeamId` al solicitar o registrar un partido.

#### Parámetros de Ruta (Path Parameters):
| Parámetro | Tipo | Requerido | Descripción |
| --- | --- | --- | --- |
| `gameId` | `integer` | Sí | ID del juego. |
| `leagueId` | `integer` | Sí | ID de la liga. |

#### Respuestas:
- **`200 OK`**: Lista de relaciones equipo-juego.
  ```json
  [
    {
      "id": 45,
      "name": "Arsenal FC"
    },
    {
      "id": 46,
      "name": "Chelsea FC"
    }
  ]
  ```
- **`500 Internal Server Error`**:
  ```json
  { "error": "Error al obtener los equipos" }
  ```

---

## ⚽ 4. Partidos (`/matches`)

> 🔄 **Flujo de Solicitud y Confirmación:**
> Los partidos no se registran inmediatamente de forma activa. Al crear un partido se guarda en estado **inactivo** y se notifica al contrincante. El rival debe confirmar el partido para activarlo. Asimismo, la edición y la eliminación requieren una propuesta/solicitud previa y la confirmación correspondiente del otro participante (`home_user_id` o `away_user_id`).

### 4.1 Solicitar Creación de Partido
- **Ruta:** `POST /matches`
- **Autenticación Requerida:** **Sí** (`verifyToken`)
- **Descripción:** Registra un nuevo partido en estado inactivo y genera una notificación de tipo `match_request` destinada al contrincante.

#### Cuerpo de la Petición (`application/json`):
```json
{
  "homeUserId": 1,
  "awayUserId": 2,
  "homeTeamId": 45,
  "awayTeamId": 46,
  "homeGoals": 3,
  "awayGoals": 2,
  "stats": {
    "homePossession": 55,
    "awayPossession": 45,
    "homeShots": 12,
    "awayShots": 8,
    "homeShotsOnTarget": 6,
    "awayShotsOnTarget": 3,
    "homePenalties": 0,
    "awayPenalties": 0,
    "homeFreeKicks": 4,
    "awayFreeKicks": 5,
    "homeCornerKicks": 6,
    "awayCornerKicks": 2,
    "homeOffsides": 1,
    "awayOffsides": 3,
    "homeFouls": 8,
    "awayFouls": 10,
    "homeYellowCards": 1,
    "awayYellowCards": 2,
    "homeRedCards": 0,
    "awayRedCards": 0
  }
}
```

| Campo | Tipo | Requerido | Descripción |
| --- | --- | --- | --- |
| `homeUserId` | `integer \| null` | Condicional | ID del usuario local. Si es `null` o se omite, se asigna como invitado. |
| `awayUserId` | `integer \| null` | Condicional | ID del usuario visitante. Si es `null` o se omite, se asigna como invitado. |
| `homeTeamId` | `integer` | Sí | ID de `teams_games` para el equipo local. |
| `awayTeamId` | `integer` | Sí | ID de `teams_games` para el equipo visitante. |
| `homeGoals` | `integer` | Sí | Goles del equipo local. |
| `awayGoals` | `integer` | Sí | Goles del equipo visitante. |
| `stats` | `object` | No | Estadísticas opcionales del encuentro. |

#### Respuestas:
- **`201 Created`**: Solicitud enviada correctamente.
  ```json
  {
    "id": 18,
    "message": "Solicitud de partido enviada exitosamente"
  }
  ```
- **`400 Bad Request`**: Si ambos participantes son nulos.
  ```json
  { "error": "Debes especificar al menos un jugador registrado" }
  ```
- **`400 Bad Request`**: Si `homeUserId` y `awayUserId` son el mismo jugador.
  ```json
  { "error": "No puedes enviarte una solicitud de partido a ti mismo" }
  ```
- **`404 Not Found`**: Si el jugador local no existe.
  ```json
  { "error": "Jugador local no encontrado" }
  ```
- **`404 Not Found`**: Si el jugador visitante no existe.
  ```json
  { "error": "Jugador visitante no encontrado" }
  ```
- **`401 Unauthorized`**: Token ausente o inválido.
- **`500 Internal Server Error`**: Error al crear la solicitud de partido.

---

### 4.2 Confirmar Creación de Partido
- **Ruta:** `PATCH /matches/:matchId/confirm`
- **Autenticación Requerida:** **Sí** (`verifyToken`)
- **Descripción:** Activa el partido (`setActive`) tras la aceptación del rival y envía una notificación `match_confirmation` al creador.

#### Parámetros de Ruta (Path Parameters):
| Parámetro | Tipo | Requerido | Descripción |
| --- | --- | --- | --- |
| `matchId` | `integer` | Sí | ID del partido a activar. |

#### Respuestas:
- **`200 OK`**: Partido confirmado y activado.
  ```json
  { "message": "Partido confirmado y activado exitosamente" }
  ```
- **`401 Unauthorized`**: Token ausente o inválido.
- **`403 Forbidden`**: El usuario no es participante del partido.
  ```json
  { "error": "No tienes permiso para confirmar este partido" }
  ```
- **`404 Not Found`**: Partido no encontrado.
  ```json
  { "error": "Partido no encontrado" }
  ```
- **`500 Internal Server Error`**: Error en el servidor.

---

### 4.3 Solicitar Edición de Partido
- **Ruta:** `POST /matches/:matchId/request-edit`
- **Autenticación Requerida:** **Sí** (`verifyToken`)
- **Descripción:** Genera una notificación `match_edit_request` hacia el contrincante conteniendo la propuesta de modificación (`updatedMatchData`).

#### Parámetros de Ruta (Path Parameters):
| Parámetro | Tipo | Requerido | Descripción |
| --- | --- | --- | --- |
| `matchId` | `integer` | Sí | ID del partido que se desea editar. |

#### Cuerpo de la Petición (`application/json`):
Contiene los campos de partido o estadísticas que se proponen modificar.

#### Respuestas:
- **`200 OK`**: Solicitud de edición enviada.
  ```json
  { "message": "Solicitud de edición de partido enviada exitosamente" }
  ```
- **`401 Unauthorized`**: Token ausente o inválido.
- **`403 Forbidden`**: Si el usuario no fue participante del partido.
- **`500 Internal Server Error`**: Error al solicitar edición.

---

### 4.4 Confirmar Edición de Partido
- **Ruta:** `PUT /matches/:matchId`
- **Autenticación Requerida:** **Sí** (`verifyToken`)
- **Descripción:** Aplica los cambios aprobados en los datos y/o estadísticas del partido (`editMatch`) y envía la notificación `match_edit_confirmation`.

#### Parámetros de Ruta (Path Parameters):
| Parámetro | Tipo | Requerido | Descripción |
| --- | --- | --- | --- |
| `matchId` | `integer` | Sí | ID del partido a actualizar. |

#### Cuerpo de la Petición (`application/json`):
Acepta la estructura de datos del partido y objeto `stats` a actualizar.

#### Respuestas:
- **`200 OK`**: Partido actualizado correctamente.
  ```json
  { "message": "Partido editado exitosamente" }
  ```
- **`400 Bad Request`**: ID de partido inválido (`matchId <= 0`).
  ```json
  { "error": "Partido no valido" }
  ```
- **`401 Unauthorized`**: Token ausente o inválido.
- **`403 Forbidden`**: Si el usuario autenticado no fue participante del partido.
  ```json
  { "error": "No tienes permiso para editar este partido" }
  ```
- **`404 Not Found`**: El partido no existe.
  ```json
  { "error": "Partido no encontrado" }
  ```
- **`500 Internal Server Error`**: Error al editar el partido.

---

### 4.5 Solicitar Eliminación de Partido
- **Ruta:** `POST /matches/:matchId/request-delete`
- **Autenticación Requerida:** **Sí** (`verifyToken`)
- **Descripción:** Genera una notificación `match_delete_request` al contrincante para solicitar su consentimiento para borrar el registro del partido.

#### Parámetros de Ruta (Path Parameters):
| Parámetro | Tipo | Requerido | Descripción |
| --- | --- | --- | --- |
| `matchId` | `integer` | Sí | ID del partido a eliminar. |

#### Respuestas:
- **`200 OK`**: Solicitud de eliminación enviada.
  ```json
  { "message": "Solicitud de eliminación enviada exitosamente" }
  ```
- **`401 Unauthorized`**: Token ausente o inválido.
- **`403 Forbidden`**: Si el usuario no es participante del encuentro.
- **`500 Internal Server Error`**: Error al solicitar la eliminación.

---

### 4.6 Confirmar y Ejecutar Eliminación de Partido
- **Ruta:** `DELETE /matches/:matchId`
- **Autenticación Requerida:** **Sí** (`verifyToken`)
- **Descripción:** Confirma y elimina de forma permanente el partido y sus estadísticas (`deleteMatch`), notificando la acción mediante `match_delete_confirmation`.

#### Parámetros de Ruta (Path Parameters):
| Parámetro | Tipo | Requerido | Descripción |
| --- | --- | --- | --- |
| `matchId` | `integer` | Sí | ID del partido a eliminar. |

#### Respuestas:
- **`200 OK`**: Partido eliminado exitosamente.
  ```json
  { "message": "Partido eliminado exitosamente" }
  ```
- **`400 Bad Request`**: ID no válido.
  ```json
  { "error": "Partido no valido" }
  ```
- **`401 Unauthorized`**: Token ausente o inválido.
- **`403 Forbidden`**: Si el usuario no fue participante del encuentro.
  ```json
  { "error": "No tienes permiso para eliminar este partido" }
  ```
- **`404 Not Found`**: Si el partido no existe o no pudo eliminarse.
- **`500 Internal Server Error`**: Error al eliminar el partido.

---

### 4.7 Obtener Datos y Estadísticas de un Partido
- **Ruta:** `GET /matches/:matchId`
- **Autenticación Requerida:** **Sí** (`verifyToken`)
- **Descripción:** Obtiene los detalles de un partido por su ID junto con las estadísticas agregadas (`match_stats`).

#### Parámetros de Ruta (Path Parameters):
| Parámetro | Tipo | Requerido | Descripción |
| --- | --- | --- | --- |
| `matchId` | `integer` | Sí | ID del partido a consultar. |

#### Respuestas:
- **`200 OK`**: Datos y estadísticas del partido.
  ```json
  {
    "id": 18,
    "home_user_id": 1,
    "home_user_nickname": "jugador1",
    "home_team_name": "Arsenal FC",
    "away_user_id": 2,
    "away_user_nickname": "jugador2",
    "away_team_name": "Chelsea FC",
    "home_goals": 3,
    "away_goals": 2,
    "date": "2026-09-20T21:40:00.000Z",
    "stats": {
      "id": 9,
      "match_id": 18,
      "home_possession": 55,
      "away_possession": 45,
      "home_shots": 12,
      "away_shots": 8,
      "home_shots_on_target": 6,
      "away_shots_on_target": 3,
      "home_penalties": 0,
      "away_penalties": 0,
      "home_free_kicks": 4,
      "away_free_kicks": 5,
      "home_corner_kicks": 6,
      "away_corner_kicks": 2,
      "home_offsides": 1,
      "away_offsides": 3,
      "home_fouls": 8,
      "away_fouls": 10,
      "home_yellow_cards": 1,
      "away_yellow_cards": 2,
      "home_red_cards": 0,
      "away_red_cards": 0
    }
  }
  ```
- **`401 Unauthorized`**: Token ausente o inválido.
- **`404 Not Found`**: Partido no encontrado.
  ```json
  { "error": "Partido no encontrado" }
  ```
- **`500 Internal Server Error`**: Error al consultar el partido.

---

## 👥 5. Gestión de Amigos (`/friends`)

El módulo de amigos gestiona las relaciones vinculantes entre usuarios mediante la tabla `user_friends`. Incluye notificaciones automáticas para cada cambio de estado en la amistad.

### 5.1 Obtener Lista de Amigos
- **Ruta:** `GET /friends`
- **Autenticación Requerida:** **Sí** (`verifyToken`)
- **Descripción:** Retorna el listado de todos los usuarios con quienes el usuario autenticado mantiene una relación de amistad confirmada y activa (`status: 'Active'`).

#### Respuestas:
- **`200 OK`**: Lista de amigos confirmados.
  ```json
  [
    {
      "id": 2,
      "nickname": "jugador2",
      "email": "jugador2@ejemplo.com",
      "status": "Active"
    }
  ]
  ```
- **`401 Unauthorized`**: Token ausente o inválido.
- **`500 Internal Server Error`**:
  ```json
  { "error": "Error al obtener la lista de amigos" }
  ```

---

### 5.2 Obtener Estado de Amistad con un Usuario
- **Ruta:** `GET /friends/:userId`
- **Autenticación Requerida:** **Sí** (`verifyToken`)
- **Descripción:** Consulta y determina el estado contextual de la relación entre el usuario autenticado y el usuario especificado (`userId`).

#### Parámetros de Ruta (Path Parameters):
| Parámetro | Tipo | Requerido | Descripción |
| --- | --- | --- | --- |
| `userId` | `integer` | Sí | ID del usuario a consultar. |

#### Posibles Estados Devueltos (`status`):
- `"none"`: No existe ninguna relación ni solicitud pendiente entre ambos usuarios.
- `"self"`: El `userId` consultado pertenece al propio usuario en sesión.
- `"active"`: Existe una relación de amistad activa y confirmada.
- `"pending_sent"`: El usuario en sesión envió una solicitud que aún está pendiente de aceptación.
- `"pending_received"`: El usuario `userId` envió una solicitud al usuario en sesión, pendiente de respuesta.

#### Respuestas:
- **`200 OK`**: Estado de la relación obtenido.
  ```json
  {
    "status": "active"
  }
  ```
- **`401 Unauthorized`**: Token ausente o inválido.
- **`500 Internal Server Error`**:
  ```json
  { "error": "Error al obtener el estado de la relación" }
  ```

---

### 5.3 Enviar Solicitud de Amistad
- **Ruta:** `POST /friends/:userId`
- **Autenticación Requerida:** **Sí** (`verifyToken`)
- **Descripción:** Registra una nueva relación de amistad en la tabla `user_friends` hacia el usuario especificado (`userId`) y crea automáticamente una notificación de tipo `friend_request` para el destinatario.

#### Parámetros de Ruta (Path Parameters):
| Parámetro | Tipo | Requerido | Descripción |
| --- | --- | --- | --- |
| `userId` | `integer` | Sí | ID del usuario al que se envía la solicitud. |

#### Validaciones y Manejo de Restricciones PostgreSQL:
- **Auto-solicitud:** Valida que `req.user.id !== userId`. Si son iguales, retorna `400 Bad Request`.
- **Restricción `prevent_inverted_friendships` (Error PostgreSQL `23505`):** Evita solicitudes o relaciones duplicadas e invertidas entre dos mismos usuarios.
- **Restricción `chk_ids_distinct` (Error PostgreSQL `23514`):** Previene auto-relaciones a nivel base de datos.

#### Respuestas:
- **`201 Created`**: Solicitud enviada exitosamente.
  ```json
  { "message": "Solicitud de amistad enviada exitosamente" }
  ```
- **`400 Bad Request`**:
  - Auto-solicitud: `{"message": "No puedes enviarte una solicitud de amistad a ti mismo"}`
  - Relación duplicada / invertida: `{"message": "Ya existe una solicitud o relación de amistad con este usuario"}`
- **`401 Unauthorized`**: Token ausente o inválido.
- **`500 Internal Server Error`**: Error al enviar la solicitud.

---

### 5.4 Aceptar Solicitud de Amistad
- **Ruta:** `PATCH /friends/:userId`
- **Autenticación Requerida:** **Sí** (`verifyToken`)
- **Descripción:** Acepta una solicitud de amistad recibida de `userId`, cambiando el estado de la relación a `'Active'` y generando una notificación de tipo `friend_confirmation` para el usuario remitente.

#### Parámetros de Ruta (Path Parameters):
| Parámetro | Tipo | Requerido | Descripción |
| --- | --- | --- | --- |
| `userId` | `integer` | Sí | ID del usuario que envió la solicitud original. |

#### Respuestas:
- **`200 OK`**: Solicitud aceptada.
  ```json
  { "message": "Solicitud de amistad aceptada exitosamente" }
  ```
- **`401 Unauthorized`**: Token ausente o inválido.
- **`404 Not Found`**: Si no existe una solicitud pendiente de ese usuario.
  ```json
  { "message": "Solicitud de amistad no encontrada" }
  ```
- **`500 Internal Server Error`**: Error al aceptar la solicitud.

---

### 5.5 Eliminar o Rechazar Amistad
- **Ruta:** `DELETE /friends/:userId`
- **Autenticación Requerida:** **Sí** (`verifyToken`)
- **Descripción:** Elimina la relación de amistad (o rechaza la solicitud pendiente) con el usuario `userId` borrando el registro en `user_friends`.

#### Parámetros de Ruta (Path Parameters):
| Parámetro | Tipo | Requerido | Descripción |
| --- | --- | --- | --- |
| `userId` | `integer` | Sí | ID del usuario a desvincular. |

#### Respuestas:
- **`200 OK`**: Amistad eliminada o rechazada.
  ```json
  { "message": "Amistad eliminada correctamente" }
  ```
- **`401 Unauthorized`**: Token ausente o inválido.
- **`404 Not Found`**: Si la relación no existe.
- **`500 Internal Server Error`**: Error al eliminar la relación.

---

## 🔔 6. Notificaciones (`/notifications`)

El módulo de notificaciones gestiona la creación, lectura y eliminación de alertas del sistema y eventos sociales/de partidos.

> ⚠️ **Uso del campo `content` y renderizado en Frontend:**
> - **Campo `content`:** Se utiliza **únicamente** en notificaciones de tipo `match_edit_request` para almacenar el objeto/cadena JSON con los datos propuestos para la edición (`updatedMatchData`). Para el resto de tipos de notificaciones, este campo viaja como `null`.
> - **Textos e Interfaz (Frontend):** Los mensajes de interfaz (ej. *"te envió una solicitud de amistad"*, *"ahora son amigos"*, *"solicitó confirmar un partido"*, etc.) **deben ser generados y construidos dinámicamente por el frontend** interpretando el campo `type` de la notificación junto con la información del remitente (`sender_nickname`).

### Tipos de Notificaciones Soportados:
- `friend_request`: Solicitud de amistad recibida.
- `friend_confirmation`: Solicitud de amistad aceptada.
- `match_request`: Solicitud de creación de partido.
- `match_confirmation`: Partido confirmado y activado.
- `match_edit_request`: Propuesta de modificación de partido (única que contiene los datos propuestos en `content`).
- `match_edit_confirmation`: Modificación de partido aprobada.
- `match_delete_request`: Solicitud de eliminación de partido.
- `match_delete_confirmation`: Partido eliminado.

---

### 6.1 Obtener Historial de Notificaciones
- **Ruta:** `GET /notifications` (o `GET /notifications/:userId`)
- **Autenticación Requerida:** **Sí** (`verifyToken`)
- **Descripción:** Retorna la lista de notificaciones del usuario logueado. Cada notificación incluye la propiedad `sender_nickname` obtenida mediante un `LEFT JOIN` con la tabla `users`.

#### Respuestas:
- **`200 OK`**: Listado de notificaciones.
  ```json
  [
    {
      "id": 10,
      "sender_id": 2,
      "sender_nickname": "jugador2",
      "receiver_id": 1,
      "type": "friend_request",
      "content": null,
      "friendship_id": 4,
      "match_id": null,
      "is_read": false,
      "created_at": "2026-09-25T14:30:00.000Z"
    },
    {
      "id": 11,
      "sender_id": 2,
      "sender_nickname": "jugador2",
      "receiver_id": 1,
      "type": "match_edit_request",
      "content": "{\"homeGoals\":3,\"awayGoals\":3}",
      "friendship_id": null,
      "match_id": 18,
      "is_read": false,
      "created_at": "2026-09-25T15:00:00.000Z"
    }
  ]
  ```
- **`401 Unauthorized`**: Token ausente o inválido.
- **`500 Internal Server Error`**:
  ```json
  { "error": "Error al obtener las notificaciones" }
  ```

---

### 6.2 Crear Notificación
- **Ruta:** `POST /notifications`
- **Autenticación Requerida:** **Sí** (`verifyToken`)
- **Descripción:** Crea una notificación en el sistema. Permite `senderId` opcional (`null` para notificaciones enviadas por el sistema) y asocia automáticamente `friendship_id` o `match_id` según el valor de `type`.

#### Cuerpo de la Petición (`application/json`):
```json
{
  "senderId": 2,
  "receiverId": 1,
  "type": "match_edit_request",
  "content": "{\"homeGoals\":3,\"awayGoals\":3}",
  "relatedId": 18
}
```

| Campo | Tipo | Requerido | Descripción |
| --- | --- | --- | --- |
| `senderId` | `integer \| null` | No | ID del usuario remitente. `null` para el sistema. |
| `receiverId` | `integer` | Sí | ID del usuario destinatario. |
| `type` | `string` | Sí | Tipo de evento de notificación (`friend_request`, `match_edit_request`, etc.). |
| `content` | `string \| null` | No | Datos de la notificación. **Solo se usa en `match_edit_request`** para enviar la propuesta de cambios; en los demás tipos es `null`. |
| `relatedId` | `integer \| null` | No | ID asociado (`friendship_id` o `match_id`). |

#### Respuestas:
- **`200 OK`** / **`201 Created`**: Objeto de la notificación creada.
- **`401 Unauthorized`**: Token ausente o inválido.
- **`500 Internal Server Error`**:
  ```json
  { "error": "Error al crear la notificación" }
  ```

---

### 6.3 Marcar Notificación como Leída
- **Ruta:** `PATCH /notifications/:notificationId` (o `PUT /notifications/:userId/:notificationId`)
- **Autenticación Requerida:** **Sí** (`verifyToken`)
- **Descripción:** Actualiza el campo `is_read` a `true` para la notificación especificada.

#### Parámetros de Ruta (Path Parameters):
| Parámetro | Tipo | Requerido | Descripción |
| --- | --- | --- | --- |
| `notificationId` | `integer` | Sí | ID de la notificación a actualizar. |

#### Respuestas:
- **`200 OK`**: Notificación actualizada.
  ```json
  { "message": "Notificación marcada como leída" }
  ```
- **`401 Unauthorized`**: Token ausente o inválido.
- **`500 Internal Server Error`**:
  ```json
  { "error": "Error al marcar la notificación como leída" }
  ```

---

### 6.4 Marcar Todas las Notificaciones como Leídas
- **Ruta:** `PATCH /notifications/all` (o `PUT /notifications/:userId/all`)
- **Autenticación Requerida:** **Sí** (`verifyToken`)
- **Descripción:** Marca masivamente como leídas todas las notificaciones pertenecientes al usuario autenticado.

#### Respuestas:
- **`200 OK`**: Notificaciones actualizadas.
  ```json
  { "message": "Todas las notificaciones marcadas como leídas" }
  ```
- **`401 Unauthorized`**: Token ausente o inválido.
- **`500 Internal Server Error`**:
  ```json
  { "error": "Error al marcar todas las notificaciones como leídas" }
  ```

---

### 6.5 Eliminar Notificación
- **Ruta:** `DELETE /notifications/:notificationId` (o `DELETE /notifications/:userId/:notificationId`)
- **Autenticación Requerida:** **Sí** (`verifyToken`)
- **Descripción:** Elimina permanentemente una notificación específica por su ID.

#### Parámetros de Ruta (Path Parameters):
| Parámetro | Tipo | Requerido | Descripción |
| --- | --- | --- | --- |
| `notificationId` | `integer` | Sí | ID de la notificación a eliminar. |

#### Respuestas:
- **`200 OK`**: Notificación eliminada.
  ```json
  { "message": "Notificación eliminada exitosamente" }
  ```
- **`401 Unauthorized`**: Token ausente o inválido.
- **`500 Internal Server Error`**:
  ```json
  { "error": "Error al eliminar la notificación" }
  ```
