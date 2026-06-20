const dotenv = require('dotenv');
const path = require('path');

dotenv.config({ path: path.resolve(__dirname, '../../.env') });

const toBoolean = (value, fallback = false) => {
  if (value === undefined) return fallback;
  return value.toLowerCase() === 'true';
};

const cleanValue = (value) => (typeof value === 'string' ? value.trim() : '');

const connectionUrl =
  cleanValue(process.env.DATABASE_URL)
  || cleanValue(process.env.POSTGRES_URL)
  || cleanValue(process.env.DATABASE_URL_UNPOOLED)
  || cleanValue(process.env.POSTGRES_URL_NON_POOLING)
  || '';

const database = {
  url: connectionUrl,
  host:
    cleanValue(process.env.DB_HOST)
    || cleanValue(process.env.PGHOST)
    || cleanValue(process.env.POSTGRES_HOST)
    || 'localhost',
  port: Number(process.env.DB_PORT || process.env.PGPORT) || 5432,
  name:
    cleanValue(process.env.DB_NAME)
    || cleanValue(process.env.PGDATABASE)
    || cleanValue(process.env.POSTGRES_DATABASE)
    || 'todoapp',
  user:
    cleanValue(process.env.DB_USER)
    || cleanValue(process.env.PGUSER)
    || cleanValue(process.env.POSTGRES_USER)
    || 'postgres',
  password:
    cleanValue(process.env.DB_PASSWORD)
    || cleanValue(process.env.PGPASSWORD)
    || cleanValue(process.env.POSTGRES_PASSWORD)
    || '',
  ssl: toBoolean(process.env.DB_SSL, Boolean(connectionUrl && /sslmode=require/i.test(connectionUrl))),
  sync: toBoolean(process.env.DB_SYNC, process.env.NODE_ENV !== 'production'),
  alter: toBoolean(process.env.DB_SYNC_ALTER),
};

const validateDatabaseConfig = () => {
  if (database.url) {
    let parsedUrl;
    try {
      parsedUrl = new URL(database.url);
    } catch {
      throw new Error(
        'DATABASE_URL no es una URL válida. Copia el connection string completo de Neon.',
      );
    }

    if (!['postgres:', 'postgresql:'].includes(parsedUrl.protocol)) {
      throw new Error('DATABASE_URL debe comenzar con postgres:// o postgresql://.');
    }
    if (!parsedUrl.username || !parsedUrl.password || !parsedUrl.hostname) {
      throw new Error('DATABASE_URL debe incluir usuario, contraseña y host de PostgreSQL.');
    }
    return;
  }

  if (!database.password) {
    throw new Error(
      'No hay credenciales de PostgreSQL configuradas. Crea el archivo .env desde '
      + '.env.example y define DATABASE_URL (recomendado para Neon) o DB_PASSWORD.',
    );
  }
};

const validateEnvironment = () => {
  validateDatabaseConfig();

  if (process.env.NODE_ENV === 'production') {
    const missing = [];
    if (!process.env.JWT_SECRET) missing.push('JWT_SECRET');
    if (missing.length) {
      throw new Error(`Faltan variables de entorno requeridas: ${missing.join(', ')}`);
    }
  }
};

module.exports = {
  nodeEnv: process.env.NODE_ENV || 'development',
  port: Number(process.env.PORT) || 3000,
  database,
  jwt: {
    secret: process.env.JWT_SECRET || 'development-only-secret-change-me',
    expiresIn: process.env.JWT_EXPIRES_IN || '7d',
  },
  cronSecret: cleanValue(process.env.CRON_SECRET),
  twilio: {
    accountSid: process.env.TWILIO_ACCOUNT_SID || '',
    authToken: process.env.TWILIO_AUTH_TOKEN || '',
    whatsappNumber: process.env.TWILIO_WHATSAPP_NUMBER || '',
  },
  corsOrigin: process.env.CORS_ORIGIN || '*',
  reminder: {
    cron: process.env.REMINDER_CRON || '*/1 * * * *',
    lookaheadMinutes: Number(process.env.REMINDER_LOOKAHEAD_MINUTES) || 5,
  },
  validateEnvironment,
};
