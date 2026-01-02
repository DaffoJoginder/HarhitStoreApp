import dotenv from "dotenv";
import { env } from "prisma/config";
dotenv.config();

const config = {
  datasource: {
    url: env("DATABASE_URL"),
  },
};

export default config;
