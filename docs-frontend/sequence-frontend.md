# Diagramas de Secuencia Frontend - SyncRekuest

**Enfoque**: Participación solo de frontend (interacciones UI → Backend)

---

## 1. Secuencia de Inicio de Sesión (Perspectiva Frontend)

Muestra solo los pasos donde el Frontend participa en el proceso de inicio de sesión.

```plantuml
@startuml
actor Usuario
participant "LoginPage\n(React)" as FE
participant "ApiService\n(Axios)" as API
participant "AuthStore\n(Zustand)" as Store

Usuario -> FE: Ingresa correo/contraseña\ny hace clic en "Iniciar Sesión"
FE -> FE: Validar entrada\n(formato de correo, longitud de contraseña)
alt La validación falla
  FE -> Usuario: Mostrar mensaje de error\n(corregir e reintentar)
else La validación pasa
  FE -> FE: Mostrar estado de carga\n(deshabilitar botón, spinner)
  FE -> API: POST /api/auth/login\n{email, password}
  activate API
  API -> API: Agregar encabezado de autorización si existe
  API -> API: Enviar por HTTPS

  alt Respuesta exitosa (200)
    API --> FE: {token, user, expiresIn}
    deactivate API
    FE -> Store: setToken(token)
    FE -> Store: setUser(user)
    FE -> FE: Limpiar formulario
    FE -> FE: Remover estado de carga
    FE -> Usuario: Redirigir a\nLista de Eventos o Panel DJ\n(basado en user.role)
  else Respuesta de error (401/400/500)
    API --> FE: {error, message}
    deactivate API
    FE -> FE: Remover estado de carga
    FE -> Usuario: Mostrar mensaje de error\n(Credenciales inválidas / Error del servidor)
    FE -> FE: Mantener formulario visible\npara reintentar
  end
end
@enduml
```

![Secuencia de Inicio de Sesión Frontend](../../diagrams/sequence-frontend_diagram_1.png)

### Acciones del Usuario

1. Usuario ingresa correo y contraseña
2. Hace clic en botón "Iniciar Sesión"
3. Frontend valida localmente
4. Frontend envía credenciales de forma segura
5. Recibe token JWT
6. Almacena token en estado de la aplicación
7. Redirige al panel apropiado

### Responsabilidades del Frontend

- Renderización de formulario e captura de entrada
- Validación del lado del cliente
- Gestión de estado de carga
- Visualización de errores
- Almacenamiento de token
- Navegación después del inicio de sesión

---

## 2. Secuencia de Sugerir Canción (Perspectiva Frontend)

Muestra interacción frontend cuando un asistente sugiere una canción.

```plantuml
@startuml
actor Asistente
participant "AttendeeEventPage\n(React)" as FE
participant "Song Form\nComponent" as Form
participant "ApiService\n(Axios)" as API
participant "SongStore\n(Zustand)" as Store
participant "SocketClient\n(Socket.IO)" as Socket

Asistente -> FE: Hace clic en "Sugerir Canción"
FE -> Form: Mostrar formulario de sugerencia
Asistente -> Form: Ingresa título y artista\n(o selecciona del catálogo)

Form -> Form: Validar\n(campos requeridos, límites de longitud)
alt La validación falla
  Form -> Asistente: Mostrar error de validación
  Asistente -> Form: Corregir entrada
else La validación pasa
  Form -> Form: Deshabilitar botón de envío\nMostrar spinner de carga

  Form -> API: POST /api/songs/suggestions\n{eventId, title, artist}\n+ JWT token
  activate API
  API -> API: Agregar encabezado de autorización\n(Bearer <token>)
  API -> API: Enviar por HTTPS

  alt Exitoso (201)
    API --> Form: {song, message}
    deactivate API

    Form -> Store: addSongToQueue(song)
    Form -> Form: Limpiar campos del formulario
    Form -> Form: Habilitar botón de envío\nRemover carga
    Form -> Asistente: Mostrar notificación de éxito\n"Sugerencia enviada"

    note over Socket
      DJ recibe notificación en tiempo real
      vía evento Socket.IO "song_suggested"
      (manejado en otro lugar)
    end note

  else Error (400/403)
    API --> Form: {error, message}
    deactivate API
    Form -> Form: Habilitar botón de envío\nRemover carga
    Form -> Asistente: Mostrar mensaje de error\n(límite de sugerencias excedido / evento cerrado)
  end
end
@enduml
```

![Secuencia de Sugerencia de Canción Frontend](../../diagrams/sequence-frontend_diagram_2.png)

