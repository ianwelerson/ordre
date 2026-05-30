import { env } from '../../config/env.ts';
import { app } from './server.ts';

app.listen(env.PORT, () => {
  console.log(`Server running on port ${env.PORT}`);
});
