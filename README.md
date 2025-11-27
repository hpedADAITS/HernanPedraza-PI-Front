# SyncRekuest Frontend

**Progressive Web App (PWA) construida con React + Vite + Tailwind CSS**

Una interfaz en tiempo real para sugerencias de música y votación para asistentes a eventos de DJ. Los usuarios pueden unirse a eventos, sugerir canciones, votar pistas y ver la cola actualizarse en tiempo real.

---

## Inicio Rápido

### Requisitos Previos
- Node.js 16+ y npm
- Navegador web moderno (Chrome, Firefox, Safari, Edge)

### Instalación

```bash
# Clonar repositorio
git clone https://github.com/hpedADAITS/HernanPedraza-PI-Back.git
cd syncrekuest-frontend

# Instalar dependencias
npm install

# Iniciar servidor de desarrollo
npm run dev
```

La aplicación se abrirá en `http://localhost:5173`

---

## Compilación

### Compilación de Desarrollo
```bash
npm run dev     # Iniciar servidor dev con recarga en caliente
```

### Compilación de Producción
```bash
npm run build   # Crear compilación de producción optimizada
npm run preview # Previsualizar compilación de producción localmente
```

Directorio de salida: `/dist`

---

## Arquitectura

### Stack Frontend
- **React 18** - Framework UI
- **Vite** - Herramienta de compilación rápida y servidor dev
- **Tailwind CSS** - CSS de utilidad
- **Zustand** - Gestión de estado ligera
- **Axios** - Cliente HTTP
- **Socket.IO Client** - Comunicación en tiempo real
- **React Router** - Enrutamiento del lado del cliente

### Estructura de Carpetas
```
src/
├── pages/           # Componentes de pantalla
├── components/      # Componentes UI reutilizables
├── hooks/           # Hooks personalizados de React
├── services/        # Clientes de API y Socket.IO
├── stores/          # Stores de estado Zustand
└── utils/           # Funciones auxiliares
```

**Arquitectura detallada**: Ver [docs-frontend/architecture-frontend.md](docs-frontend/architecture-frontend.md)

---

## Conexión Backend

### Configuración de Entorno

Crear archivo `.env` en la raíz del proyecto:

```env
VITE_API_URL=http://localhost:4000
VITE_SOCKET_URL=ws://localhost:4000
```

### Endpoints de API
```
REST API (HTTPS)
- POST   /api/auth/login        → Autenticación de usuario
- GET    /api/events            → Listar eventos activos
- POST   /api/events            → Crear evento (DJ)
- GET    /api/events/{code}     → Obtener evento por código
- POST   /api/songs/suggestions → Sugerir canción
- POST   /api/votes             → Emitir voto

WebSocket (Socket.IO)
- votes_updated      → Transmitir cambios de conteo de votos
- song_suggested     → Notificar a DJ de sugerencia
- song_status_changed → Transmitir cambios de estado
- queue_updated      → Reordenamiento de cola
- participant_joined → Notificación de nuevo asistente
- event_closed       → Evento terminado
```

---

## Características Clave

### Para Asistentes
- Registrarse e iniciar sesión con autenticación JWT
- Examinar y unirse a eventos activos (por código o QR)
- Sugerir canciones para el evento
- Votar en canciones sugeridas en tiempo real
- Ver cómo se actualiza la cola conforme otros asistentes votan
- Ver contador de participantes y estadísticas del evento
- Diseño receptivo mobile-first
- Funciona offline con caché PWA

### Para DJs
- Crear eventos con configuración personalizable
- Generar códigos únicos y códigos QR
- Recibir notificaciones en tiempo real de sugerencias
- Aprobar o rechazar sugerencias de canciones
- Controlar reproducción (saltar, siguiente, marcar como reproducido)
- Ver actualización en tiempo real de votos y participantes
- Acceder a estadísticas y análisis del evento

### Características en Tiempo Real
- Actualizaciones en vivo del conteo de votos (sin recarga)
- Reordenamiento instantáneo de cola por popularidad
- Notificaciones de participantes en tiempo real
- Comunicación bidireccional Socket.IO

---

## Documentación

Documentación completa del frontend disponible en `/docs-frontend/`:

- **[architecture-frontend.md](docs-frontend/architecture-frontend.md)** - Estructura de componentes y flujo de datos
- **[sequence-frontend.md](docs-frontend/sequence-frontend.md)** - Secuencias de interacción frontend
- **[json-frontend.md](docs-frontend/json-frontend.md)** - Estructuras de datos consumidas por UI
- **[use-cases-frontend.md](docs-frontend/use-cases-frontend.md)** - Todas las características para el usuario

---

## Seguridad

- Comunicación solo HTTPS
- Autenticación basada en tokens JWT
- Transmisión segura de credenciales
- Validación de entrada del lado del cliente
- Rutas de API protegidas
- Aplicación de política CORS

---

## Pruebas

```bash
# Ejecutar pruebas
npm run test

# Ejecutar pruebas E2E
npm run test:e2e

# Informe de cobertura
npm run test:coverage
```

---

## Características PWA

Esta aplicación es una Progressive Web App:

- **Instalar como aplicación** - Agregar a pantalla de inicio
- **Soporte offline** - Los activos en caché funcionan sin conexión
- **Service worker** - Sincronización en segundo plano y caché
- **Manifest** - Instalable en dispositivos móviles

---

