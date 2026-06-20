const env = require('./env');

const taskProperties = {
  id: { type: 'string', format: 'uuid' },
  userId: { type: 'string', format: 'uuid' },
  title: { type: 'string', example: 'Entregar informe final' },
  description: { type: 'string', nullable: true, example: 'Adjuntar referencias' },
  category: {
    type: 'string',
    enum: ['Personal', 'Trabajo', 'Universidad'],
    example: 'Universidad',
  },
  priority: { type: 'string', enum: ['Alta', 'Media', 'Baja'], example: 'Alta' },
  status: {
    type: 'string',
    enum: ['PENDING', 'COMPLETED', 'CANCELLED'],
    example: 'PENDING',
  },
  reminderDateTime: {
    type: 'string',
    format: 'date-time',
    nullable: true,
    example: '2026-06-22T10:00:00-05:00',
  },
  reminderSentAt: { type: 'string', format: 'date-time', nullable: true },
  source: { type: 'string', enum: ['APP', 'WHATSAPP'], example: 'APP' },
  whatsappNumber: { type: 'string', nullable: true, example: '+573001234567' },
  createdAt: { type: 'string', format: 'date-time' },
  updatedAt: { type: 'string', format: 'date-time' },
};

const successResponse = (description, schema) => ({
  description,
  content: {
    'application/json': {
      schema: {
        allOf: [
          { $ref: '#/components/schemas/SuccessResponse' },
          { type: 'object', properties: { data: schema } },
        ],
      },
    },
  },
});

const errorResponses = {
  401: {
    description: 'Token ausente, inválido o expirado',
    content: { 'application/json': { schema: { $ref: '#/components/schemas/ErrorResponse' } } },
  },
  404: {
    description: 'Recurso no encontrado',
    content: { 'application/json': { schema: { $ref: '#/components/schemas/ErrorResponse' } } },
  },
  422: {
    description: 'Datos de entrada no válidos',
    content: { 'application/json': { schema: { $ref: '#/components/schemas/ErrorResponse' } } },
  },
};

