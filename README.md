# TODoApp Backend

API REST para la aplicación móvil TODoApp. Incluye autenticación JWT, CRUD de tareas,
filtros, recordatorios automáticos y recepción/envío de mensajes por WhatsApp con Twilio.

## Requisitos

- Node.js 18 o superior
- PostgreSQL 13 o superior
- Cuenta de Twilio con WhatsApp Sandbox o un remitente aprobado

## Instalación local

1. Crea la base de datos:

   ```sql
   CREATE DATABASE todoapp;
   ```

2. Instala las dependencias:

   ```bash
   npm install
   ```

3. Copia `.env.example` como `.env` y completa las credenciales.

   En PowerShell:

   ```powershell
   Copy-Item .env.example .env
   ```

   Editar `.env.example` no configura la aplicación: `dotenv` carga `.env`.

4. En desarrollo puedes mantener `DB_SYNC=true`. Sequelize creará las tablas faltantes.
   Usa `DB_SYNC_ALTER=true` solo durante desarrollo cuando necesites ajustar tablas.

5. Inicia la API:

   ```bash
   npm run dev
   ```

La API estará disponible en `http://localhost:3000`. Comprueba su estado en
`GET /health`.

## Base de datos Neon

La opción recomendada es configurar únicamente el connection string pooler:

```env
DATABASE_URL=postgresql://USUARIO:CONTRASENA@HOST-POOLER/neondb?sslmode=require
DB_SSL=true
```

`DATABASE_URL` tiene prioridad. También se reconocen `POSTGRES_URL`,
`DATABASE_URL_UNPOOLED`, `POSTGRES_URL_NON_POOLING` y, como alternativa, los parámetros
individuales `DB_*`, `PG*` o `POSTGRES_*`. No guardes credenciales reales en Git.

## Swagger / OpenAPI

Con el servidor activo puedes consultar y probar toda la API desde:

```text
http://localhost:3000/api-docs
```

La especificación OpenAPI en JSON está disponible en:

```text
http://localhost:3000/api-docs.json
```

En Vercel, la interfaz carga los assets de Swagger UI desde jsDelivr y obtiene la
especificación desde `/api-docs.json`. Esto evita que el empaquetador serverless omita
los archivos estáticos.

Para probar rutas protegidas, inicia sesión, copia el token y pulsa **Authorize** en
Swagger usando el token JWT.

## Autenticación

Las rutas de tareas y el recordatorio manual requieren:

```http
Authorization: Bearer <token>
Content-Type: application/json
```

### Registrar usuario

`POST /api/auth/register`

```json
{
  "name": "Laura Gómez",
  "email": "laura@example.com",
  "phone": "+573001234567",
  "password": "secreto123"
}
```

### Iniciar sesión

`POST /api/auth/login`

```json
{
  "email": "laura@example.com",
  "password": "secreto123"
}
```

## Tareas

### Crear

`POST /api/tasks`

```json
{
  "title": "Entregar informe final",
  "description": "Adjuntar anexos y referencias",
  "category": "Universidad",
  "priority": "Alta",
  "status": "PENDING",
  "reminderDateTime": "2026-06-22T10:00:00-05:00",
  "source": "APP",
  "whatsappNumber": "+573001234567"
}
```

### Listar, buscar y filtrar

```http
GET /api/tasks?category=Universidad&priority=Alta&status=PENDING&search=informe&page=1&limit=20
```

### Obtener detalle

```http
GET /api/tasks/UUID_DE_LA_TAREA
```

### Actualizar

`PUT /api/tasks/UUID_DE_LA_TAREA`

```json
{
  "title": "Entregar informe corregido",
  "priority": "Media",
  "reminderDateTime": "2026-06-22T14:00:00-05:00"
}
```

El `PUT` admite actualizaciones parciales para facilitar la integración móvil.

### Completar

```http
PATCH /api/tasks/UUID_DE_LA_TAREA/complete
```

### Eliminar

```http
DELETE /api/tasks/UUID_DE_LA_TAREA
```

## WhatsApp y Twilio

### Webhook entrante

Configura en Twilio la URL pública:

```text
POST https://tu-dominio.com/api/twilio/webhook
```

Durante desarrollo puedes exponer el servidor con ngrok o Cloudflare Tunnel. Twilio envía
el cuerpo como `application/x-www-form-urlencoded`; Express ya está configurado para ello.
El teléfono remitente debe coincidir con el `phone` de un usuario registrado.

Mensajes admitidos:

```text
Crear tarea estudiar para parcial mañana 8 pm
Recordarme entregar informe el viernes a las 10 am
```

Las tareas creadas por WhatsApp usan inicialmente categoría `Personal`, prioridad `Media`
y estado `PENDING`.

