const express = require('express');
const cors = require('cors');
const morgan = require('morgan');
const swaggerUi = require('swagger-ui-express');
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
const swaggerSetup = swaggerUi.setup(swaggerDocument, {
  customSiteTitle: 'TODoApp API Docs',
  swaggerOptions: { persistAuthorization: true },
});

app.use(
  '/api-docs',
  swaggerUi.serve,
  (req, res, next) => {
    if (req.path === '/' || req.path === '/swagger-ui-init.js') {
      return swaggerSetup(req, res, next);
    }
    return next();
  },
);

app.use('/api/auth', authRoutes);
app.use('/api/tasks', taskRoutes);
app.use('/api/twilio', twilioRoutes);
app.use('/api/cron', reminderRoutes);

app.use(notFound);
app.use(errorHandler);

module.exports = app;
