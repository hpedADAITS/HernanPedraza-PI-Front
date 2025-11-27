# Estructuras JSON Frontend - SyncRekuest

**Enfoque**: JSON consumido y renderizado por Frontend (datos de UI)

---

## 1. Solicitud y Respuesta de Inicio de Sesión

### Solicitud de Inicio de Sesión (Enviada por Frontend)

```plantuml
@startuml json
{
  "email": "user@example.com",
  "password": "SecurePassword123!"
}
@enduml
```

### Respuesta de Inicio de Sesión (Consumida por Frontend)

```plantuml
@startuml json
{
  "success": true,
  "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
  "user": {
    "id": "665f9b4b8f96e2f9451e713d",
    "name": "Juan DJ",
    "email": "dj@example.com",
    "role": "DJ"
  },
  "expiresIn": 86400
}
@enduml
```

### Uso en Frontend
```javascript
// AuthStore guarda:
authStore.setToken(response.token);
authStore.setUser(response.user);

// Usado en plantillas:
<div>Bienvenido, {user.name}</div>
<div>Rol: {user.role}</div>
```

---

## 2. Lista de Eventos (Renderizada en Página de Lista de Eventos)

### Formato de Respuesta de API

```plantuml
@startuml json
{
  "success": true,
  "data": [
    {
      "id": "6660b1fa24a10f0a8b3d9abc",
      "name": "Fiesta Fin de Exámenes",
      "code": "ABCD12",
      "djName": "Juan DJ",
      "status": "ACTIVE",
      "participants": 42,
      "startTime": "2025-06-20T22:00:00Z"
    }
  ],
  "pagination": {
    "page": 1,
    "limit": 10,
    "total": 42
  }
}
@enduml
```

### Renderización en Frontend
```javascript
// EventStore guarda:
eventStore.setEvents(response.data);

// Renderizado como:
{events.map(event => (
  <EventCard
    key={event.id}
    name={event.name}
    dj={event.djName}
    participants={event.participants}
    code={event.code}
  />
))}
```

---

## 3. Detalles del Evento (Mostrados después de Unirse)

```plantuml
@startuml json
{
  "id": "6660b1fa24a10f0a8b3d9abc",
  "name": "Fiesta Fin de Exámenes",
  "code": "ABCD12",
  "qrUrl": "https://api.syncrekuest.com/qr/ABCD12.png",
  "djName": "Juan DJ",
  "status": "ACTIVE",
  "participantCount": 43,
  "settings": {
    "votingEnabled": true,
    "maxSuggestionsPerUser": 3
  },
  "stats": {
    "totalSuggestions": 15,
    "totalVotes": 128
  }
}
@enduml
```

### Uso en Frontend
```javascript
// EventStore guarda
eventStore.setCurrentEvent(eventData);

// Renderizado en:
<h1>{currentEvent.name}</h1>
<p>DJ: {currentEvent.djName}</p>
<p>Participantes: {currentEvent.participantCount}</p>
<code>{currentEvent.code}</code>
<img src={currentEvent.qrUrl} />
```

---

## 4. Cola/Lista de Canciones (Mostrada en Componente de Cola)

### Modelo de Datos de Canción (como lo ve Frontend)

```plantuml
@startuml json
{
  "queue": [
    {
      "id": "6660b3bc24a10f0a8b3d9ac0",
      "title": "Billie Jean",
      "artist": "Michael Jackson",
      "status": "APPROVED",
      "votes": {
        "total": 15,
        "userHasVoted": true,
        "userVoteValue": 1
      },
      "suggestedBy": "Ana",
      "position": 1
    },
    {
      "id": "6660b3bc24a10f0a8b3d9ac1",
      "title": "Thriller",
      "artist": "Michael Jackson",
      "status": "APPROVED",
      "votes": {
        "total": 12,
        "userHasVoted": false,
        "userVoteValue": 0
      },
      "suggestedBy": "Carlos",
      "position": 2
    }
  ]
}
@enduml
```