### Acciones del Usuario

1. Asistente hace clic en botón "Sugerir Canción"
2. Aparece formulario con campos título/artista
3. Ingresa información de canción
4. Hace clic en envío
5. Frontend valida entrada
6. Envía a backend
7. Recibe confirmación
8. Formulario se limpia, usuario ve mensaje de éxito
9. Nueva canción aparece en cola (si se aprueba)

### Responsabilidades del Frontend

- Renderización del formulario de canción
- Validación de entrada
- Gestión de estado de envío (carga/deshabilitado)
- Manejo de errores y visualización
- Actualizaciones de cola
- Retroalimentación de éxito

---

## 3. Secuencia de Votación de Canción (Perspectiva Frontend)

Muestra interacción frontend cuando un asistente vota en una canción, incluyendo actualizaciones optimistas.

```plantuml
@startuml
actor Asistente
participant "QueueList\nComponent" as Queue
participant "VoteButton\nComponent" as VoteBtn
participant "ApiService\n(Axios)" as API
participant "SongStore\n(Zustand)" as Store
participant "SocketClient\n(Socket.IO)" as Socket

Asistente -> Queue: Ve canción en cola\ncon botón de voto
Asistente -> VoteBtn: Hace clic en botón de voto\n(ej. "Me gusta")

VoteBtn -> VoteBtn: Aplicar actualización optimista:\n- Deshabilitar botón\n- Mostrar carga\n- Incrementar contador\nlocalmente
VoteBtn -> Store: Actualizar optimista\nconteo de votos

VoteBtn -> API: POST /api/votes\n{songId, value: 1}\n+ JWT token
activate API
API -> API: Agregar encabezado de autorización
API -> API: Enviar por HTTPS

alt Exitoso (200)
  API --> VoteBtn: {songId, totalVotes}
  deactivate API

  VoteBtn -> Store: Confirmar conteo de votos\ndesde respuesta
  VoteBtn -> VoteBtn: Habilitar botón\nRemover carga

  note over Socket
    Todos los clientes conectados reciben
    evento "votes_updated" vía Socket.IO
    y actualizan su visualización de cola
    (sucede en tiempo real)
  end note

  VoteBtn -> Asistente: Mostrar nuevo conteo de votos

else Error (400/403/409)
  API --> VoteBtn: {error, message}
  deactivate API

  VoteBtn -> Store: Revertir actualización\noptimista
  VoteBtn -> VoteBtn: Habilitar botón\nRemover carga
  VoteBtn -> Asistente: Mostrar mensaje de error\n(ya votado / votación deshabilitada)
end
@enduml
```

![Secuencia de Votación de Canción Frontend](../../diagrams/sequence-frontend_diagram_3.png)

### Acciones del Usuario

1. Asistente ve canción en cola
2. Hace clic en botón de voto (generalmente "Me gusta" o "👍")
3. Frontend muestra actualización optimista inmediatamente
4. Voto se envía a backend
5. Todos los asistentes ven conteo de votos actualizado en tiempo real
6. Cola se reordena por popularidad

### Responsabilidades del Frontend

- Renderización del botón de voto
- Actualización optimista de UI (retroalimentación inmediata)
- Gestión de estado de carga durante envío
- Revertir actualización optimista en error
- Visualización del conteo de votos
- Configuración del listener de socket en tiempo real

### Flujo de Actualización Optimista

```
Usuario hace clic
    ↓
Deshabilitar botón + Mostrar carga
    ↓
Incrementar contador localmente (usuario lo ve inmediatamente)
    ↓
Enviar solicitud de API
    ↓
Si éxito → Confirmar conteo desde servidor
Si error → Revertir conteo al valor anterior
    ↓
Habilitar botón + Ocultar carga
```

---

## Listener Socket.IO en Tiempo Real (Background)

Mientras las secuencias anteriores muestran interacciones directas del usuario, los listeners Socket.IO se ejecutan continuamente:

```plantuml
@startuml
participant "SocketClient\n(Socket.IO)" as Socket
participant "SongStore\n(Zustand)" as Store
participant "QueueList\nComponent" as Queue

note over Socket, Queue
  Esto se ejecuta continuamente en background
  mientras el usuario está en evento
end note

Socket -> Socket: Escuchar evento\n"votes_updated"
activate Socket

loop En cada voto de cualquier usuario
  Socket -> Store: Recibir votes_updated\n{songId, totalVotes}
  Store -> Store: Actualizar canción\nen cola
  Store -> Queue: Disparar re-renderización
  Queue -> Queue: Mostrar nuevo\nconteo de votos
  Queue -> Queue: Reordenar si\ncambiaron los mejores votados
end

Socket -> Socket: Escuchar evento\n"song_suggested"
Socket -> Queue: Nueva canción agregada\na cola de sugerencias

Socket -> Socket: Escuchar evento\n"queue_updated"
Socket -> Queue: Cola reordenada\npor DJ o votos

@enduml
```

