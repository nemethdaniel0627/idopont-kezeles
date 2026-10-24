import { dayStatus, ruleProblem, visibleHours, isBookableTime } from "./bookingRules";
import { layoutDay } from "./weekLayout";

const noRules = { minLengthMinutes: null, maxLengthMinutes: null, openFrom: null, openTo: null, openDays: null, maxDaysAhead: null };
const office = {
    minLengthMinutes: 30, maxLengthMinutes: 240, openFrom: "08:00", openTo: "18:00",
    openDays: ["hétfő", "kedd", "szerda", "csütörtök", "péntek"], maxDaysAhead: 60,
};
// Saturday 24 October 2026, 10:20
const now = new Date(2026, 9, 24, 10, 20);
const at = (day, hour, minute = 0) => new Date(2026, 9, day, hour, minute);

it("tells past, closed, too far and open days apart; admins only see the past", () => {
    expect(dayStatus(office, at(23, 0), { now })).toBe("past");
    expect(dayStatus(office, at(25, 0), { now })).toBe("closed");
    expect(dayStatus(office, at(26, 0), { now })).toBe("open");
    expect(dayStatus(office, new Date(2027, 0, 4), { now })).toBe("tooFar");
    expect(dayStatus(office, at(25, 0), { now, isAdmin: true })).toBe("open");
    expect(dayStatus(office, at(23, 0), { now, isAdmin: true })).toBe("past");
});

it("names the first broken rule of a booking, like the server", () => {
    expect(ruleProblem(office, at(26, 9), at(26, 10), false, now)).toBe("");
    expect(ruleProblem(office, at(25, 9), at(25, 10), false, now)).toMatch(/^Vasárnap zárva/);
    expect(ruleProblem(office, at(26, 7), at(26, 8), false, now)).toMatch(/08:00 és 18:00 között/);
    expect(ruleProblem(office, at(26, 9), at(26, 9, 15), false, now)).toMatch(/legalább 30 percre/);
    expect(ruleProblem(office, at(24, 9), at(24, 10), false, now)).toMatch(/Múltbeli/);
    expect(ruleProblem(office, at(26, 0), at(26, 0), true, now)).toMatch(/egész napra nem/);
    expect(ruleProblem(noRules, at(26, 0), at(27, 0), true, now)).toBe("");
});

it("shows the opening hours in the week view, widened to fit bookings outside them", () => {
    expect(visibleHours(office)).toEqual({ from: 480, to: 1080 });
    expect(visibleHours(noRules)).toEqual({ from: 420, to: 1200 });
    expect(visibleHours(office, [{ start: 6 * 60 + 30, end: 19 * 60 + 15 }])).toEqual({ from: 360, to: 1200 });
});

it("knows which times can start a booking", () => {
    expect(isBookableTime(office, at(26, 9), { now })).toBe(true);
    expect(isBookableTime(office, at(26, 18), { now })).toBe(false);
    expect(isBookableTime(office, at(25, 9), { now })).toBe(false);
    expect(isBookableTime(office, at(25, 9), { now, isAdmin: true })).toBe(true);
    expect(isBookableTime(office, at(24, 9), { now, isAdmin: true })).toBe(false);
});

const service = (id, serviceStart, serviceLength, allDay = false) => ({ id, serviceStart, serviceLength, allDay });

it("places a day's bookings by start and length, overlapping ones side by side", () => {
    const { timed, allDay } = layoutDay([
        service(1, "9:0", 60), service(2, "9:30", 60), service(3, "10:30", 30), service(4, "13:0", 30), service(5, "0:0", 1440, true),
    ]);
    expect(allDay.map(item => item.id)).toEqual([5]);
    const byId = Object.fromEntries(timed.map(item => [item.service.id, item]));
    expect(byId[1]).toMatchObject({ start: 540, end: 600, lane: 0, lanes: 2 });
    expect(byId[2]).toMatchObject({ start: 570, end: 630, lane: 1, lanes: 2 });
    // 10:30 only touches the 9:30-10:30 one, so it has the whole width
    expect(byId[3]).toMatchObject({ start: 630, lane: 0, lanes: 1 });
    expect(byId[4]).toMatchObject({ start: 780, lane: 0, lanes: 1 });
});
