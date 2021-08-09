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
}

export default new Calendar();