// Run with: npm test
process.env.TZ = "Europe/Budapest";

const test = require("node:test");
const assert = require("node:assert/strict");
const { toCustomFields, toRules } = require("./resources");
const { toReservationValues } = require("./reservations");
const { ValidationError } = require("./validation");

test("custom fields are trimmed; empty means none", () => {
    assert.deepEqual(toCustomFields([{ label: " Férőhely ", value: " 8 fő " }, { label: "Emelet" }]),
        [{ label: "Férőhely", value: "8 fő" }, { label: "Emelet", value: "" }]);
    assert.deepEqual(toCustomFields(undefined), []);
    assert.deepEqual(toCustomFields([]), []);
});

test("a custom field needs a name, and there are at most 20", () => {
    assert.throws(() => toCustomFields([{ label: " ", value: "x" }]), /Minden egyedi mezőnek legyen neve/);
    assert.throws(() => toCustomFields("Férőhely: 8"), ValidationError);
    assert.throws(() => toCustomFields(Array.from({ length: 21 }, (_, i) => ({ label: `m${i}` }))), /Legfeljebb 20/);
});

test("booking rules are optional", () => {
    assert.deepEqual(toRules({}), {
        minLengthMinutes: null, maxLengthMinutes: null, openFrom: null, openTo: null, openDays: null, maxDaysAhead: null,
    });
    assert.deepEqual(toRules({ minLengthMinutes: "", maxLengthMinutes: null, openFrom: "", openTo: "" }).minLengthMinutes, null);
});

test("booking rules are checked", () => {
    assert.deepEqual(toRules({ minLengthMinutes: "30", maxLengthMinutes: 240, openFrom: "08:00", openTo: "18:00",
        openDays: ["péntek", "hétfő"], maxDaysAhead: 60 }),
        { minLengthMinutes: 30, maxLengthMinutes: 240, openFrom: "08:00", openTo: "18:00", openDays: ["hétfő", "péntek"], maxDaysAhead: 60 });
    assert.throws(() => toRules({ minLengthMinutes: 120, maxLengthMinutes: 60 }), /legrövidebb/);
    assert.throws(() => toRules({ minLengthMinutes: 0 }), ValidationError);
    assert.throws(() => toRules({ minLengthMinutes: 1.5 }), ValidationError);
    assert.throws(() => toRules({ openFrom: "08:00" }), /nyitási és zárási idő is kell/);
    assert.throws(() => toRules({ openFrom: "18:00", openTo: "08:00" }), /zárási idő előtt/);
    assert.throws(() => toRules({ openFrom: "8:00", openTo: "18:00" }), /Hibás nyitási idő/);
    assert.throws(() => toRules({ openDays: ["nincs ilyen"] }), /legalább egy/);
});

test("all seven open days mean no day limit", () => {
    const all = ["hétfő", "kedd", "szerda", "csütörtök", "péntek", "szombat", "vasárnap"];
    assert.equal(toRules({ openDays: all }).openDays, null);
});

const reservation = { title: "Megbeszélés", startDate: "2026-10-26T09:00:00Z", endDate: "2026-10-26T10:00:00Z" };

test("reservation contact data is optional and checked", () => {
    const empty = toReservationValues(reservation);
    assert.equal(empty.contactEmail, "");
    assert.equal(empty.contactPhone, "");
    const filled = toReservationValues({ ...reservation, contactEmail: " Kiss.Anna@Example.HU ", contactPhone: " +36 30 111 2222 " });
    assert.equal(filled.contactEmail, "kiss.anna@example.hu");
    assert.equal(filled.contactPhone, "+36 30 111 2222");
    assert.throws(() => toReservationValues({ ...reservation, contactEmail: "nem-email" }), /Hibás e-mail cím/);
    assert.throws(() => toReservationValues({ ...reservation, contactPhone: "hívj fel" }), /Hibás telefonszám/);
});
