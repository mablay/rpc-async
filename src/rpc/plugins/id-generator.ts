/**
 * Choosing the right ID generator for RPC response mapping
 * is cruicial.
 * 
 * You probably want to:
 * - avoid ID collisions
 * - keep messages small
 * - compute IDs quickly
 *
 * Example IDs of the current implementation:
 * - evcumwc45y
 * - kullnul1ejc
 * - oijqdyl93lo
 * - w3dr8813jg
 * 
 * Pobability of pairwise collision is < 1 / 3.656.158.440.062.976
 * 
 * You might have good reasons to bring your own ID generator like:
 * - [nanoid](https://www.npmjs.com/package/nanoid)
 * - [uuid](https://www.npmjs.com/package/uuid)
 * 
 * In that case, see [README.md](../README.md) for instructions. 
 */
export default () => Math.random().toString(36).slice(2)
