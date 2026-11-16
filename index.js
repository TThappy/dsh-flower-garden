/**
 * Flower garden — Host half.
 *
 * The game is a memory-only page artifact: the browser half owns the View and
 * advances the garden from the wall clock, so this half has nothing to add to
 * the session log, the tool registry, or the prompt. It exists so the bundle
 * resolves to a loadable plugin row.
 */
export function apply() {}
