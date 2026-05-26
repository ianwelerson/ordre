import { env } from '#env';

import { app } from './server.ts';

app.listen(env.PORT, () => {
  console.log(`Server running on port ${env.PORT}`);
});
