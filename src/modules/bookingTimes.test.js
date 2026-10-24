import { suggestTimes, isPastDay } from "./bookingTimes";
import { describeRules } from "./reservationText";

const noRules = { minLengthMinutes: null, maxLengthMinutes: null, openFrom: null, openTo: null, openDays: null, maxDaysAhead: null };
// Wednesday 21 October 2026, 10:20
const now = new Date(2026, 9, 21, 10, 20);

it("suggests one hour from 08:00 on another day, and from the next whole hour today", () => {
    expect(suggestTimes(noRules, new Date(2026, 9, 23), null, now))
        .toEqual({ start: new Date(2026, 9, 23, 8, 0), end: new Date(2026, 9, 23, 9, 0) });
    expect(suggestTimes(noRules, new Date(2026, 9, 21), null, now))
        .toEqual({ start: new Date(2026, 9, 21, 11, 0), end: new Date(2026, 9, 21, 12, 0) });
});

it("starts at the opening time and keeps the length inside the rules", () => {
    const rules = { ...noRules, openFrom: "09:30", openTo: "17:00", minLengthMinutes: 90 };
    expect(suggestTimes(rules, new Date(2026, 9, 23), null, now))
        .toEqual({ start: new Date(2026, 9, 23, 9, 30), end: new Date(2026, 9, 23, 11, 0) });
    expect(suggestTimes({ ...noRules, maxLengthMinutes: 30 }, new Date(2026, 9, 23), new Date(2026, 9, 23, 14, 30), now))
        .toEqual({ start: new Date(2026, 9, 23, 14, 30), end: new Date(2026, 9, 23, 15, 0) });
});

it("knows the days before today", () => {
    expect(isPastDay(new Date(2026, 9, 20), now)).toBe(true);
    expect(isPastDay(new Date(2026, 9, 21), now)).toBe(false);
});

it("describes the booking rules in one line", () => {
    expect(describeRules(noRules)).toBe("");
    expect(describeRules({
        minLengthMinutes: 30, maxLengthMinutes: 240, openFrom: "08:00", openTo: "18:00",
        openDays: ["hétfő", "kedd", "szerda", "csütörtök", "péntek"], maxDaysAhead: 60,
    })).toBe("H–P 08:00–18:00 · 30–240 perc · legfeljebb 60 nappal előre");
    expect(describeRules({ ...noRules, openDays: ["hétfő", "szerda", "csütörtök", "vasárnap"], maxLengthMinutes: 90 }))
        .toBe("H, Sze–Cs, V · legfeljebb 90 perc");
});
