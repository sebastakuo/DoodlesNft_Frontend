// src/environments/environment.ts
// NOTA: Las claves aquí definidas se exponen en el cliente (frontend). No coloques secretos sensibles de producción.
export const environment = {
  production: false,
  // Solo datos públicos para el frontend
  GEMINI_API_KEY: '',
  hedera: {
    accountId: '',
    privateKey: '',
  },
};