### Renderización en Frontend
```javascript
// SongStore guarda
songStore.setQueue(queueData);

// Renderizado como:
{queue.map((song, idx) => (
  <SongCard
    key={song.id}
    position={idx + 1}
    title={song.title}
    artist={song.artist}
    votes={song.votes.total}
    userVoted={song.votes.userHasVoted}
    status={song.status}
    suggestedBy={song.suggestedBy}
  />
))}
```

---

## 5. Evento Socket.IO en Tiempo Real: Votos Actualizados

### Mensaje de Socket (Recibido por Frontend)

```plantuml
@startuml json
{
  "type": "votes_updated",
  "eventId": "6660b1fa24a10f0a8b3d9abc",
  "songId": "6660b3bc24a10f0a8b3d9ac0",
  "totalVotes": 16,
  "timestamp": "2025-06-20T21:35:22Z"
}
@enduml
```

### Manejador de Socket en Frontend
```javascript
// Hook useSocket escucha:
socket.on('votes_updated', (data) => {
  // Actualizar SongStore
  songStore.updateSongVotes(data.songId, data.totalVotes);
  // QueueList se re-renderiza automáticamente con nuevo conteo
});
```

### Actualización de UI
```
Canción "Billie Jean" va de 15 votos → 16 votos
Cola se ordena nuevamente si el ranking cambió
Usuario ve actualización inmediata (sin recarga de página)
```

---

## 6. Evento Socket.IO en Tiempo Real: Canción Sugerida

### Mensaje de Socket (Recibido por Frontend)

```plantuml
@startuml json
{
  "type": "song_suggested",
  "eventId": "6660b1fa24a10f0a8b3d9abc",
  "song": {
    "id": "6660b3bc24a10f0a8b3d9ac0",
    "title": "Billie Jean",
    "artist": "Michael Jackson",
    "suggestedBy": "Ana"
  },
  "timestamp": "2025-06-20T21:10:00Z"
}
@enduml
```

### Manejador de Socket en Frontend (Panel DJ)
```javascript
// Frontend de DJ escucha:
socket.on('song_suggested', (data) => {
  // Mostrar notificación
  uiStore.showNotification(`Nueva: ${data.song.title}`);
  // Agregar a cola de moderación del DJ
  songStore.addPendingSuggestion(data.song);
});
```

### Actualización de UI (Panel DJ)
```
Aparece notificación Toast:
"Nueva canción sugerida: Billie Jean de Michael Jackson"

Canción aparece en sección "Aprobación Pendiente"
```

---

## 7. Evento de Cola Actualizada

### Mensaje de Socket

```plantuml
@startuml json
{
  "type": "queue_updated",
  "eventId": "6660b1fa24a10f0a8b3d9abc",
  "queue": [
    {
      "id": "6660b3bc24a10f0a8b3d9ac0",
      "title": "Billie Jean",
      "artist": "Michael Jackson",
      "votes": 16,
      "status": "APPROVED"
    }
  ],
  "timestamp": "2025-06-20T21:35:22Z"
}
@enduml
```

### Manejador en Frontend
```javascript
socket.on('queue_updated', (data) => {
  songStore.setQueue(data.queue);
  // QueueList se re-renderiza con nuevo orden
});
```

---

## 8. Evento de Participante Unido

### Mensaje de Socket

```plantuml
@startuml json
{
  "type": "participant_joined",
  "eventId": "6660b1fa24a10f0a8b3d9abc",
  "participant": {
    "id": "665f9c218f96e2f9451e7140",
    "name": "Ana"
  },
  "totalParticipants": 43,
  "timestamp": "2025-06-20T21:35:22Z"
}
@enduml
```

### Manejador en Frontend
```javascript
socket.on('participant_joined', (data) => {
  // Actualizar conteo de participantes
  eventStore.updateParticipantCount(data.totalParticipants);
  // Mostrar notificación
  uiStore.showNotification(`${data.participant.name} se unió`);
});
```

---

## 9. Evento de Evento Cerrado

### Mensaje de Socket

```plantuml
@startuml json
{
  "type": "event_closed",
  "eventId": "6660b1fa24a10f0a8b3d9abc",
  "finalStats": {
    "totalParticipants": 42,
    "totalSuggestions": 20,
    "totalVotes": 156,
    "topSong": {
      "title": "Billie Jean",
      "artist": "Michael Jackson",
      "votes": 18
    }
  },
  "timestamp": "2025-06-20T23:35:22Z"
}
@enduml
```

