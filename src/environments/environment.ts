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
  walletConnect: {
    projectId: '6b4a043d41023cf912377f0abdcbc511',
    recommendedWalletIds: [
      'a29498d225fa4b13468ff4d6cf4ae0ea4adcbd95f07ce8a843a1dee10b632f3f',
      'c40c24b39500901a330a025938552d70def4890fffe9bd315046bd33a2ece24d',
    ],
  },
};

