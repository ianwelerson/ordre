type HealthResponse = {
  status: number;
  body: {
    ok: true;
    timestamp: string;
  };
};

export const healthController = (): HealthResponse => ({
  status: 200,
  body: {
    ok: true,
    timestamp: new Date().toISOString(),
  },
});
