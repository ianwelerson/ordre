import fs from 'node:fs';

import { openApiSpec } from '../src/config/openapi.ts';

// Write the generated OpenAPI spec into the docs app, where Scalar serves it.
fs.writeFileSync('../../apps/docs/public/openapi.json', JSON.stringify(openApiSpec, null, 2));
