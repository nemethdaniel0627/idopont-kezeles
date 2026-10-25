// What this browser remembers of its answer to a poll: { name, editKey }. Storage can be missing or
// blocked (private window, cleared data), so every access may fail and the page works without it.
const storageKey = pollKey => `poll-answer:${pollKey}`;

export function remembered(pollKey) {
    try {
        return JSON.parse(window.localStorage.getItem(storageKey(pollKey))) || null;
    } catch (err) {
        return null;
    }
}

export function remember(pollKey, value) {
    try {
        if (value === null) window.localStorage.removeItem(storageKey(pollKey));
        else window.localStorage.setItem(storageKey(pollKey), JSON.stringify(value));
    } catch (err) {
        // Not remembered; the private edit link still works
    }
}

// The private link that opens the answer for editing in any browser
export const privateLink = (pollKey, editKey) => `${window.location.origin}/egyeztetes/${pollKey}?valasz=${encodeURIComponent(editKey)}`;
