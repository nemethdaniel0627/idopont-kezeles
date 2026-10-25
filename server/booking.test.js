// Run with: npm test
process.env.TZ = "Europe/Budapest";

const test = require("node:test");
const assert = require("node:assert/strict");
const { checkRules, checkConflicts, matchesContact } = require("./booking");
const { expand } = require("./recurrence");
const { ValidationError, HttpError } = require("./validation");

// Wednesday 21 October 2026, 10:00
const now = new Date(2026, 9, 21, 10, 0);
const at = (day, hour, minute = 0) => new Date(2026, 9, day, hour, minute);
const once = (start, end) => [{ start, end }];

const noRules = { minLengthMinutes: null, maxLengthMinutes: null, openFrom: null, openTo: null, openDays: null, maxDaysAhead: null };
const office = {
    minLengthMinutes: 30, maxLengthMinutes: 120, openFrom: "08:00", openTo: "18:00",
    openDays: ["hétfő", "kedd", "szerda", "csütörtök", "péntek"], maxDaysAhead: 30,
};

const reservation = (fields) => ({
    id: 1, title: "Foglalás", allDay: false, regularityMeasure: "never", regularityRepeatNumber: null,
    regularityDays: null, endsOnType: null, endsOnDate: null, endsOnOccurrence: null, ...fields,
});

test("without rules any future time can be booked, the past never", () => {
    assert.doesNotThrow(() => checkRules(noRules, false, once(at(22, 3), at(23, 23)), now));
    assert.throws(() => checkRules(noRules, false, once(at(21, 9), at(21, 11)), now), /Múltbeli időpontra/);
    // An all-day booking for today is fine, yesterday is not
    assert.doesNotThrow(() => checkRules(noRules, true, once(at(21, 0), at(22, 0)), now));
    assert.throws(() => checkRules(noRules, true, once(at(20, 0), at(21, 0)), now), /Múltbeli időpontra/);
});

test("the length has to be between the shortest and the longest booking", () => {
    assert.doesNotThrow(() => checkRules(office, false, once(at(22, 9), at(22, 9, 30)), now));
    assert.doesNotThrow(() => checkRules(office, false, once(at(22, 9), at(22, 11)), now));
    assert.throws(() => checkRules(office, false, once(at(22, 9), at(22, 9, 15)), now), /legalább 30 percre/);
    assert.throws(() => checkRules(office, false, once(at(22, 9), at(22, 11, 30)), now), /legfeljebb 120 percre/);
});

test("a booking has to be inside the opening hours of one day", () => {
    assert.doesNotThrow(() => checkRules(office, false, once(at(22, 8), at(22, 9)), now));
    assert.doesNotThrow(() => checkRules(office, false, once(at(22, 17), at(22, 18)), now));
    assert.throws(() => checkRules(office, false, once(at(22, 7, 30), at(22, 8, 30)), now), /nyitvatartási időben \(08:00–18:00\)/);
    assert.throws(() => checkRules(office, false, once(at(22, 17, 30), at(22, 18, 30)), now), /nyitvatartási időben/);
    const overnight = { ...noRules, openFrom: "00:00", openTo: "23:59" };
    assert.throws(() => checkRules(overnight, false, once(at(22, 23), at(23, 1)), now), /nyitvatartási időben/);
    assert.throws(() => checkRules({ ...noRules, openFrom: "08:00", openTo: "18:00" }, true, once(at(22, 0), at(23, 0)), now),
        /egész napra nem/);
});

test("a booking has to be on open days, every day of it", () => {
    // 24 October 2026 is a Saturday
    assert.throws(() => checkRules(office, false, once(at(24, 9), at(24, 10)), now), /csak ezeken a napokon foglalható: hétfő, kedd/);
    const weekdays = { ...noRules, openDays: office.openDays };
    assert.doesNotThrow(() => checkRules(weekdays, true, once(at(22, 0), at(24, 0)), now));
    assert.throws(() => checkRules(weekdays, true, once(at(23, 0), at(25, 0)), now), /csak ezeken a napokon/);
    // Ending at midnight does not touch the next day
    assert.doesNotThrow(() => checkRules(weekdays, false, once(at(23, 22), at(24, 0)), now));
});

test("a booking can start at most the given number of days ahead", () => {
    const ahead = { ...noRules, maxDaysAhead: 30 };
    assert.doesNotThrow(() => checkRules(ahead, false, once(new Date(2026, 10, 20, 9), new Date(2026, 10, 20, 10)), now));
    assert.throws(() => checkRules(ahead, false, once(new Date(2026, 10, 21, 9), new Date(2026, 10, 21, 10)), now),
        /legfeljebb 30 nappal előre/);
});

