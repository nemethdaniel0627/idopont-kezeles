const SMALLINT_MAX = 32767;

// A problem with the request itself, its message is shown to the user
class ValidationError extends Error { }

// An error with its own status code, its message is shown to the user (e.g. 401 for a failed login)
class HttpError extends Error {
    constructor(status, message) {
        super(message);
        this.status = status;
    }
}

function toPositiveSmallint(value, message) {
    const number = Number(value);
    if (!Number.isInteger(number) || number < 1 || number > SMALLINT_MAX) {
        throw new ValidationError(message);
    }
    return number;
}

function toDate(value, message) {
    const date = new Date(value);
    if (value === null || value === undefined || isNaN(date)) {
        throw new ValidationError(message);
    }
    return date;
}

// A trimmed, non-empty text
function toTitle(value, message) {
    const title = typeof value === "string" ? value.trim() : "";
    if (title === "") throw new ValidationError(message);
    return title;
}

// A positive integer id from a URL parameter, or null
function toId(value) {
    const id = Number(value);
    return Number.isInteger(id) && id > 0 ? id : null;
}

module.exports = { ValidationError, HttpError, toPositiveSmallint, toDate, toTitle, toId };