const swaggerDocument = {
  openapi: '3.0.3',
  info: {
    title: 'TODoApp API',
    version: '1.0.0',
    description:
      'API REST para autenticación, gestión de tareas y recordatorios por WhatsApp.',
  },
  servers: [
    {
      url: `http://localhost:${env.port}`,
      description: 'Entorno local',
    },
  ],
  tags: [
    { name: 'System', description: 'Estado del servicio' },
    { name: 'Auth', description: 'Registro e inicio de sesión' },
    { name: 'Tasks', description: 'Gestión de tareas del usuario autenticado' },
    { name: 'Twilio', description: 'Integración con WhatsApp' },
  ],
  paths: {
    '/health': {
      get: {
        tags: ['System'],
        summary: 'Consultar estado de la API',
        responses: {
          200: successResponse('API disponible', { type: 'object', nullable: true }),
        },
      },
    },
    '/api/auth/register': {
      post: {
        tags: ['Auth'],
        summary: 'Registrar un usuario',
        requestBody: {
          required: true,
          content: {
            'application/json': {
              schema: { $ref: '#/components/schemas/RegisterRequest' },
            },
          },
        },
        responses: {
          201: successResponse('Usuario registrado', {
            $ref: '#/components/schemas/AuthData',
          }),
          409: {
            description: 'Email o teléfono ya registrado',
            content: {
              'application/json': { schema: { $ref: '#/components/schemas/ErrorResponse' } },
            },
          },
          422: errorResponses[422],
        },
      },
    },
    '/api/auth/login': {
      post: {
        tags: ['Auth'],
        summary: 'Iniciar sesión',
        requestBody: {
          required: true,
          content: {
            'application/json': { schema: { $ref: '#/components/schemas/LoginRequest' } },
          },
        },
        responses: {
          200: successResponse('Inicio de sesión exitoso', {
            $ref: '#/components/schemas/AuthData',
          }),
          401: errorResponses[401],
          422: errorResponses[422],
        },
      },
    },
    '/api/tasks': {
      get: {
        tags: ['Tasks'],
        summary: 'Listar, buscar y filtrar tareas',
        security: [{ bearerAuth: [] }],
        parameters: [
          {
            name: 'category',
            in: 'query',
            schema: { type: 'string', enum: ['Personal', 'Trabajo', 'Universidad'] },
          },
          {
            name: 'priority',
            in: 'query',
            schema: { type: 'string', enum: ['Alta', 'Media', 'Baja'] },
          },
          {
            name: 'status',
            in: 'query',
            schema: { type: 'string', enum: ['PENDING', 'COMPLETED', 'CANCELLED'] },
          },
          { name: 'search', in: 'query', schema: { type: 'string' } },
          { name: 'page', in: 'query', schema: { type: 'integer', minimum: 1, default: 1 } },
          {
            name: 'limit',
            in: 'query',
            schema: { type: 'integer', minimum: 1, maximum: 100, default: 20 },
          },
        ],
        responses: {
          200: successResponse('Tareas obtenidas', {
            $ref: '#/components/schemas/TaskListData',
          }),
          401: errorResponses[401],
          422: errorResponses[422],
        },
      },
      post: {
        tags: ['Tasks'],
        summary: 'Crear una tarea',
        security: [{ bearerAuth: [] }],
        requestBody: {
          required: true,
          content: {
            'application/json': { schema: { $ref: '#/components/schemas/CreateTaskRequest' } },
          },
        },
        responses: {
          201: successResponse('Tarea creada', { $ref: '#/components/schemas/Task' }),
          401: errorResponses[401],
          422: errorResponses[422],
        },
      },
    },
    '/api/tasks/{id}': {
      parameters: [{ $ref: '#/components/parameters/TaskId' }],
      get: {
        tags: ['Tasks'],
        summary: 'Obtener una tarea',
        security: [{ bearerAuth: [] }],
        responses: {
          200: successResponse('Tarea obtenida', { $ref: '#/components/schemas/Task' }),
          401: errorResponses[401],
          404: errorResponses[404],
          422: errorResponses[422],
        },
      },
      put: {
        tags: ['Tasks'],
        summary: 'Actualizar una tarea',
        description: 'Admite actualización parcial de los campos enviados.',
        security: [{ bearerAuth: [] }],
        requestBody: {
          required: true,
          content: {
            'application/json': { schema: { $ref: '#/components/schemas/UpdateTaskRequest' } },
          },
        },
        responses: {
          200: successResponse('Tarea actualizada', { $ref: '#/components/schemas/Task' }),
          401: errorResponses[401],
          404: errorResponses[404],
          422: errorResponses[422],
        },
      },
      delete: {
        tags: ['Tasks'],
        summary: 'Eliminar una tarea',
        security: [{ bearerAuth: [] }],
        responses: {
          200: successResponse('Tarea eliminada', { type: 'object', nullable: true }),
          401: errorResponses[401],
          404: errorResponses[404],
          422: errorResponses[422],
        },
      },
    },
    '/api/tasks/{id}/complete': {
      patch: {
        tags: ['Tasks'],
        summary: 'Marcar una tarea como completada',
        security: [{ bearerAuth: [] }],
        parameters: [{ $ref: '#/components/parameters/TaskId' }],
        responses: {
          200: successResponse('Tarea completada', { $ref: '#/components/schemas/Task' }),
          401: errorResponses[401],
          404: errorResponses[404],
          422: errorResponses[422],
        },
      },
    },
    '/api/twilio/webhook': {
      post: {
        tags: ['Twilio'],
        summary: 'Recibir un mensaje entrante de WhatsApp',
        description:
          'Endpoint llamado por Twilio. Admite mensajes como "Crear tarea estudiar mañana 8 pm".',
        requestBody: {
          required: true,
          content: {
            'application/x-www-form-urlencoded': {
              schema: {
                type: 'object',
                required: ['From', 'Body'],
                properties: {
                  From: { type: 'string', example: 'whatsapp:+573001234567' },
                  Body: {
                    type: 'string',
                    example: 'Recordarme entregar informe el viernes a las 10 am',
                  },
                },
              },
            },
          },
        },
        responses: {
          200: {
            description: 'Respuesta TwiML para WhatsApp',
            content: { 'text/xml': { schema: { type: 'string' } } },
          },
        },
      },
    },
    '/api/twilio/send-reminder': {
      post: {
        tags: ['Twilio'],
        summary: 'Enviar manualmente el recordatorio de una tarea',
        security: [{ bearerAuth: [] }],
        requestBody: {
          required: true,
          content: {
            'application/json': {
              schema: {
                type: 'object',
                required: ['taskId'],
                properties: { taskId: { type: 'string', format: 'uuid' } },
              },
            },
          },
        },
        responses: {
          200: successResponse('Recordatorio enviado', {
            type: 'object',
            properties: {
              task: { $ref: '#/components/schemas/Task' },
              messageSid: { type: 'string' },
            },
          }),
          401: errorResponses[401],
          404: errorResponses[404],
          422: errorResponses[422],
        },
      },
    },
    '/api/cron/reminders': {
      get: {
        tags: ['System'],
        summary: 'Procesar recordatorios pendientes desde Vercel Cron',
        description:
          'Endpoint interno. Vercel envía automáticamente CRON_SECRET como token Bearer.',
        security: [{ cronAuth: [] }],
        responses: {
          200: successResponse('Recordatorios procesados', {
            type: 'object',
            properties: {
              skipped: { type: 'boolean' },
              processed: { type: 'integer' },
              sent: { type: 'integer' },
              failed: { type: 'integer' },
            },
          }),
          401: errorResponses[401],
        },
      },
    },
  },
  components: {
    securitySchemes: {
      bearerAuth: {
        type: 'http',
        scheme: 'bearer',
        bearerFormat: 'JWT',
      },
      cronAuth: {
        type: 'http',
        scheme: 'bearer',
        description: 'Valor configurado en CRON_SECRET.',
      },
    },
    parameters: {
      TaskId: {
        name: 'id',
        in: 'path',
        required: true,
        description: 'UUID de la tarea',
        schema: { type: 'string', format: 'uuid' },
      },
    },
    schemas: {
      SuccessResponse: {
        type: 'object',
        required: ['success', 'message', 'data'],
        properties: {
          success: { type: 'boolean', example: true },
          message: { type: 'string' },
          data: {},
        },
      },
      ErrorResponse: {
        type: 'object',
        required: ['success', 'message'],
        properties: {
          success: { type: 'boolean', example: false },
          message: { type: 'string' },
          errors: {
            type: 'array',
            items: {
              type: 'object',
              properties: {
                field: { type: 'string' },
                message: { type: 'string' },
                value: {},
              },
            },
          },
        },
      },
      User: {
        type: 'object',
        properties: {
          id: { type: 'string', format: 'uuid' },
          name: { type: 'string', example: 'Laura Gómez' },
          email: { type: 'string', format: 'email', example: 'laura@example.com' },
          phone: { type: 'string', nullable: true, example: '+573001234567' },
          createdAt: { type: 'string', format: 'date-time' },
        },
      },
      RegisterRequest: {
        type: 'object',
        required: ['name', 'email', 'password'],
        properties: {
          name: { type: 'string', maxLength: 120, example: 'Laura Gómez' },
          email: { type: 'string', format: 'email', example: 'laura@example.com' },
          phone: { type: 'string', example: '+573001234567' },
          password: { type: 'string', format: 'password', minLength: 6, example: 'secreto123' },
        },
      },
      LoginRequest: {
        type: 'object',
        required: ['email', 'password'],
        properties: {
          email: { type: 'string', format: 'email', example: 'laura@example.com' },
          password: { type: 'string', format: 'password', example: 'secreto123' },
        },
      },
      AuthData: {
        type: 'object',
        properties: {
          token: { type: 'string' },
          user: { $ref: '#/components/schemas/User' },
        },
      },
      Task: {
        type: 'object',
        properties: taskProperties,
      },
      CreateTaskRequest: {
        type: 'object',
        required: ['title'],
        properties: {
          title: taskProperties.title,
          description: taskProperties.description,
          category: taskProperties.category,
          priority: taskProperties.priority,
          status: taskProperties.status,
          reminderDateTime: taskProperties.reminderDateTime,
          source: taskProperties.source,
          whatsappNumber: taskProperties.whatsappNumber,
        },
      },
      UpdateTaskRequest: {
        type: 'object',
        properties: {
          title: taskProperties.title,
          description: taskProperties.description,
          category: taskProperties.category,
          priority: taskProperties.priority,
          status: taskProperties.status,
          reminderDateTime: taskProperties.reminderDateTime,
          source: taskProperties.source,
          whatsappNumber: taskProperties.whatsappNumber,
        },
      },
      TaskListData: {
        type: 'object',
        properties: {
          tasks: { type: 'array', items: { $ref: '#/components/schemas/Task' } },
          pagination: {
            type: 'object',
            properties: {
              page: { type: 'integer' },
              limit: { type: 'integer' },
              total: { type: 'integer' },
              pages: { type: 'integer' },
            },
          },
        },
      },
    },
  },
};

module.exports = swaggerDocument;
