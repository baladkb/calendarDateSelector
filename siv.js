//Javascript file

function showCalendar(idCalendar, isCalledFromOverlay) {
	var sCalledFor;
	if (isCalledFromOverlay) {
		sCalledFor = 'calendar_date_selector_field';
	}
	calendarComponent_Init(sCalledFor);
	calendarComponent_Show(idCalendar, sCalledFor);
}

function updateInitial(sCont, sVal) {
	if (sCont == 'A') {
		document.getElementById('fromDateID').value = sVal.value;
	} else {
		document.getElementById('idToDate').value = sVal.value;
	}
}

function siv_currentDate() {
	var dateObj = new Date();
	return informe_formatDate(dateObj);
}

function informe_formatDate(date) {
	var month = date.getUTCMonth() + 1; // months from 1-12
	var day = date.getUTCDate();
	var year = date.getUTCFullYear();
	return day + "/" + month + "/" + year
}

function informe_YesterDay() {
	var d = new Date();
	yday = d.setDate(d.getDate() - 1);
	return informe_formatDate(new Date(yday));
}

function LastSevenDay() {
	var d = new Date();
	yday = d.setDate(d.getDate() - 7);
	return informe_formatDate(new Date(yday));
}

function LastMonthStart() {
	var date = new Date(), y = date.getFullYear(), m = date.getMonth() - 1;
	var firstDay = new Date(y, m, 1);
	return informe_formatDate(firstDay);
}

function LastMonthEnd() {
	date = new Date(), y = date.getFullYear(), m = date.getMonth() - 1;
	var lastDay = new Date(y, m + 1, 0);
	return informe_formatDate(lastDay);
}

function LastWeekStart() {
	var d = new Date();
	var from = d.setTime(d.getTime() - 6 * 24 * 60 * 60 * 1000);
	return informe_formatDate(new Date(from));
}

function LatWeekEnd() {
	var d = new Date()
	var to = d.setTime(d.getTime() - (d.getDay() ? d.getDay() : 7) * 24 * 60
			* 60 * 1000);
	return informe_formatDate(new Date(to));
}
function Last30Days() {
	var d = new Date();
	yday = d.setDate(d.getDate() - 30);
	return informe_formatDate(new Date(yday));
}

function HideDatePickerIcon() {
	document.getElementById("calenderStartId").style.display = "none";
	document.getElementById("calenderEndId").style.display = "none";
}

function ShoweDatePickerIcon() {
	document.getElementById("calenderStartId").style.display = "";
	document.getElementById("calenderEndId").style.display = "";
}

function setCalenderDate(from, to) {
	document.getElementById("calendar_date_selector_field_instance0").value = from;
	document.getElementById("calendar_date_selector_field_instance1").value = to;
}

function informe_selectDate() {
	var dateSelected = document.getElementById('selectDatesId').value;

	HideDatePickerIcon();
	switch (dateSelected) {
	case "0":
		setCalenderDate(siv_currentDate(), siv_currentDate());
		break;
	case "1":
		setCalenderDate(informe_YesterDay(), informe_YesterDay());
		break;
	case "2":
		setCalenderDate(LastWeekStart(), LatWeekEnd());
		break;
	case "3":
		setCalenderDate(LastMonthStart(), LastMonthEnd());
		break;
	case "4":
		setCalenderDate(siv_currentDate(), LastSevenDay());
		break;
	case "5":
		setCalenderDate(siv_currentDate(), Last30Days());
		break;
	default:
		ShoweDatePickerIcon();
	}
}
