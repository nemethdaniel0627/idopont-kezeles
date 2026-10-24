// Run with: npm test
const test = require("node:test");
const assert = require("node:assert/strict");
const { hashPassword, verifyPassword, createToken, hashToken } = require("./passwords");
const { parseCookies, serializeCookie } = require("./cookies");
const { AttemptLimiter } = require("./limiter");
const { toEmail, toPassword, toPhone, toName } = require("./auth");
const { ValidationError } = require("./validation");

test("a hashed password verifies, a wrong one does not", async () => {
    const stored = await hashPassword("titkos-jelszo");
    assert.match(stored, /^scrypt\$[^$]+\$[^$]+$/);
    assert.equal(await verifyPassword("titkos-jelszo", stored), true);
    assert.equal(await verifyPassword("titkos-jelsz0", stored), false);
});

test("the same password gets a different salt every time", async () => {
    assert.notEqual(await hashPassword("ugyanaz123"), await hashPassword("ugyanaz123"));
});

test("a stored value in another format never verifies", async () => {
    assert.equal(await verifyPassword("akarmi123", "plain-text"), false);
    assert.equal(await verifyPassword("akarmi123", ""), false);
});

test("tokens are random and only their hash is stored", () => {
    const token = createToken();
    assert.notEqual(token, createToken());
    assert.ok(token.length >= 40);
    assert.equal(hashToken(token), hashToken(token));
    assert.match(hashToken(token), /^[0-9a-f]{64}$/);
});

test("cookies are read from the Cookie header", () => {
    assert.deepEqual(parseCookies("session=abc%20d; other=1"), { session: "abc d", other: "1" });
    assert.deepEqual(parseCookies(""), {});
    assert.deepEqual(parseCookies(undefined), {});
    // The first one wins, like in browsers
    assert.deepEqual(parseCookies("a=1; a=2"), { a: "1" });
});

test("the session cookie is HttpOnly and SameSite, Secure when asked", () => {
    assert.equal(serializeCookie("session", "t", { maxAge: 60 }), "session=t; Path=/; SameSite=Lax; Max-Age=60; HttpOnly");
    assert.match(serializeCookie("session", "t", { secure: true }), /; Secure$/);
    assert.match(serializeCookie("session", "", { maxAge: 0 }), /Max-Age=0/);
});

test("the attempt limiter limits within its window and forgets after it", () => {
    let now = 0;
    const limiter = new AttemptLimiter(3, 1000, () => now);
    limiter.record("k"); limiter.record("k");
    assert.equal(limiter.isLimited("k"), false);
    limiter.record("k");
    assert.equal(limiter.isLimited("k"), true);
    assert.equal(limiter.isLimited("other"), false);
    now = 1001;
    assert.equal(limiter.isLimited("k"), false);
    limiter.record("k"); limiter.record("k"); limiter.record("k");
    limiter.reset("k");
    assert.equal(limiter.isLimited("k"), false);
});

test("emails are trimmed, lower-cased and checked", () => {
    assert.equal(toEmail("  Anna.Kiss@Example.HU "), "anna.kiss@example.hu");
    assert.throws(() => toEmail("nem-email"), ValidationError);
    assert.throws(() => toEmail("a@b"), ValidationError);
    assert.throws(() => toEmail(undefined), ValidationError);
});

test("passwords need at least 8 characters", () => {
    assert.equal(toPassword("12345678"), "12345678");
    assert.throws(() => toPassword("1234567"), /legalább 8 karakter/);
    assert.throws(() => toPassword(12345678), ValidationError);
});

test("phone numbers allow digits and the usual signs, names are trimmed", () => {
    assert.equal(toPhone(" +36 (30) 123-4567 "), "+36 (30) 123-4567");
    assert.equal(toPhone(undefined), "");
    assert.throws(() => toPhone("hívj fel"), /Hibás telefonszám/);
    assert.equal(toName("  Kiss Anna "), "Kiss Anna");
    assert.throws(() => toName("x".repeat(101)), ValidationError);
});
