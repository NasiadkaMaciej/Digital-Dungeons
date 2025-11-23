/**
 * Normalises a raw input string into a simple command structure.
 * Always uppercases, strips extra whitespace.
 */
export function parseCommand(raw) {
    if (!raw) return null;

    const trimmed = raw.trim();
    if (!trimmed) return null;

    const upper = trimmed.toUpperCase();
    const parts = upper.split(/\s+/);
    const [verb, ...args] = parts;

    return {
        verb,
        args,
        raw: upper,
    };
}