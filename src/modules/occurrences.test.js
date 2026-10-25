import { placeOccurrences, getGridRange, toOccurrence } from "./occurrences";

const local = (y, m, d, h = 0, min = 0) => new Date(y, m - 1, d, h, min);

// A week of empty grid days, Monday 19 October 2026 to Sunday 25 October
const week = () => Array.from({ length: 7 }, (_, i) => ({ date: local(2026, 10, 19 + i), services: [], fullscreenServices: [] }));

const occurrence = (id, start, end, extra = {}) =>
    ({ reservationId: id, title: `Foglalás ${id}`, description: "", allDay: false, repeating: false, start, end, ...extra });

describe("placeOccurrences", () => {
    it("puts an occurrence on its day with its start and length", () => {
        const days = placeOccurrences(week(), [occurrence(1, local(2026, 10, 21, 10), local(2026, 10, 21, 11, 30))]);
        expect(days[2].services).toHaveLength(1);
        expect(days[2].services[0]).toMatchObject({ id: 1, name: "Foglalás 1", serviceStart: "10:0", serviceLength: 90 });
        expect(days[2].fullscreenServices).toEqual([expect.objectContaining({ id: 1, type: "not" })]);
        expect(days.filter(day => day.services.length > 0)).toHaveLength(1);
    });

    it("cuts an occurrence over midnight into one part per day", () => {
        const days = placeOccurrences(week(), [occurrence(1, local(2026, 10, 23, 22), local(2026, 10, 24, 2))]);
        expect(days[4].services[0]).toMatchObject({ serviceStart: "22:0", serviceLength: 120 });
        expect(days[5].services[0]).toMatchObject({ serviceStart: "0:0", serviceLength: 120 });
        expect(days[4].fullscreenServices[0].type).toBe("start");
        expect(days[5].fullscreenServices[0].type).toBe("end");
    });

    it("does not put an occurrence ending at midnight on the next day", () => {
        const days = placeOccurrences(week(), [occurrence(1, local(2026, 10, 22), local(2026, 10, 24), { allDay: true })]);
        expect(days.map(day => day.services.length)).toEqual([0, 0, 0, 1, 1, 0, 0]);
        expect(days[3].fullscreenServices[0].type).toBe("start");
        expect(days[4].fullscreenServices[0].type).toBe("end");
        expect(days[3].services[0].serviceLength).toBe(24 * 60);
    });

    it("keeps a multi-day occurrence in one row, filling gaps with ghosts", () => {
        const days = placeOccurrences(week(), [
            occurrence(1, local(2026, 10, 20, 9), local(2026, 10, 20, 10)),
            occurrence(2, local(2026, 10, 20, 0), local(2026, 10, 23), { allDay: true }),
            occurrence(3, local(2026, 10, 21, 9), local(2026, 10, 21, 10)),
        ]);
        // The 3-day one starts first on the 20th, so it gets the first row everywhere
        expect(days[1].fullscreenServices.map(s => s.id)).toEqual([2, 1]);
        expect(days[2].fullscreenServices.map(s => s.id)).toEqual([2, 3]);
        expect(days[3].fullscreenServices.map(s => [s.id, s.type])).toEqual([[2, "end"]]);

        const later = placeOccurrences(week(), [
            occurrence(1, local(2026, 10, 20, 9), local(2026, 10, 20, 10)),
            occurrence(2, local(2026, 10, 20, 11), local(2026, 10, 22, 12)),
            occurrence(3, local(2026, 10, 22, 8), local(2026, 10, 22, 9)),
        ]);
        // The multi-day one is in the second row; on the 21st the first row is a ghost
        expect(later[2].fullscreenServices.map(s => [s.id, s.type])).toEqual([[-1, "ghost"], [2, "middle"]]);
        expect(later[3].fullscreenServices.map(s => [s.id, s.type])).toEqual([[3, "not"], [2, "end"]]);
    });

    it("ignores occurrences outside the grid", () => {
        const days = placeOccurrences(week(), [occurrence(1, local(2026, 11, 2, 9), local(2026, 11, 2, 10))]);
        expect(days.every(day => day.services.length === 0 && day.fullscreenServices.length === 0)).toBe(true);
    });
});

describe("getGridRange and toOccurrence", () => {
    it("covers the grid from its first day to the start of the day after its last", () => {
        expect(getGridRange(week())).toEqual({ from: local(2026, 10, 19), to: local(2026, 10, 26) });
    });

    it("turns the server's date strings into dates", () => {
        const item = toOccurrence({ reservationId: 1, start: "2026-10-21T08:00:00.000Z", end: "2026-10-21T09:00:00.000Z" });
        expect(item.start).toEqual(new Date("2026-10-21T08:00:00.000Z"));
        expect(item.end).toBeInstanceOf(Date);
    });
});