### Manejador en Frontend
```javascript
socket.on('event_closed', (data) => {
  // Mostrar modal de resumen
  uiStore.showSummary(data.finalStats);
  // Deshabilitar votación/sugerencias
  eventStore.closeEvent();
  // Después de retraso, redirigir a lista de eventos
  setTimeout(() => navigate('/events'), 5000);
});
```

---

## 10. Entrada del Formulario de Sugerencia (Entrada del Usuario)

### Qué Recopila Frontend

```plantuml
@startuml json
{
  "title": "Billie Jean",
  "artist": "Michael Jackson"
}
@enduml
```

### Validación en Frontend Antes de Envío
- Título no vacío
- Artista no vacío
- Longitud del título ≤ 255 caracteres
- Longitud del artista ≤ 255 caracteres
- Usuario no ha excedido límite de sugerencias

### Renderización del Formulario
```javascript
<form onSubmit={handleSuggest}>
  <input
    type="text"
    placeholder="Título de la canción"
    value={title}
    onChange={(e) => setTitle(e.target.value)}
    required
  />
  <input
    type="text"
    placeholder="Artista"
    value={artist}
    onChange={(e) => setArtist(e.target.value)}
    required
  />
  <button type="submit" disabled={loading}>
    Sugerir Canción
  </button>
</form>
```

---

## 11. Entrada del Formulario de Voto (Acción del Usuario)

### Qué Envía Frontend

```plantuml
@startuml json
{
  "songId": "6660b3bc24a10f0a8b3d9ac0",
  "value": 1
}
@enduml
```

### Procesamiento en Frontend
- Deshabilitar botón inmediatamente (prevenir doble clic)
- Mostrar indicador de carga
- Incrementar contador de votos optimistamente
- Enviar solicitud
- En error, revertir contador
- Volver a habilitar botón

---

## Flujo de Datos Frontend

### Inicio de Sesión → Autenticación
```
Entrada del Usuario
  ↓
LoginPage recopila: {email, password}
  ↓
Validar localmente
  ↓
Enviar a API
  ↓
Recibir: {token, user}
  ↓
Almacenar en AuthStore
  ↓
Guardar token en estado/localStorage
  ↓
Redirigir a EventListPage
```

### Unirse a Evento → Sincronización en Tiempo Real
```
Usuario se une con código
  ↓
API devuelve: {event, queue}
  ↓
EventStore guarda evento
  ↓
SongStore guarda cola
  ↓
SocketClient se conecta a sala del evento
  ↓
Escucha: votes_updated, song_suggested, etc.
  ↓
Actualizaciones se propagan a stores
  ↓
Componentes se re-renderizan automáticamente
```

### Votar → Actualización en Tiempo Real
```
Usuario hace clic en voto
  ↓
VoteButton actualiza optimistamente localmente
  ↓
Llamada a API enviada
  ↓
Transmisión de socket recibida (todos los clientes)
  ↓
SongStore actualiza todos los conteos de votos
  ↓
QueueList se re-renderiza
  ↓
Nuevo ranking visible
```

---

## Puntos Clave para Desarrolladores Frontend

### Fuentes de Datos
- **REST API**: Datos iniciales, mutaciones
- **Socket.IO**: Actualizaciones en tiempo real, notificaciones
- **Estado Local**: Entradas de formularios, estado de UI
- **Store Zustand**: Estado compartido de aplicación

### Responsabilidad de Renderización
- Mostrar estados de carga mientras se obtienen datos
- Mostrar mensajes de error a usuarios
- Actualizar UI cuando los datos cambian
- No forzar recarga de página

### Manejo en Tiempo Real
- Escuchar eventos de socket en useEffect
- Actualizar stores en mensajes de socket
- Componentes se re-renderizan automáticamente
- Actualizaciones optimistas para mejor UX

---

Este documento cubre **JSON consumido por Frontend** para renderizar UI. La especificación completa de API incluyendo JSONs producidos por backend está en `docs/json-structures.md`.
