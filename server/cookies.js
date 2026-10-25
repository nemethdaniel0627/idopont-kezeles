// The cookies of a request's Cookie header, as { name: value }
function parseCookies(header) {
    const cookies = {};
    String(header || '').split(';').forEach(part => {
        const index = part.indexOf('=');
        if (index === -1) return;
        const name = part.slice(0, index).trim();
        if (name === '' || name in cookies) return;
        try {
            cookies[name] = decodeURIComponent(part.slice(index + 1).trim());
        } catch {
            // A badly encoded value is ignored
        }
    });
    return cookies;
}

// A Set-Cookie header value. maxAge in seconds; 0 removes the cookie.
function serializeCookie(name, value, { maxAge, httpOnly = true, sameSite = 'Lax', secure = false, path = '/' } = {}) {
    let cookie = `${name}=${encodeURIComponent(value)}; Path=${path}; SameSite=${sameSite}`;
    if (maxAge !== undefined) cookie += `; Max-Age=${maxAge}`;
    if (httpOnly) cookie += '; HttpOnly';
    if (secure) cookie += '; Secure';
    return cookie;
}

module.exports = { parseCookies, serializeCookie };