![Secuencia de Actualizaciones en Tiempo Real Frontend](../../diagrams/sequence-frontend_diagram_4.png)

---

## Flujo de Interacción de Componentes

### Flujo de Inicio de Sesión

```
Entrada del Usuario
    ↓
LoginPage valida
    ↓
Envía a ApiService
    ↓
Almacena en AuthStore
    ↓
Redirige a EventListPage o DJPanelPage
```

### Flujo de Votación

```
Usuario hace clic en VoteButton
    ↓
Actualización optimista en SongStore
    ↓
Envía a ApiService
    ↓
SocketClient escucha
    ↓
Todos los suscriptores (QueueList, otros componentes)
    ↓
Actualización inmediata de UI (sin recarga de página)
```

### Flujo de Participación en Evento

```
Usuario se une a evento
    ↓
AttendeeEventPage se monta
    ↓
SocketClient se conecta a sala del evento
    ↓
Obtiene cola inicial
    ↓
Escucha eventos de socket
    ↓
Actualizaciones en tiempo real
```

---

## Manejo de Errores en Frontend

### Errores de Red

```
Llamada a API falla (sin conexión)
    ↓
Atrapar error en ApiService
    ↓
Mostrar "Error de conexión"
    ↓
Mostrar botón de reintentar
    ↓
Usuario puede reintentar operación
```

### Errores de Validación (400)

```
Backend rechaza entrada
    ↓
Mostrar mensaje de error específico
    ↓
Resaltar campo inválido
    ↓
Permitir usuario corregir y reintentar
```

### Errores de Autenticación (401)

```
Token expirado o inválido
    ↓
Backend devuelve 401
    ↓
Limpiar AuthStore
    ↓
Redirigir a LoginPage
    ↓
Usuario debe iniciar sesión nuevamente
```

### Errores de Permiso (403)

```
Usuario carece de permisos
    ↓
Mostrar "Acceso denegado"
    ↓
Redirigir a página apropiada
    ↓
Usuario dirigido a Lista de Eventos
```

### Errores de Conflicto (409)

```
Intento de voto duplicado
    ↓
Mostrar "Ya votaste"
    ↓
Revertir UI optimista
    ↓
Mantener botón habilitado para que usuario reintente si es necesario
```

---

## Resumen de Flujo de Datos Frontend

### Inicio de Sesión

Entrada del Usuario → Validación → ApiService → AuthStore → Navegación

### Explorar Eventos

Montaje → Obtención de ApiService → EventStore → Renderización de EventListPage

### Unirse a Evento

Botón de unión → ApiService → Conexión de SocketClient → Obtención de cola → AttendeeEventPage

### Sugerir Canción

Entrada del formulario → Validación → ApiService → SongStore → Actualización de cola

### Votar

Hacer clic en botón → Actualización optimista → ApiService → Listener de socket → Actualización de cola

---

## Características Clave del Frontend

- **Validación del lado del cliente** - Fallar rápido antes de llamada al servidor
- **Actualizaciones optimistas** - Retroalimentación inmediata de UI
- **Recuperación de errores** - Mecanismos de reintentos
- **Sincronización en tiempo real** - Listeners Socket.IO
- **Estados de carga** - Retroalimentación del usuario durante operaciones asincrónicas
- **Gestión de token** - Almacenamiento y actualización JWT
- **Soporte PWA** - Funciona offline con service worker

---

## Tecnologías Frontend Utilizadas

| Tecnología       | Propósito                                 |
| ---------------- | ----------------------------------------- |
| React            | Componentes UI y estado                   |
| Vite             | Herramienta de compilación y servidor dev |
| Zustand          | Gestión de estado                         |
| Axios            | Cliente HTTP                              |
| Socket.IO Client | Comunicación en tiempo real               |
| React Router     | Navegación                                |
| Tailwind CSS     | Estilos                                   |

---

Este documento se enfoca en **Participación de Frontend** en secuencias del sistema. Para flujos completos de extremo a extremo incluyendo Backend y Base de Datos, ver `docs/sequence-global.md`.
