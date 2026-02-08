export const BUSINESS_RULES = Object.freeze({
  auth: {
    loginMaxAttempts: 3,
    loginLockoutMinutes: 30,
    mfaTokenTtl: '5m',
    totpStepSeconds: 30,
    totpWindow: 1,
    totpDigits: 6,
  },
  proyectos: {
    rolesAsignacion: [
      'Tech Lead',
      'Desarrollador',
      'QA / Tester',
      'Diseñador',
      'Analista',
      'Product Owner',
      'Scrum Master',
      'DevOps',
      'Consultor',
    ],
  },
});
