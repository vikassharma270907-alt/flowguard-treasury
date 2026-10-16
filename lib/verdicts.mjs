/**
 * ESM re-export of the shared classification module (lib/verdicts.js).
 * Kept so gateway/ and scripts/ keep their original import paths.
 */
export { VERDICT_BY_ERROR_NAME, classifyError, explain } from './verdicts.js';
