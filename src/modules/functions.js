class functions {
    getIntervallumInTime(greater, smaller) {
        let intervallum = this.getTime(greater) - this.getTime(smaller);
        return;
    }

    getTime(date) {
        return Number(`${(date.getHours() * 60) + this.convertToZeroForm(date.getMinutes())}`);
    }

    convertToZeroForm(data) {
        return Number(data) < 10 ? `0${data}` : data;
    }
}

export default new functions();