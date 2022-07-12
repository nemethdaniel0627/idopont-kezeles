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