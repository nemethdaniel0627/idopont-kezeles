// Counts attempts per key (e.g. IP and email) within a time window, in memory.
// Used against password guessing; it starts empty when the server restarts.
class AttemptLimiter {
    constructor(maxAttempts, windowMs, now = () => Date.now()) {
        this.maxAttempts = maxAttempts;
        this.windowMs = windowMs;
        this.now = now;
        this.attempts = new Map();
    }

    // The attempt times of key that are still inside the window
    recent(key) {
        const since = this.now() - this.windowMs;
        const times = (this.attempts.get(key) || []).filter(time => time > since);
        if (times.length === 0) this.attempts.delete(key);
        else this.attempts.set(key, times);
        return times;
    }

    isLimited(key) {
        return this.recent(key).length >= this.maxAttempts;
    }

    record(key) {
        this.attempts.set(key, [...this.recent(key), this.now()]);
    }

    reset(key) {
        this.attempts.delete(key);
    }
}

module.exports = { AttemptLimiter };
