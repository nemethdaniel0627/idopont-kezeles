// Run with: npm test
process.env.TZ = "Europe/Budapest";

const test = require("node:test");
const assert = require("node:assert/strict");
const { daysOf, timesOf, slotsOf, computeResults, isClosed } = require("./pollSlots");
const { toPollValues, toAnswerValues, toNameKey } = require("./polls");

const poll = {
    mode: "dates", dates: ["2026-11-04", "2026-11-03"], weekDays: null,
    dayStart: "09:00", dayEnd: "12:00", slotMinutes: 60, meetingMinutes: null, deadline: null, closedAt: null,
};
const answer = slots => ({ slots });

test("a dates poll has its days in order, each with the slots of the window", () => {
    assert.deepEqual(daysOf(poll), ["2026-11-03", "2026-11-04"]);
    assert.deepEqual(timesOf(poll), ["09:00", "10:00", "11:00"]);
    assert.equal(slotsOf(poll).length, 6);
    assert.equal(slotsOf(poll)[0], "2026-11-03 09:00");
});

test("a weekdays poll goes from Monday, and 30-minute slots fill the window up to midnight", () => {
    const weekly = { ...poll, mode: "weekdays", weekDays: ["péntek", "hétfő"], dayStart: "22:30", dayEnd: "24:00", slotMinutes: 30 };
    assert.deepEqual(daysOf(weekly), ["hétfő", "péntek"]);
    assert.deepEqual(timesOf(weekly), ["22:30", "23:00", "23:30"]);
    assert.equal(slotsOf(weekly)[3], "péntek 22:30");
});

test("the result is where everyone is available, merged within a day", () => {
    const results = computeResults(poll, [
        answer(["2026-11-03 09:00", "2026-11-03 10:00", "2026-11-03 11:00", "2026-11-04 11:00"]),
        answer(["2026-11-03 09:00", "2026-11-03 10:00", "2026-11-04 10:00", "2026-11-04 11:00"]),
        answer(["2026-11-03 09:00", "2026-11-03 10:00", "2026-11-03 11:00", "2026-11-04 11:00"]),
    ]);
    assert.equal(results.respondents, 3);
    assert.equal(results.counts["2026-11-03 11:00"], 2);
    assert.deepEqual(results.common, [
        { day: "2026-11-03", from: "09:00", to: "11:00" },
        { day: "2026-11-04", from: "11:00", to: "12:00" },
    ]);
});

test("common times shorter than the meeting are left out", () => {
    const results = computeResults({ ...poll, meetingMinutes: 120 }, [
        answer(["2026-11-03 09:00", "2026-11-03 10:00", "2026-11-04 11:00"]),
    ]);
    assert.deepEqual(results.common, [{ day: "2026-11-03", from: "09:00", to: "11:00" }]);
});

test("without answers there is no result; with one answer it is that answer", () => {
    assert.deepEqual(computeResults(poll, []), { respondents: 0, counts: {}, common: [] });
    assert.deepEqual(computeResults(poll, [answer(["2026-11-04 09:00"])]).common, [{ day: "2026-11-04", from: "09:00", to: "10:00" }]);
    // Someone available nowhere leaves no common time
    assert.deepEqual(computeResults(poll, [answer(["2026-11-04 09:00"]), answer([])]).common, []);
});

test("a poll is closed by the organizer or by its deadline", () => {
    const now = new Date(2026, 10, 1, 12, 0);
    assert.equal(isClosed(poll, now), false);
    assert.equal(isClosed({ ...poll, closedAt: new Date(2026, 9, 30) }, now), true);
    assert.equal(isClosed({ ...poll, deadline: new Date(2026, 10, 1, 11, 59) }, now), true);
    assert.equal(isClosed({ ...poll, deadline: new Date(2026, 10, 2) }, now), false);
});

const now = new Date(2026, 10, 1, 12, 0);
const body = { title: " Csapatépítő ", mode: "dates", dates: ["2026-11-05", "2026-11-03", "2026-11-03"], dayStart: "09:00", dayEnd: "17:00", slotMinutes: 30 };

test("a new poll is checked and tidied", () => {
    const values = toPollValues(body, now);
    assert.equal(values.title, "Csapatépítő");
    assert.deepEqual(values.dates, ["2026-11-03", "2026-11-05"]);
    assert.equal(values.timeZone, "Europe/Budapest");
    assert.equal(values.answersVisible, true);
    assert.equal(values.meetingMinutes, null);
    assert.deepEqual(toPollValues({ ...body, mode: "weekdays", weekDays: ["szerda", "hétfő", "nincs"] }, now).weekDays, ["hétfő", "szerda"]);
});

test("a new poll with bad settings is refused with a Hungarian message", () => {
    const refused = (changes, message) => assert.throws(() => toPollValues({ ...body, ...changes }, now), message);
    refused({ title: "" }, /Nincs megadva az egyeztetés neve/);
    refused({ dates: [] }, /legalább egy napot/);
    refused({ dates: ["2026-02-30"] }, /Hibás dátum/);
    refused({ dates: ["2026-10-31"] }, /Múltbeli nap/);
    refused({ mode: "weekdays", weekDays: [] }, /legalább egy napot/);
    refused({ slotMinutes: 15 }, /30 vagy 60/);
    refused({ dayStart: "17:00", dayEnd: "09:00" }, /kezdete a vége előtt/);
    refused({ dayStart: "09:00", dayEnd: "09:45" }, /30 perc többszöröse/);
    refused({ meetingMinutes: 45 }, /30 perc többszöröse/);
    refused({ meetingMinutes: 600 }, /hosszabb a napi időablaknál/);
    refused({ deadline: "2026-10-30T10:00:00" }, /jövőben/);
    refused({ timeZone: "Mars/Olympus" }, /Hibás időzóna/);
});

test("an answer may only have the poll's own slots, in the poll's order", () => {
    const values = toAnswerValues(poll, { name: "  Kiss   Anna ", slots: ["2026-11-04 09:00", "2026-11-03 10:00", "2026-11-03 10:00"] });
    assert.equal(values.name, "Kiss Anna");
    assert.equal(values.nameKey, "kiss anna");
    assert.deepEqual(values.slots, ["2026-11-03 10:00", "2026-11-04 09:00"]);
    assert.throws(() => toAnswerValues(poll, { name: "Anna", slots: ["2026-11-05 09:00"] }), /Hibás időpont/);
    assert.throws(() => toAnswerValues(poll, { name: " ", slots: [] }), /Add meg a neved/);
    assert.throws(() => toAnswerValues(poll, { name: "Anna", slots: [], contactEmail: "nem-email" }), /Hibás e-mail/);
    assert.equal(toNameKey(" KISS  anna"), "kiss anna");
});
