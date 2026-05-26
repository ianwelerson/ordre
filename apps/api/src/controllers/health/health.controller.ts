type HealthResponse = {
  status: number;
  body: {
    status: 'OK';
    timestamp: string;
  };
};

export const healthController = (): HealthResponse => ({
  status: 200,
  body: {
    status: 'OK',
    timestamp: new Date().toISOString(),
  },
});
