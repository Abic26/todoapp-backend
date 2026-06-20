const app = require('../src/app');
const env = require('../src/config/env');
const { sequelize } = require('../src/models');

let initializationPromise;

const initializeDatabase = async () => {
  env.validateEnvironment();
  await sequelize.authenticate();

  if (env.database.sync) {
    await sequelize.sync({ alter: env.database.alter });
  }
};

module.exports = async (req, res) => {
  try {
    if (!initializationPromise) {
      initializationPromise = initializeDatabase().catch((error) => {
        initializationPromise = null;
        throw error;
      });
    }

    await initializationPromise;
    return app(req, res);
  } catch (error) {
    console.error(`No fue posible inicializar la API: ${error.message}`);
    return res.status(500).json({
      success: false,
      message: 'No fue posible conectar la API con la base de datos',
    });
  }
};
