export const PORT = Number(process.env.PORT) || 3000;
export const DATABASE_URL =
  process.env.DATABASE_URL ||
  "postgres://localhost:5432/gasrelay_development?sslmode=disable";
