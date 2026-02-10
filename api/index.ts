import { createRequire } from 'module';
const require = createRequire(import.meta.url);

// Import the compiled server
const serverModule = require('../dist/index.cjs');

export default serverModule.default || serverModule;
