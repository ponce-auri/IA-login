# SecureAuth - Gestión de Usuarios y Autenticación Full-Stack

Este es un sistema full-stack profesional para la gestión de usuarios, registro, inicio de sesión seguro mediante JWT, y recuperación de contraseñas. Incluye un buzón de correos interactivo simulado en tiempo real en el frontend para emular el envío de notificaciones y flujos de verificación sin depender de un SMTP real.

## Arquitectura del Proyecto

```text
ia/
├── backend/
│   ├── config/
│   │   └── db.js                 # Conexión a MongoDB Mongoose
│   ├── controllers/
│   │   ├── authController.js     # Lógica de registro, login, verificación y perfil
│   │   └── recoveryController.js # Lógica de recuperación de usuario/clave
│   ├── middleware/
│   │   └── authMiddleware.js     # Protección de rutas mediante JWT
│   ├── models/
│   │   ├── User.js               # Esquema de Usuario (hash con bcrypt)
│   │   └── Email.js              # Esquema de Correo Simulado
│   ├── routes/
│   │   ├── authRoutes.js         # Endpoints para usuarios y autenticación
│   │   ├── recoveryRoutes.js     # Endpoints para recuperación de credenciales
│   │   └── emailRoutes.js        # Endpoints para bandeja simulada
│   ├── server.js                 # Inicialización y configuración de Express
│   └── .env                      # Variables de entorno
│
└── frontend/
    ├── src/
    │   ├── components/
    │   │   ├── Login.jsx         # Formulario de inicio de sesión
    │   │   ├── Register.jsx      # Formulario de registro con validaciones
    │   │   ├── ForgotPassword.jsx# Recuperar usuario/clave y restablecer
    │   │   ├── Dashboard.jsx     # Panel principal con edición y clave
    │   │   └── FakeMailbox.jsx   # Widget flotante de correos simulados
    │   ├── services/
    │   │   └── api.js            # Cliente Axios con interceptor de tokens JWT
    │   ├── App.jsx               # Enrutador, Contexto de Auth y Alertas (Toasts)
    │   └── main.jsx              # Entrada de React con Vite
    ├── index.html                # HTML principal del cliente
    └── index.css                 # Diseño moderno con variables HSL
```

---

## Tecnologías Utilizadas

- **Frontend**: React.js (Vite), React Router DOM (v7), Axios, Lucide React (Iconos), CSS Moderno (Manejo de variables HSL, gradientes, y transiciones).
- **Backend**: Node.js, Express.js, MongoDB con Mongoose, JWT (jsonwebtoken) para sesiones y bcryptjs para cifrado seguro de claves.

---

## Instrucciones de Instalación y Ejecución

### Prerrequisitos
1. **Node.js**: Asegúrate de tener instalado Node.js (versión 18 o superior).
2. **MongoDB**: Asegúrate de tener un servidor de MongoDB ejecutándose localmente en `mongodb://127.0.0.1:27017/` o ten a mano tu cadena de conexión URI de MongoDB Atlas.

### Paso 1: Configurar y Ejecutar el Backend

1. Abre una terminal en la carpeta `backend`.
2. Instala las dependencias necesarias:
   ```bash
   npm install
   ```
3. Verifica o edita el archivo `.env` en la raíz de `backend/` si deseas modificar tu URI de base de datos o claves JWT:
   ```env
   PORT=5000
   MONGODB_URI=mongodb://127.0.0.1:27017/auth_db
   JWT_SECRET=super_secret_key_123
   FRONTEND_URL=http://localhost:5173
   ```
4. Inicia el servidor del backend en modo de desarrollo:
   ```bash
   npm run dev
   ```
   El servidor arrancará en `http://localhost:5000` y conectará automáticamente a MongoDB.

### Paso 2: Configurar y Ejecutar el Frontend

1. Abre una nueva terminal en la carpeta `frontend`.
2. Instala las dependencias:
   ```bash
   npm install
   ```
3. Inicia el cliente en modo de desarrollo:
   ```bash
   npm run dev
   ```
   La aplicación se abrirá por defecto en `http://localhost:5173`.

---

## Flujos Principales del Sistema

1. **Pantalla Principal (Login)**:
   - Permite ingresar con correo y clave.
   - Valida si el usuario existe, si la contraseña es válida y si la cuenta ya ha sido verificada.
   - Enlace "¿Olvidaste tu contraseña?" y botón para registrar una nueva cuenta.

2. **Registro**:
   - Valida campos obligatorios, formato de correo, contraseña mínima de 8 caracteres y coincidencia.
   - Evita correos duplicados devolviendo el mensaje *"Este correo ya está registrado"*.
   - Guarda el usuario con clave cifrada usando `bcrypt`. Genera un token y crea automáticamente un correo de verificación en la base de datos simulada.

3. **Bandeja de Correos Simulada**:
   - Representada por un widget flotante en la esquina inferior derecha.
   - El widget muestra un indicador numérico en rojo al recibir un correo y actualiza su contenido cada 3 segundos.
   - Abre un panel con los correos simulados, donde puedes hacer clic en **"Verificar Cuenta"** o **"Restablecer"** para saltar directamente a la vista de validación del frontend y completar el flujo.

4. **Recuperación de Contraseña**:
   - Permite seleccionar si olvidaste el Usuario o la Contraseña.
   - **Recuperar Usuario**: Envía un correo simulado con la estructura `"Tu usuario es: [Nombre]"`.
   - **Recuperar Contraseña**: Genera un token temporal con vencimiento y envía un enlace. Al presionar **"Restablecer"** desde la bandeja de correos, se abre la interfaz para ingresar la nueva contraseña, se cifra usando `bcrypt` y te redirige al Login tras actualizarse exitosamente.

5. **Dashboard (Panel Protegido)**:
   - Requiere autenticación con JWT.
   - Muestra detalles personales, correo y estado de verificación.
   - Incluye formularios modales integrados para **"Editar Perfil"** (cambiar nombre o correo) y **"Cambiar Contraseña"** (validando clave actual).
