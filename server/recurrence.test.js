// Run with: npm test
process.env.TZ = "Europe/Budapest";

const test = require("node:test");
const assert = require("node:assert/strict");
const { expand, getRepeatLimit } = require("./recurrence");

const local = (y, m, d, h = 0, min = 0) => new Date(y, m - 1, d, h, min);
const days = occurrences => occurrences.map(o => `${o.start.getMonth() + 1}-${o.start.getDate()}`);

test("a reservation without repetition has one occurrence", () => {
    const result = expand({ startDate: local(2026, 10, 21, 10), endDate: local(2026, 10, 21, 11, 30), regularityMeasure: "never" });
    assert.deepEqual(result, [{ start: local(2026, 10, 21, 10), end: local(2026, 10, 21, 11, 30) }]);
});

test("every 2 days, 4 times", () => {
    const result = expand({
        startDate: local(2026, 10, 19, 8, 30), endDate: local(2026, 10, 19, 9),
        regularityMeasure: "day", regularityRepeatNumber: 2, endsOnType: "occurrence", endsOnOccurrence: 4,
    });
    assert.deepEqual(days(result), ["10-19", "10-21", "10-23", "10-25"]);
});

test("every 2 weeks on Monday and Wednesday, until an end date", () => {
    const result = expand({
        startDate: local(2026, 10, 19, 14), endDate: local(2026, 10, 19, 15),
        regularityMeasure: "week", regularityRepeatNumber: 2, regularityDays: ["hétfő", "szerda"],
        endsOnType: "onDate", endsOnDate: local(2026, 11, 18),
    });
    assert.deepEqual(days(result), ["10-19", "10-21", "11-2", "11-4", "11-16", "11-18"]);
    assert.ok(result.every(o => o.start.getHours() === 14 && o.end.getHours() === 15));
});

test("weekly days before the first date in its first week are not used", () => {
    const result = expand({
        startDate: local(2026, 10, 21, 9), endDate: local(2026, 10, 21, 10),
        regularityMeasure: "week", regularityRepeatNumber: 1, regularityDays: ["hétfő", "szerda"],
        endsOnType: "occurrence", endsOnOccurrence: 3,
    });
    assert.deepEqual(days(result), ["10-21", "10-26", "10-28"]);
});

test("monthly on the 31st skips months without a 31st", () => {
    const result = expand({
        startDate: local(2026, 8, 31, 13), endDate: local(2026, 8, 31, 15),
        regularityMeasure: "month", regularityRepeatNumber: 1,
    });
    assert.deepEqual(days(result), ["8-31", "10-31", "12-31", "1-31"]);
});

test("repetition stops 6 months after the first date", () => {
    const result = expand({ startDate: local(2026, 10, 19, 8), endDate: local(2026, 10, 19, 9), regularityMeasure: "day" });
    assert.equal(result.length, 183);
    assert.deepEqual(result[result.length - 1].start, local(2027, 4, 19, 8));
});

test("an end date after the 6-month limit is cut at the limit", () => {
    const result = expand({
        startDate: local(2026, 10, 19, 8), endDate: local(2026, 10, 19, 9), regularityMeasure: "month",
        endsOnType: "onDate", endsOnDate: local(2027, 12, 31),
    });
    assert.deepEqual(days(result), ["10-19", "11-19", "12-19", "1-19", "2-19", "3-19", "4-19"]);
});

test("the 6-month limit ends at the last day of shorter months", () => {
    assert.deepEqual(getRepeatLimit(local(2026, 8, 31, 15)), local(2027, 2, 28));
    assert.deepEqual(getRepeatLimit(local(2026, 10, 19, 8)), local(2027, 4, 19));
});

test("occurrences keep their clock time across the daylight saving change", () => {
    const result = expand({
        startDate: local(2026, 10, 24, 10), endDate: local(2026, 10, 24, 11),
        regularityMeasure: "day", endsOnType: "occurrence", endsOnOccurrence: 3,
    });
    assert.deepEqual(days(result), ["10-24", "10-25", "10-26"]);
    assert.ok(result.every(o => o.start.getHours() === 10 && o.end.getHours() === 11));
    // 25 October has 25 hours, so the real gap between the first two is 25 hours
    assert.equal((result[1].start - result[0].start) / 3600000, 25);
});

test("a reservation over midnight keeps its length in every occurrence", () => {
    const result = expand({
        startDate: local(2026, 10, 23, 22), endDate: local(2026, 10, 24, 2),
        regularityMeasure: "week", regularityDays: ["péntek"], endsOnType: "occurrence", endsOnOccurrence: 2,
    });
    assert.deepEqual(result, [
        { start: local(2026, 10, 23, 22), end: local(2026, 10, 24, 2) },
        { start: local(2026, 10, 30, 22), end: local(2026, 10, 31, 2) },
    ]);
});

test("an all-day reservation covers whole days, from its first to its last day", () => {
    const result = expand({ startDate: local(2026, 10, 22, 9), endDate: local(2026, 10, 23, 9), allDay: true, regularityMeasure: "never" });
    assert.deepEqual(result, [{ start: local(2026, 10, 22), end: local(2026, 10, 24) }]);
});

test("only occurrences overlapping the requested range are returned", () => {
    const reservation = {
        startDate: local(2026, 10, 23, 22), endDate: local(2026, 10, 24, 2),
        regularityMeasure: "day", endsOnType: "occurrence", endsOnOccurrence: 5,
    };
    // The one starting on the 24th at 22:00 reaches into the range
    const result = expand(reservation, local(2026, 10, 25, 1), local(2026, 10, 26));
    assert.deepEqual(days(result), ["10-24", "10-25"]);
});
