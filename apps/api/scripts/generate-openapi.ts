import fs from 'node:fs';

import { openApiSpec } from '../src/config/openapi.ts';

// Write the generated openapi docs ito the api-docs folder
fs.writeFileSync('../../apps/api-docs/openapi/openapi.json', JSON.stringify(openApiSpec, null, 2));
