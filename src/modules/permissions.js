// What the viewer (a user or null for a guest) may do. The same rules as the server's settings.permissions,
// which has the final say: admins may do everything, whatever the switches.
export function permissions(settings, user) {
    const admin = Boolean(user && user.role === "admin");
    return {
        booking: admin || (settings.bookingEnabled && (settings.guestsCanBook || Boolean(user && user.canBook))),
        book: admin || (settings.bookingEnabled && (user ? Boolean(user.canBook) : settings.guestsCanBook)),
        polls: admin || settings.pollsEnabled,
        createPolls: admin || (settings.pollsEnabled && Boolean(user && user.canPoll)),
    };
}

// Why the viewer can't book, for the calendar's hint; null when they can
export function bookingBlockedText(settings, user) {
    if (permissions(settings, user).book) return null;
    if (!settings.bookingEnabled) return "A foglalás jelenleg nem elérhető.";
    if (!user) return "A foglaláshoz jelentkezz be.";
    return "A foglaláshoz egy admin jóváhagyása kell. Addig is megnézheted a szabad időpontokat.";
}
