class Calendar {
    openCalendar() {

    }

    setCurrentDate() {
        // dátum beállitasa
        let date = new Date();
        let dateArr = date.toString().split(" ");
        let setmonth = dateArr[1];
        let setday = dateArr[2];

        let months = document.getElementById("months");
        let days = document.getElementById("days");

        // honap beallitas
        if (months) {
            months.childNodes.forEach(li => {
                if (li.firstChild.title === setmonth) {
                    li.firstChild.className = "selected";
                }
            });
        }

        // nap beállitasa
        if (days) {
            days.childNodes.forEach(li => {
                if (li.firstChild.title === setday) {
                    li.firstChild.className = "selected";
                }
            });
        }

    }

    getPrefix(date) {
        return `${date.getFullYear()}-${date.getMonth() + 1}-${date.getDate()}`;
    }

    // "2026-10-5" (the format of getPrefix) -> the start of that day
    getDateFromPrefix(prefix) {
        const [year, month, day] = prefix.split("-").map(Number);
        return new Date(year, month - 1, day);
    }

    // Hours and minutes of time, on the day of date
    setTimeOnDate(date, time) {
        const result = new Date(date);
        result.setHours(time.getHours(), time.getMinutes(), 0, 0);
        return result;
    }

    // 0 = hétfő ... 6 = vasárnap
    getWeekdayIndex(date) {
        return (date.getDay() + 6) % 7;
    }

    getDaysInMonth(year, month) {
        return new Date(year, month + 1, 0).getDate();
    }

    // The last day a repeating reservation may fall on: 6 months after its first date, at the end of
    // shorter months (31 August -> 28 February). The server applies the same rule in recurrence.js.
    getRepeatLimit(firstStart) {
        const year = firstStart.getFullYear();
        const month = firstStart.getMonth() + 6;
        return new Date(year, month, Math.min(firstStart.getDate(), this.getDaysInMonth(year, month)));
    }

    // The time unit of a 5, 30 or 60 minute interval list an event starting at "h:m" belongs to,
    // and how many minutes after the start of that unit it begins
    getIntervalSlot(eventStart, intervalLength) {
        const [hour, minute] = eventStart.split(":").map(Number);
        const slotMinute = Math.floor(minute / intervalLength) * intervalLength;
        return {
            timeUnit: intervalLength === 60 ? hour : `${hour}:${slotMinute}`,
            offset: minute - slotMinute
        };
    }

    getDateWithFormat(date, withTime = false) {
        return withTime
            ? `${date.getFullYear()}-${date.getMonth() + 1 < 10 ? `0${date.getMonth() + 1}` : date.getMonth() + 1}-${date.getDate() < 10 ? `0${date.getDate()}` : date.getDate()} ${date.getHours() < 10 ? `0${date.getHours()}` : date.getHours()}:${date.getMinutes() < 10 ? `0${date.getMinutes()}` : date.getMinutes()}`
            : `${date.getFullYear()}-${date.getMonth() + 1 < 10 ? `0${date.getMonth() + 1}` : date.getMonth() + 1}-${date.getDate() < 10 ? `0${date.getDate()}` : date.getDate()}`;
    }

    convertDuration(duration) {
        // { years: 0, months: 0, days: 0, hours: 0, minutes: 0, seconds: 0 }
        const yearsInMin = duration.years * 525949.2;
        const monthsInMin = duration.months * 43829.06;
        const daysInMin = duration.days * 1440;
        const hoursInMin = duration.hours * 60;
        const minutesInMin = duration.minutes;
        const secondsInMin = duration.seconds / 60;

        return Math.round(yearsInMin + monthsInMin + daysInMin + hoursInMin + minutesInMin + secondsInMin);
    }
}

export default new Calendar();