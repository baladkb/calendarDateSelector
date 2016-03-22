//Javascript file

var DateSelector = {
	init : function() {
		console.log("init")
	},
	siv_currentDate : function() {
		dateObj = new Date();
		currentD = this.siv_formatDate(dateObj);
		return currentD;
	},
	siv_formatDate : function(date) {
		month = date.getUTCMonth() + 1;
		day = date.getUTCDate();
		year = date.getUTCFullYear();
		ddmmyyy = day + "/" + month + "/" + year;
		return ddmmyyy;
	},
	siv_formatDateN : function(date) {
		var dd = date.getDate();
		var mm = date.getMonth() + 1;
		var y = date.getFullYear();
		return dd + "/" + mm + "/" + y;
	},
	siv_YesterDay : function() {
		d = new Date();
		yday = d.setDate(d.getDate() - 1);
		ydate = this.siv_formatDate(new Date(yday));
		return ydate;
	},
	lastSevenDay : function() {
		d = new Date();
		yday = d.setDate(d.getDate() - 7);
		ldate = this.siv_formatDate(new Date(yday));
		return ldate;
	},
	lastMonthStart : function() {
		date = new Date(), y = date.getFullYear(), m = date.getMonth() - 1;
		firstDay = new Date(y, m, 1);
		lmsdate = this.siv_formatDateN(firstDay);
		return lmsdate;
	},
	LastMonthEnd : function() {
		date = new Date(), y = date.getFullYear(), m = date.getMonth() - 1;
		lastDay = new Date(y, m + 1, 0);
		lmedate = this.siv_formatDateN(lastDay);
		return lmedate;
	},
	lastWeekStart : function() {
		date = new Date();
		lwstart = this.siv_formatDate(new Date(new Date(date.getTime()
				- ((6 + date.getDay()) * 24 * 60 * 60 * 1000))));
		return lwstart;
	},
	LatWeekEnd : function() {
		d = new Date()
		to = d.setTime(d.getTime() - (d.getDay() ? d.getDay() : 7) * 24 * 60
				* 60 * 1000);
		lwedate = this.siv_formatDate(new Date(to));
		return lwedate;
	},
	last30Days : function() {
		d = new Date();
		yday = d.setDate(d.getDate() - 30);
		lddate = this.siv_formatDate(new Date(yday));
		return lddate;
	},
	setCalenderDate : function(from, to) {
		document.getElementById("calendar_date_selector_field_instance0").value = from;
		document.getElementById("calendar_date_selector_field_instance1").value = to;
	},
	selectFromToDates : function() {
		dateSelected = document.getElementById('selectDatesId').value;
		switch (dateSelected) {
		case "0":
			this.setCalenderDate(this.siv_currentDate(),
					this.siv_currentDate());
			break;
		case "1":
			DateSelector.setCalenderDate(this.siv_YesterDay(),
					this.siv_YesterDay());
			break;
		case "2":
			this.setCalenderDate(this.lastWeekStart(),
					this.LatWeekEnd());
			break;
		case "3":
			this.setCalenderDate(this.lastMonthStart(),
					this.LastMonthEnd());
			break;
		case "4":
			this.setCalenderDate(this.lastSevenDay(),
					this.siv_currentDate());
			break;
		case "5":
			this.setCalenderDate(this.last30Days(),
					this.siv_currentDate());
			break;
		default:
		}
	}
}