// Run with: npm test
const test = require("node:test");
const assert = require("node:assert/strict");
const crypto = require("crypto");

process.env.DATA_ENCRYPTION_KEY = crypto.randomBytes(32).toString("base64");
const { encrypt, decrypt, decryptRow, lookupHash, isEncrypted } = require("./encryption");

test("a value is stored encrypted and read back", () => {
    const stored = encrypt("Kiss Anna <anna@example.hu>");
    assert.ok(isEncrypted(stored));
    assert.ok(!stored.includes("Anna") && !stored.includes("example"));
    assert.equal(decrypt(stored), "Kiss Anna <anna@example.hu>");
});

test("the same value is encrypted differently each time", () => {
    assert.notEqual(encrypt("anna@example.hu"), encrypt("anna@example.hu"));
});

test("empty values stay empty, and are not encrypted twice", () => {
    assert.equal(encrypt(""), "");
    assert.equal(encrypt(null), null);
    const once = encrypt("Béla");
    assert.equal(encrypt(once), once);
});

test("plain text saved before encryption reads as it is", () => {
    assert.equal(decrypt("anna@example.hu"), "anna@example.hu");
    assert.deepEqual(decryptRow({ id: 1, name: encrypt("Anna"), role: "admin" }, ["name", "email"]), { id: 1, name: "Anna", role: "admin" });
});

test("a changed value is refused, not read wrong", () => {
    const stored = encrypt("anna@example.hu");
    const tampered = stored.slice(0, -4) + (stored.endsWith("AAAA") ? "BBBB" : "AAAA");
    assert.throws(() => decrypt(tampered));
});

test("the lookup hash ignores case and spaces, and does not show the value", () => {
    assert.equal(lookupHash(" Anna@Example.hu "), lookupHash("anna@example.hu"));
    assert.equal(lookupHash("Kiss   Anna"), lookupHash("kiss anna"));
    assert.notEqual(lookupHash("anna@example.hu"), lookupHash("bela@example.hu"));
    assert.ok(!lookupHash("anna@example.hu").includes("anna"));
    assert.equal(lookupHash(""), null);
    assert.equal(lookupHash("   "), null);
});
