// Run with: npm test
const test = require("node:test");
const assert = require("node:assert/strict");
const { DEFAULTS, permissions, bookingDenied } = require("./settings");

const admin = { id: 1, role: "admin", canBook: false, canPoll: false };
const allowedUser = { id: 2, role: "regular", canBook: true, canPoll: true };
const newUser = { id: 3, role: "regular", canBook: false, canPoll: false };

test("with the defaults guests can book, users need their own rights", () => {
    assert.deepEqual(permissions(DEFAULTS, null), { booking: true, book: true, polls: true, createPolls: false });
    assert.deepEqual(permissions(DEFAULTS, newUser), { booking: true, book: false, polls: true, createPolls: false });
    assert.deepEqual(permissions(DEFAULTS, allowedUser), { booking: true, book: true, polls: true, createPolls: true });
});

test("guests can be required to log in", () => {
    const settings = { ...DEFAULTS, guestsCanBook: false };
    assert.equal(permissions(settings, null).book, false);
    assert.equal(permissions(settings, allowedUser).book, true);
    assert.equal(bookingDenied(settings, null).status, 401);
    assert.equal(bookingDenied(settings, newUser).status, 403);
});

test("a feature turned off is off for everyone but admins", () => {
    const settings = { bookingEnabled: false, pollsEnabled: false, guestsCanBook: true };
    for (const viewer of [null, allowedUser]) {
        assert.deepEqual(permissions(settings, viewer), { booking: false, book: false, polls: false, createPolls: false });
    }
    assert.deepEqual(permissions(settings, admin), { booking: true, book: true, polls: true, createPolls: true });
    assert.match(bookingDenied(settings, allowedUser).error, /nem elérhető/);
});
