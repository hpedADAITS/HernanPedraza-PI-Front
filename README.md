# SyncRekuest-Frontend

**SyncRekuest** es una aplicación web (PWA) que conecta al público con el DJ, permitiendo votar y sugerir canciones en tiempo real.
Este repositorio contiene el entorno **frontend**, desarrollado con **React + Vite**, y preparado para comunicación en tiempo real mediante **WebSockets (Socket.IO)**.

---

##  Tecnologías principales

* **React + Vite** → interfaz moderna y rápida.
* **TailwindCSS** → diseño adaptable y limpio.
* **Socket.IO Client** → comunicación en tiempo real con el backend.
* **Axios** → manejo de peticiones REST.
* **Vite Plugin PWA** → soporte offline e instalación como app.

---

##  Instalación

```bash
# Clonar el repositorio
git clone https://github.com/tuusuario/syncrekuest-frontend.git
cd syncrekuest-frontend

# Instalar dependencias
npm install

# Ejecutar en desarrollo
npm run dev
```

El servidor se iniciará en [http://localhost:5173](http://localhost:5173).

---

##  Estructura básica

```
src/
 ├── components/     # Elementos reutilizables (botones, listas, modales)
 ├── pages/          # Vistas principales (Login, Home, DJ Panel)
 ├── hooks/          # Lógica reutilizable (auth, socket)
 ├── services/       # Conexión API y WebSockets
 ├── assets/         # Íconos, imágenes, estilos
 ├── App.jsx         # Configuración de rutas y layout
 └── main.jsx        # Punto de entrada de la app
```

---

## 🔌 Conexión con backend

La app se comunica con el servidor vía:

* **REST API:** para autenticación, usuarios y canciones.
* **WebSockets:** para votaciones, actualizaciones y feedback en tiempo real.

Configura la variable de entorno en el archivo `.env`:

```
VITE_API_URL=https://api.syncrekuest.com
VITE_SOCKET_URL=wss://api.syncrekuest.com
```

---

##  Build y despliegue

```bash
# Generar versión de producción
npm run build

# Previsualizar build localmente
npm run preview
```

El contenido final estará en la carpeta `/dist`, listo para desplegar en servicios como **Vercel**, **Netlify** o **Cloudflare Pages**.

---

##  Notas para desarrollo

* Mantener componentes pequeños y reutilizables.
* Evitar lógica en el render; mover a hooks o servicios.
* Usar **React Query** o **Zustand** para el estado global.
* Comprobar siempre la compatibilidad PWA tras cada cambio (manifest + service worker).

---
