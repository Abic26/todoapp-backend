const express = require('express');
const cors = require('cors');
const morgan = require('morgan');
const env = require('./config/env');
const swaggerDocument = require('./config/swagger');
const authRoutes = require('./routes/authRoutes');
const taskRoutes = require('./routes/taskRoutes');
const twilioRoutes = require('./routes/twilioRoutes');
const reminderRoutes = require('./routes/reminderRoutes');
const { notFound, errorHandler } = require('./middlewares/errorMiddleware');

const app = express();

const allowedOrigins =
  env.corsOrigin === '*' ? '*' : env.corsOrigin.split(',').map((origin) => origin.trim());

app.disable('x-powered-by');
app.use(cors({ origin: allowedOrigins, credentials: allowedOrigins !== '*' }));
app.use(morgan(env.nodeEnv === 'production' ? 'combined' : 'dev'));
app.use(express.json({ limit: '100kb' }));
app.use(express.urlencoded({ extended: false }));

app.get('/health', (req, res) => {
  res.json({ success: true, message: 'TODoApp API disponible' });
});

app.get('/api-docs.json', (req, res) => res.json(swaggerDocument));
app.get(['/api-docs', '/api-docs/'], (req, res) => {
  res.type('html').send(`<!doctype html>
<html lang="es">
  <head>
    <meta charset="utf-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1" />
    <title>TODoApp API Docs</title>
    <link
      rel="stylesheet"
      href="https://cdn.jsdelivr.net/npm/swagger-ui-dist@5/swagger-ui.css"
    />
  </head>
  <body>
    <div id="swagger-ui"></div>
    <script src="https://cdn.jsdelivr.net/npm/swagger-ui-dist@5/swagger-ui-bundle.js"></script>
    <script
      src="https://cdn.jsdelivr.net/npm/swagger-ui-dist@5/swagger-ui-standalone-preset.js"
    ></script>
    <script>
      window.onload = () => {
        window.ui = SwaggerUIBundle({
          url: '/api-docs.json',
          dom_id: '#swagger-ui',
          deepLinking: true,
          persistAuthorization: true,
          presets: [SwaggerUIBundle.presets.apis, SwaggerUIStandalonePreset],
          layout: 'StandaloneLayout'
        });
      };
    </script>
  </body>
</html>`);
});

app.use('/api/auth', authRoutes);
app.use('/api/tasks', taskRoutes);
app.use('/api/twilio', twilioRoutes);
app.use('/api/cron', reminderRoutes);

app.use(notFound);
app.use(errorHandler);

module.exports = app;