### Recordatorio manual

`POST /api/twilio/send-reminder`

```json
{
  "taskId": "UUID_DE_LA_TAREA"
}
```

### Recordatorios automáticos

El proceso revisa cada minuto las tareas pendientes cuyo recordatorio está próximo o
vencido. Tras un envío exitoso guarda `reminderSentAt`, evitando repetirlo después de
reiniciar el servidor. Si se cambia `reminderDateTime`, ese campo se limpia y la tarea
puede volver a generar un recordatorio.

## Variables de entorno

| Variable | Descripción |
|---|---|
| `PORT` | Puerto HTTP |
| `DATABASE_URL` | Connection string principal; recomendada para Neon |
| `DATABASE_URL_UNPOOLED` | Connection string sin pooler como alternativa |
| `DB_HOST`, `DB_PORT`, `DB_NAME`, `DB_USER`, `DB_PASSWORD` | PostgreSQL |
| `DB_SSL` | Activa SSL para PostgreSQL |
| `DB_SYNC` | Sincroniza modelos automáticamente; usar solo en desarrollo |
| `DB_SYNC_ALTER` | Modifica tablas al sincronizar; no usar en producción |
| `JWT_SECRET`, `JWT_EXPIRES_IN` | Firma y duración de JWT |
| `TWILIO_ACCOUNT_SID`, `TWILIO_AUTH_TOKEN` | Credenciales Twilio |
| `TWILIO_WHATSAPP_NUMBER` | Remitente, por ejemplo `whatsapp:+14155238886` |
| `CORS_ORIGIN` | `*` o lista de orígenes separada por comas |
| `REMINDER_CRON` | Frecuencia del scheduler |
| `REMINDER_LOOKAHEAD_MINUTES` | Ventana anticipada de envío |
| `TZ` | Zona horaria del scheduler |

## Respuestas de la API

Éxito:

```json
{
  "success": true,
  "message": "Tarea creada correctamente",
  "data": {}
}
```

Error de validación:

```json
{
  "success": false,
  "message": "Los datos enviados no son válidos",
  "errors": [
    {
      "field": "title",
      "message": "El título es obligatorio"
    }
  ]
}
```

Estas respuestas estables son apropiadas para Retrofit/Kotlin Serialization en Android.
Las fechas se reciben y retornan en ISO 8601.

## Producción

- Usa un secreto JWT largo y aleatorio, HTTPS y un usuario PostgreSQL con permisos mínimos.
- Define `NODE_ENV=production`, `DB_SYNC=false`, `DB_SSL=true` cuando el proveedor lo exija
  y restringe `CORS_ORIGIN`.
- Gestiona el esquema mediante migraciones de Sequelize en lugar de `sequelize.sync`.
- Ejecuta el scheduler en una sola instancia dedicada. Con varias réplicas, usa una cola
  (BullMQ/Redis) o bloqueo distribuido para evitar carreras entre procesos.
- Despliega en Render, Railway, Fly.io, AWS, GCP o Azure y usa un PostgreSQL administrado.
- Conserva secretos en el gestor de secretos de la plataforma, no en Git.
- Añade rate limiting, Helmet, validación de firma de webhooks de Twilio, logs centralizados,
  métricas, copias de seguridad y pruebas automatizadas antes de publicar.
- Configura la URL pública del webhook en Twilio y verifica que el número de WhatsApp esté
  aprobado para producción.

## Despliegue en Vercel

El proyecto incluye `vercel.json` y el adaptador serverless `api/index.js`.

1. Importa el repositorio en Vercel.
2. En **Settings → Environment Variables**, configura como mínimo:

   ```text
   NODE_ENV=production
   DATABASE_URL=<connection string pooler de Neon>
   DB_SSL=true
   DB_SYNC=false
   JWT_SECRET=<secreto largo y aleatorio>
   CRON_SECRET=<secreto aleatorio de al menos 16 caracteres>
   CORS_ORIGIN=<origen permitido>
   ```

3. Añade también las variables de Twilio si usarás WhatsApp.
4. Despliega sin configurar un Build Command personalizado.

Todas las rutas se redirigen a la función Express. El cron de Vercel llama diariamente
a `GET /api/cron/reminders` y se autentica automáticamente mediante `CRON_SECRET`.
El plan Hobby solo permite una ejecución diaria; para recordatorios frecuentes necesitas
Vercel Pro o un scheduler externo.

No subas `.env`: Vercel debe recibir las variables desde su panel. Antes del primer
despliegue de producción, crea las tablas mediante migraciones o ejecuta temporalmente
la sincronización en un entorno controlado.


creado y desarrollado por AbicDev