test("every occurrence of a repeating booking is checked, and the error names the one that breaks a rule", () => {
    const weekly = reservation({
        startDate: at(23, 9), endDate: at(23, 10), regularityMeasure: "week", regularityRepeatNumber: 1,
        regularityDays: ["péntek", "szombat"], endsOnType: "occurrence", endsOnOccurrence: 4,
    });
    assert.throws(() => checkRules(office, false, expand(weekly), now), /napokon foglalható.*\(2026-10-24 09:00–10:00\)/);
    const fridays = { ...weekly, regularityDays: ["péntek"] };
    assert.doesNotThrow(() => checkRules(office, false, expand(fridays), now));
});

test("an all-day booking counts as 24 hours, also on the day the clock changes", () => {
    // 25 October 2026 has 25 hours in Budapest
    const oneDay = { ...noRules, maxLengthMinutes: 1440 };
    assert.doesNotThrow(() => checkRules(oneDay, true, once(at(25, 0), at(26, 0)), now));
    assert.throws(() => checkRules(oneDay, true, once(at(25, 0), at(27, 0)), now), /legfeljebb 1440 percre/);
});

test("editing a repetition already under way skips the occurrences that have started", () => {
    const daily = reservation({
        startDate: at(19, 9), endDate: at(19, 10), regularityMeasure: "day", regularityRepeatNumber: 1,
        endsOnType: "occurrence", endsOnOccurrence: 5,
    });
    assert.throws(() => checkRules(noRules, false, expand(daily), now), /Múltbeli időpontra/);
    assert.doesNotThrow(() => checkRules(noRules, false, expand(daily), now, { ignorePast: true }));
    // Moved fully into the past: nothing is left to book
    const past = { ...daily, endsOnOccurrence: 2 };
    assert.throws(() => checkRules(noRules, false, expand(past), now, { ignorePast: true }), /Múltbeli időpontra/);
});

test("overlapping a stored reservation is refused with its name and time; touching is fine", () => {
    const meeting = reservation({ id: 7, title: "Csapatmegbeszélés", startDate: at(28, 10), endDate: at(28, 11, 30) });
    assert.doesNotThrow(() => checkConflicts(once(at(28, 11, 30), at(28, 12)), [meeting]));
    assert.doesNotThrow(() => checkConflicts(once(at(28, 9), at(28, 10)), [meeting]));
    assert.throws(() => checkConflicts(once(at(28, 11), at(28, 12)), [meeting]), (err) =>
        err instanceof HttpError && err.status === 409
        && err.message === "Ez az időpont már foglalt: „Csapatmegbeszélés” (2026-10-28 10:00–11:30)");
    // The reservation being edited does not conflict with itself
    assert.doesNotThrow(() => checkConflicts(once(at(28, 11), at(28, 12)), [meeting], 7));
});

test("repeating reservations are compared occurrence by occurrence", () => {
    const mondays = reservation({
        title: "Ügyfélhívás", startDate: at(26, 14), endDate: at(26, 15), regularityMeasure: "week",
        regularityRepeatNumber: 2, regularityDays: ["hétfő"], endsOnType: "onDate", endsOnDate: new Date(2027, 0, 31),
    });
    const daily = reservation({
        startDate: at(27, 14, 30), endDate: at(27, 15, 30), regularityMeasure: "day", regularityRepeatNumber: 1,
        endsOnType: "occurrence", endsOnOccurrence: 15,
    });
    // The 15 daily occurrences reach the fortnightly Monday after (9 November 2026); 2 November is skipped
    assert.throws(() => checkConflicts(expand(daily), [mondays]), /„Ügyfélhívás” \(2026-11-09 14:00–15:00\)/);
    // An all-day booking blocks the whole day
    const training = reservation({ title: "Tréning", allDay: true, startDate: at(29, 0), endDate: at(30, 0) });
    assert.throws(() => checkConflicts(once(at(30, 23), at(31, 1)), [training]), /„Tréning” \(2026-10-29 – 2026-10-30 \(egész nap\)\)/);
});

test("a reservation is opened with its email in any case or its phone in any format", () => {
    const booked = { contactEmail: "kiss.anna@example.hu", contactPhone: "+36 30 111 2222" };
    assert.equal(matchesContact(booked, " Kiss.Anna@Example.hu "), true);
    assert.equal(matchesContact(booked, "06301112222"), true);
    assert.equal(matchesContact(booked, "+36-30-111-2222"), true);
    assert.equal(matchesContact(booked, "0036 30 111 2222"), true);
    assert.equal(matchesContact(booked, "anna@example.hu"), false);
    assert.equal(matchesContact(booked, "06301112223"), false);
    assert.equal(matchesContact(booked, ""), false);
    assert.equal(matchesContact(booked, undefined), false);
    // A reservation without a phone number can't be opened with an empty-ish phone
    assert.equal(matchesContact({ contactEmail: "a@b.hu", contactPhone: "" }, "+"), false);
    assert.equal(matchesContact({ contactEmail: "", contactPhone: "+36 30 111 2222" }, "@"), false);
});

test("rule errors are validation errors", () => {
    assert.throws(() => checkRules(office, false, once(at(24, 9), at(24, 10)), now), ValidationError);
});
