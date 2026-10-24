import Calendar from "./Calendar";

describe("getDateFromPrefix", () => {
    it("reads the getPrefix format as a local date", () => {
        const date = Calendar.getDateFromPrefix("2026-10-5");
        expect([date.getFullYear(), date.getMonth(), date.getDate(), date.getHours()]).toEqual([2026, 9, 5, 0]);
    });

    it("is the inverse of getPrefix", () => {
        expect(Calendar.getPrefix(Calendar.getDateFromPrefix("2028-2-29"))).toBe("2028-2-29");
    });
});

describe("setTimeOnDate", () => {
    it("keeps the day and takes only the time", () => {
        const typedToday = new Date(2026, 9, 23, 14, 15, 30);
        const result = Calendar.setTimeOnDate(new Date(2026, 9, 30), typedToday);
        expect(Calendar.getPrefix(result)).toBe("2026-10-30");
        expect([result.getHours(), result.getMinutes(), result.getSeconds()]).toEqual([14, 15, 0]);
    });
});

describe("getWeekdayIndex", () => {
    it("starts the week on Monday", () => {
        expect(Calendar.getWeekdayIndex(new Date(2026, 10, 2))).toBe(0); // hétfő
        expect(Calendar.getWeekdayIndex(new Date(2026, 10, 1))).toBe(6); // vasárnap
        expect(Calendar.getWeekdayIndex(new Date(2028, 10, 4))).toBe(5); // szombat
    });
});

describe("getDaysInMonth", () => {
    it("handles leap years", () => {
        expect(Calendar.getDaysInMonth(2028, 1)).toBe(29);
        expect(Calendar.getDaysInMonth(2027, 1)).toBe(28);
        expect(Calendar.getDaysInMonth(2026, 9)).toBe(31);
    });
});

describe("getRepeatLimit", () => {
    it("is 6 months after the first date, at the end of shorter months", () => {
        expect(Calendar.getRepeatLimit(new Date(2026, 9, 19, 8))).toEqual(new Date(2027, 3, 19));
        expect(Calendar.getRepeatLimit(new Date(2026, 7, 31, 15))).toEqual(new Date(2027, 1, 28));
    });
});

describe("getIntervalSlot", () => {
    it("puts an off-grid start into the time unit it falls in", () => {
        expect(Calendar.getIntervalSlot("7:10", 30)).toEqual({ timeUnit: "7:0", offset: 10 });
        expect(Calendar.getIntervalSlot("14:47", 30)).toEqual({ timeUnit: "14:30", offset: 17 });
        expect(Calendar.getIntervalSlot("7:12", 5)).toEqual({ timeUnit: "7:10", offset: 2 });
    });

    it("uses whole hours for the hour list", () => {
        expect(Calendar.getIntervalSlot("7:10", 60)).toEqual({ timeUnit: 7, offset: 10 });
    });

    it("has no offset for starts on the grid", () => {
        expect(Calendar.getIntervalSlot("0:30", 30)).toEqual({ timeUnit: "0:30", offset: 0 });
        expect(Calendar.getIntervalSlot("3:0", 5)).toEqual({ timeUnit: "3:0", offset: 0 });
    });
});
