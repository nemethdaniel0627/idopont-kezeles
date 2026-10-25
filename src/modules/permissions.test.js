import { permissions, bookingBlockedText } from "./permissions";

const defaults = { bookingEnabled: true, pollsEnabled: true, guestsCanBook: true };
const admin = { id: 1, role: "admin", canBook: false, canPoll: false };
const allowedUser = { id: 2, role: "regular", canBook: true, canPoll: true };
const newUser = { id: 3, role: "regular", canBook: false, canPoll: false };

test("guests book by the guest switch, users by their own rights", () => {
    expect(permissions(defaults, null).book).toBe(true);
    expect(permissions({ ...defaults, guestsCanBook: false }, null).book).toBe(false);
    expect(permissions(defaults, newUser)).toEqual({ booking: true, book: false, polls: true, createPolls: false });
    expect(permissions(defaults, allowedUser)).toEqual({ booking: true, book: true, polls: true, createPolls: true });
});

test("a feature turned off is off for everyone but admins", () => {
    const off = { bookingEnabled: false, pollsEnabled: false, guestsCanBook: true };
    expect(permissions(off, allowedUser)).toEqual({ booking: false, book: false, polls: false, createPolls: false });
    expect(permissions(off, admin)).toEqual({ booking: true, book: true, polls: true, createPolls: true });
});

test("the calendar tells why booking is not possible", () => {
    expect(bookingBlockedText(defaults, allowedUser)).toBe(null);
    expect(bookingBlockedText({ ...defaults, guestsCanBook: false }, null)).toMatch(/jelentkezz be/);
    expect(bookingBlockedText(defaults, newUser)).toMatch(/admin jóváhagyása/);
});