## Personalización

### Tailwind CSS
Editar `tailwind.config.js` para personalizar:
- Colores
- Tipografía
- Espaciado
- Puntos de quiebre

### Estilos de Componentes
Los componentes usan clases de utilidad Tailwind:
```jsx
<button className="px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600">
  Votar
</button>
```

---

## Configuración

### Configuración de API
```javascript
// services/api.js
const API_URL = import.meta.env.VITE_API_URL;
const SOCKET_URL = import.meta.env.VITE_SOCKET_URL;
```

### Configuración de Socket.IO
```javascript
// services/socketClient.js
const socket = io(SOCKET_URL, {
  auth: {
    token: jwtToken
  },
  reconnection: true,
  reconnectionDelay: 1000
});
```

---

## Implementación

### Vercel
```bash
npm run build
# Luego empujar a GitHub, conectar a Vercel
```

### Netlify
```bash
npm run build
# Implementar carpeta /dist en Netlify
```

### Docker (Opcional)
```dockerfile
FROM node:18-alpine AS build
WORKDIR /app
COPY package.json .
RUN npm install
COPY . .
RUN npm run build

FROM node:18-alpine
WORKDIR /app
RUN npm install -g serve
COPY --from=build /app/dist ./dist
EXPOSE 5173
CMD ["serve", "-s", "dist", "-l", "5173"]
```

---

## Rendimiento

- **Code splitting** - Cargar páginas perezosamente con React.lazy()
- **Minificación** - Vite minifica compilaciones de producción
- **Caché** - Service worker almacena activos en caché
- **PWA** - Instalable, carga rápida
- **Tamaño de paquete** - ~150KB comprimido (excluyendo node_modules)

---

## Solución de Problemas

### Socket.IO No Se Conecta
- Verificar variable de entorno `VITE_SOCKET_URL`
- Asegurar que el backend está ejecutándose
- Verificar consola del navegador en busca de errores

### Llamadas a API 401 No Autorizadas
- El token puede haber expirado
- Iniciar sesión nuevamente para actualizar token
- Verificar localStorage/estado para token

### Estilos No Se Cargan
- Ejecutar `npm install`
- Limpiar caché del navegador
- Reconstruir CSS con `npm run dev`

### Compilación Falla
- Eliminar `node_modules` y `package-lock.json`
- Ejecutar `npm install` nuevamente
- Verificar versión de Node.js (16+)

---

## Scripts

```bash
npm run dev           # Iniciar servidor dev
npm run build         # Compilación de producción
npm run preview       # Previsualizar compilación
npm run test          # Ejecutar pruebas
npm run test:e2e      # Pruebas E2E
npm run lint          # Lintear código
npm run format        # Formatear código
```

---

## Contribuyendo

1. Crear rama de feature (`git checkout -b feature/AmazingFeature`)
2. Confirmar cambios (`git commit -m 'Add AmazingFeature'`)
3. Empujar a rama (`git push origin feature/AmazingFeature`)
4. Abrir Pull Request

---

## Estructura del Proyecto

```
syncrekuest-frontend/
├── src/
│   ├── pages/                  # Componentes de página
│   ├── components/             # Componentes reutilizables
│   ├── hooks/                  # Hooks personalizados
│   ├── services/               # Clientes de API y Socket
│   ├── stores/                 # Stores Zustand
│   ├── utils/                  # Funciones auxiliares
│   ├── App.jsx                 # Componente raíz
│   └── main.jsx                # Punto de entrada
│
├── public/                     # Activos estáticos
├── docs-frontend/              # Documentación técnica
│   ├── architecture-frontend.md
│   ├── sequence-frontend.md
│   ├── json-frontend.md
│   └── use-cases-frontend.md
│
├── index.html                  # Plantilla HTML
├── vite.config.js              # Configuración Vite
├── tailwind.config.js          # Configuración Tailwind
├── package.json                # Dependencias
└── README.md                   # Este archivo
```

---

## Documentación Relacionada

- **Docs globales**: `../docs/` - Documentación del sistema completo
- **Docs backend**: `../syncrekuest-backend/docs-backend/` - Implementación del servidor
- **Casos de uso globales**: `../docs/use-cases-global.md` - Todas las características del sistema
- **Arquitectura**: `../docs/architecture-global.md` - Diseño del sistema completo

---

## Soporte

Para problemas o preguntas:
1. Revisar [sección de solución de problemas](#solución-de-problemas)
2. Revisar [documentación](docs-frontend/)
3. Revisar [documentación global](../docs/README.md)
4. Crear issue en GitHub con detalles

---

## Licencia

Este proyecto es parte de PI-Backend. Ver archivo LICENSE para detalles.

---

## Tecnologías

| Tecnología | Propósito |
|-----------|---------|
| React | Framework UI |
| Vite | Herramienta de compilación |
| Tailwind CSS | Estilos |
| Zustand | Gestión de estado |
| Axios | Cliente HTTP |
| Socket.IO | Comunicación en tiempo real |
| React Router | Navegación |
| PWA | Capacidad offline |

---

**¿Listo para desarrollar?** Comienza con `npm run dev`

Para documentación detallada de arquitectura, ver [docs-frontend/architecture-frontend.md](docs-frontend/architecture-frontend.md)

**Última Actualización**: Noviembre 2025  
**Versión**: 1.0  
**Estado**: Listo para Desarrollo
