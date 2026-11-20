import 'dotenv/config';
export const PORT = process.env.PORT || 4000;
export const JWT_SECRET = process.env.JWT_SECRET || 'esumer-parking-dev-secret';
export const DATABASE_URL = process.env.DATABASE_URL || 'postgres://postgres:postgres@localhost:5432/esumer_parking';
export const RATE_PER_HOUR = 3000; // COP por hora de reserva
