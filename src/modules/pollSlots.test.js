import { dayLabel, dayHeader, rangeText, describeDays, durationText, timeOptions, monthWeeks, formatDay, parseDay } from "./pollSlots";

it("labels dates with their Hungarian week day, and week days as they are", () => {
    expect(dayLabel("2026-11-03")).toBe("kedd, 11. 03.");
    expect(dayLabel("csütörtök")).toBe("csütörtök");
    expect(dayHeader("2026-11-08")).toEqual({ top: "V", bottom: "11. 08." });
    expect(rangeText({ day: "2026-11-03", from: "09:00", to: "11:30" })).toBe("kedd, 11. 03. 09:00–11:30");
});

it("describes a poll's days and durations", () => {
    expect(describeDays({ mode: "dates", dates: ["2026-11-05", "2026-11-03"] })).toBe("11. 03., 11. 05.");
    expect(describeDays({ mode: "weekdays", weekDays: ["péntek", "hétfő"] })).toBe("hétfő, péntek");
    expect(durationText(30)).toBe("30 perc");
    expect(durationText(90)).toBe("1,5 óra");
});

it("lists the times of a day up to midnight", () => {
    expect(timeOptions(60, 22 * 60)).toEqual(["22:00", "23:00", "24:00"]);
    expect(timeOptions(30).length).toBe(49);
});

it("lays out a month from Monday", () => {
    // November 2026 starts on a Sunday
    const weeks = monthWeeks(2026, 10);
    expect(weeks[0].slice(0, 6)).toEqual([null, null, null, null, null, null]);
    expect(formatDay(weeks[0][6])).toBe("2026-11-01");
    expect(weeks.every(week => week.length === 7)).toBe(true);
    expect(formatDay(parseDay("2026-02-28"))).toBe("2026-02-28");
});
