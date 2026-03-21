import { Sequelize } from "sequelize";
import { POSTGRES_URL, NODE_ENV } from "./env.js";

const isProduction = NODE_ENV !== "development";

const sequelizeOptions = {
  dialect: "postgres",
  protocol: "postgres",
  logging: false,
  // Evitar problemas de compatibilidad con algunos entornos de producción
  native: false,
};

// Añadir SSL solo en producción
if (isProduction) {
  sequelizeOptions.dialectOptions = {
    ssl: {
      require: true,
      rejectUnauthorized: false,
    },
  };
}

export const sequelize = new Sequelize(POSTGRES_URL, sequelizeOptions);
