// JavaScript Document


var sImagesDirectoryPath = "images/";
var sIframeShimUrl = "calendar/blank.htm"; 

/*
FUNCTION NAME: addEventFunction
-----------------------------------------------------------------------
adds a function to the event specified.  Proposed replacement for addLoadEvent and appendFunction

Parameter Definitions
====================
func: the function to add to event
objElement: the element to add the event listener to
strEvent: the string name of the event such at "click" or "change"
*/
function addEventFunction(func, objElement, strEvent) {
  //ie only
  if (window.attachEvent) {
	objElement.attachEvent("on" + strEvent, func);
  }
  //all other browsers
  else if (window.addEventListener) {
	 objElement.addEventListener(strEvent, func, false);

  }
}

/*
FUNCTION NAME: addLoadEvent
-----------------------------------------------------------------------
adds a function to the add load event while preserving any previously added functions.

Parameter Definitions
====================
func: the function to add to the on load event
*/
function addLoadEvent(func) {
	addEventFunction(func, window, "load");
}

/* includes common functions ------------------------------------------
*/
document.write('<SCRIPT language="JavaScript" src="calendar/iframe_shim_utilities.js"></SCRIPT>');
document.write('<SCRIPT language="JavaScript" src="calendar/utilities.js"></SCRIPT>');

// Base name of object that contains the set rules for enabling/disabling the 
// dates in the Calendar grid. The actual name of the object is "oCalendarRules" 
// + instanceNumber where 'instanceNumber' is the number that identifies a 
// particular Calendar Date Selector instance counting from the top of the page. 
var sCalendarRulesInstanceBaseName = "oCalendarRules";
var sCalendarRulesInstanceName = null;

// Expected style class name of input element                                
var sInputElementClassName = "calendar_date_selector_field";

var gMinDaysPerBusinessWeek = 4; // Minimum number of days for the 1st week of Year to be a Business Week
var gFirstDayOfWeek = 0; // 0 = Sunday / 1 = Monday, etc

var activeCalPicker = null;

//needed for ie
var iFrameShim = null;

function y2k(number) { return (number < 1000) ? number + 1900 : number; }

function isValidDate (myDate,whatfield) {
	var dateFormat = eval("sInputDateFormat" + whatfield);

	if (myDate == null) return false;
	
	var testedDate = isDate(myDate,dateFormat);

	if (testedDate == true) {
		return true;
	} else {
		return false;
	}
}

// Non-Leap year Month days..
var Calendar_DOMonth = new Array();
Calendar_DOMonth = [31, 28, 31, 30, 31, 30, 31, 31, 30, 31, 30, 31];

// Leap year Month days..
var Calendar_lDOMonth = new Array();
Calendar_lDOMonth = [31, 29, 31, 30, 31, 30, 31, 31, 30, 31, 30, 31];

function addLeadingZeros(value) {
	if(value < 10) {
		value = '0' + value;
	}
	return value;
}

function calendarComponent_get_daysofmonth(monthIn, yearIn) {
	/* 
	Check for leap year ..
	1.Years evenly divisible by four are normally leap years, except for... 
	2.Years also evenly divisible by 100 are not leap years, except for... 
	3.Years also evenly divisible by 400 are leap years. 
	*/
	if ((yearIn % 4) == 0) {
		if ((yearIn % 100) == 0 && (yearIn % 400) != 0)
			return Calendar_DOMonth[monthIn];
	
		return Calendar_lDOMonth[monthIn];
	} else
		return Calendar_DOMonth[monthIn];
}

/*
    Calculate the week number of the week that includes the date passed as 
    argument (iYear, iMonth, iDay). The week number is calcuated taking into
    account the first day of week specified (iFirstDayOfWeek) and the minimal 
    days in first week of the year (iMinimalDaysInFirstWeek). The caller of this
    function may include an optional attribute called 
    bCallAWeekBelongingToLastYearWeekNumber_0 which determines whether the week 
    number returned for a date in a week that belongs to the previous year is 
    is 0 (zero) or to the actual week number of the previous year's last week. 
    If no value is specified in bCallAWeekBelongingToLastYearWeekNumber_0, false
    is used as the value for that argument.
    
    Note: 
    
    Valid values for iMonth:  0...11  (January to December)
    Valid values for iFirstOfWeek:  0...6 (Sunday to Saturday)
    Valid values for oMinimalDaysInFirstWeek:  1...7 
*/
function calculateWeekNumber(iYear, 
                             iMonth, 
                             iDay, 
                             iFirstDayOfWeek, 
                             iMinimalDaysInFirstWeek, 
                             bCallAWeekBelongingToLastYearWeekNumber_0) {

    // No value provided in argument bCallAWeekBelongingToLastYearWeekNumber_0? 
    if( arguments.length == 5){
        bCallAWeekBelongingToLastYearWeekNumber_0 = false;
    }
    
    // Get day of week of the first day of the year
    var oJan1Date = new Date(iYear, 0, 1);
    var iJan1DayOfWeek = oJan1Date.getDay();         
    
    // Get number of days in calendar's first week (Jan 1st. week)
    // First get Jan 1st's relative day of the week given the first date of week
    var iJan1RelativeDayNumber = 
        (iJan1DayOfWeek + 7 - iFirstDayOfWeek) % 7;   //  0 = Sun, 1 = Mon, etc.
    var iDaysInFirstWeekOfYear = 7 - iJan1RelativeDayNumber;
    
    // Set initial value in week number counter based on the number of days
    // in first week of the year
    var iWeekNumber = 0;;
    if(iDaysInFirstWeekOfYear >= iMinimalDaysInFirstWeek){
        iWeekNumber = 1;
    }
    
    // Get the date of the first day of the week in the week that contains 
    // Jan 1st and set it in oFirstDayOfWeek.
    var iDaysToFirstDayOfWeek = 7 - iDaysInFirstWeekOfYear;
    var oFirstDayOfWeek = 
       new Date(oJan1Date.setDate(oJan1Date.getDate() - iDaysToFirstDayOfWeek));
    
    // Date passed as argument
    var oDatePoint = new Date(iYear, iMonth, iDay);    
    
    // Count weeks up to the date that was passed to this fucntion
    while(oFirstDayOfWeek <= oDatePoint){
        var oAuxDate = new Date(oFirstDayOfWeek);
        var oLastDayOfWeek = new Date(oAuxDate.setDate(oAuxDate.getDate() + 6));
        
        if(oFirstDayOfWeek <= oDatePoint && oLastDayOfWeek >= oDatePoint){
            if(iWeekNumber == 0){
                // Date passed is in the first calendar week of the year
                if(bCallAWeekBelongingToLastYearWeekNumber_0 == false){
                    // Change week number in first calendar week to the previous
                    // year's last week number
                    iWeekNumber = calculateWeekNumber(iYear -1,
                                                      11,
                                                      31,
                                                      iFirstDayOfWeek,
                                                      iMinimalDaysInFirstWeek,
                                                      true);
                }
            }
            break;
        }
        oFirstDayOfWeek.setDate(oFirstDayOfWeek.getDate() + 7);
        iWeekNumber++;
    }
    
    // Adjust week number counter in the case the date passed occurs in the last 
    // week of year that belongs to next year
    if(iMonth == 11){
        // Get day of week of the first day in December
        var oDec31Date = new Date(iYear, 11, 31);
        var iDec31DayOfWeek = oDec31Date.getDay();         
    
        // Get number of days in the last week of December.
        // First get Dec. 31st's relative day of the week given the first date of week
        iDaysToFirstDayOfWeek = 
            (iDec31DayOfWeek + 7 - iFirstDayOfWeek) % 7;  // 0=Sun, 1=Mon, etc.
  
        var oFirstDayInLastWeekOfYear = 
           new Date(oDec31Date.setDate(oDec31Date.getDate() - iDaysToFirstDayOfWeek));
        var iDaysInLastWeekOfYear = iDaysToFirstDayOfWeek + 1;
        
        // Is the date passed as argument occurs in the last week of the year?
        if(oFirstDayInLastWeekOfYear <= oDatePoint){    
            // Does last week in the year belong to next year?
            if(( 7 - iDaysInLastWeekOfYear) >= iMinimalDaysInFirstWeek){
                // Set week number to 1 (week belongs to next year)
                iWeekNumber = 1;
            }
        }
    }
    return iWeekNumber;
}

function calendarComponent_clickOff(e) {
	if(activeCalPicker != null) {
		var calendarDateSelector = document.getElementById('calendar_date_selector');
		//Get Mouse Coordinates
		var mouse = getMouseCoords(e);
		//Get Picker Coordinates
		var coord = getElementCoordinates(calendarDateSelector);
		var dim = getElementDimensions(calendarDateSelector);
		//alert("x: " + coord.x + "<" + mouse.x + "<" + (coord.x + dim.w) + " y: " + coord.y + "<" + mouse.y + "<" + (coord.y + dim.h));
		//If clicked outside picker, close picker
		if((mouse.x >= coord.x)&&(mouse.x <= coord.x + dim.w)&&(mouse.y >= coord.y)&&(mouse.y <= coord.y + dim.h)) {
			return;
		} else {
			calendarComponent_Hide();
		}
	}
}

function calendarComponent_Show(whatfield) {
	
	//The following conditional statement is for the contingency that someone
	//clicks the same (or another) calendar icon while a calender is currently
	//open
	if (activeCalPicker == "calendar_date_selector_field_instance" + whatfield) {
		//If the user clicks the same icon, the current calendar closes
		calendarComponent_Hide();
		return;
	} else if (activeCalPicker != null) {
		//If the user clicks a different icon, the current calendar closes
		//and a new one opens
		calendarComponent_Hide();
	}
	activeCalPicker = "calendar_date_selector_field_instance" + whatfield;
	//Check for a current value of the datefield
	var calendar_currentvalue = document.getElementById("calendar_date_selector_field_instance" + whatfield).value;
	
	// Build name of CalendarRules 
	sCalendarRulesInstanceName = sCalendarRulesInstanceBaseName+ whatfield;
	
	// Get date format for input text element instance
	var dateFormat = eval("sInputDateFormat" + whatfield);
	//Validate current value of datefield
	var isCalendarValueValid = isValidDate(calendar_currentvalue,whatfield);
	
	if (isCalendarValueValid == true) {
		var oMillisecondsFromField = getDateFromFormat(calendar_currentvalue,dateFormat);
	
		var oDateFromField = new Date(oMillisecondsFromField);
		
		var calendar_currentvalue_date = oDateFromField.getDate();
        var calendar_currentvalue_month = oDateFromField.getMonth();
		var calendar_currentvalue_year = oDateFromField.getYear();
		
		if(calendar_currentvalue_year < 1000){
		   calendar_currentvalue_year += 1900;
		}
		
		//Show Proper Header Bar
		calendarComponent_headerbar(whatfield);
		//Show Proper Year Selector
		calendarComponent_yearsel(calendar_currentvalue_month,calendar_currentvalue_year,calendar_currentvalue_month,calendar_currentvalue_date,calendar_currentvalue_year,whatfield);
		//Show Proper Month Selector
		calendarComponent_monthsel(calendar_currentvalue_month,calendar_currentvalue_year,calendar_currentvalue_month,calendar_currentvalue_date,calendar_currentvalue_year,whatfield);
		//Show Proper Calendar Grid
		calendarComponent_calgrid(calendar_currentvalue_month,calendar_currentvalue_year,calendar_currentvalue_month,calendar_currentvalue_date,calendar_currentvalue_year,whatfield);
		//Show Select Today
		calendarComponent_selecttoday(whatfield);
	} else {
		//Show Proper Header Bar
		calendarComponent_headerbar(whatfield);
		//Show Proper Year Selector
		calendarComponent_yearsel(iCurrentMonth,iCurrentYear,null,null,null,whatfield);
		//Show Proper Month Selector
		calendarComponent_monthsel(iCurrentMonth,iCurrentYear,null,null,null,whatfield);
		//Show Proper Calendar Grid
		calendarComponent_calgrid(iCurrentMonth,iCurrentYear,null,null,null,whatfield);
		//Show Select Today
		calendarComponent_selecttoday(whatfield);
	}
	//Make Picker Visible
	document.getElementById("calendar_date_selector").className = "";
	//Set Picker Position
	var dateSelectorInstance = document.getElementById("calendar_date_selector_field_instance" + whatfield);
	var coord = getElementCoordinates(dateSelectorInstance);
	var dim = getElementDimensions(dateSelectorInstance);
	//place the calendar by the icon
	//alert("x: " + coord.x + " - y: " + coord.y);
	//alert("h: " + dim.h + " - w: " + dim.w);
	var calendarDateSelector = document.getElementById("calendar_date_selector");
	calendarDateSelector.style.left = (coord.x + dim.w) + "px";
	calendarDateSelector.style.top = (coord.y + dim.h) + "px";
	if (isIE) {
		var coordSel = getElementCoordinates(calendarDateSelector);
		var dimSel = getElementDimensions(calendarDateSelector);		
		iFrameShim.show(coordSel.x, coordSel.y, dimSel.w, dimSel.h, 100, 200);
	}
}

function calendarComponent_Clear() {
	var calendarDateSelector = document.getElementById("calendar_date_selector");
	calendarDateSelector.innerHTML = "";
}

function calendarComponent_Hide() {
	activeCalPicker = null;
	calendarComponent_Clear();
	document.getElementById("calendar_date_selector").className = "calendar_date_selector_hidden";
	if (isIE) iFrameShim.hide();
}

function calendarComponent_ChangeMonthOrYear(monthIn,yearIn,selMonth,selDate,selYear,whatfield) {
	calendarComponent_Clear();
	//Show Proper Header Bar
	calendarComponent_headerbar(whatfield);
	//Show Proper Year Selector
	calendarComponent_yearsel(monthIn,yearIn,selMonth,selDate,selYear,whatfield);
	//Show Proper Month Selector
	calendarComponent_monthsel(monthIn,yearIn,selMonth,selDate,selYear,whatfield);
	//Show Proper Calendar Grid
	calendarComponent_calgrid(monthIn,yearIn,selMonth,selDate,selYear,whatfield);
	//Show Select Today
	calendarComponent_selecttoday(whatfield);
}

function calendarComponent_SetPickerField(m, d, y, whatfield) {
	
	// Get date format of input text field instance
	var dateFormat = eval("sInputDateFormat" + whatfield);
	var oDateToSet = new Date(y, m-1, d);
	var whatvalue = formatDate(oDateToSet,dateFormat);
	document.getElementById(activeCalPicker).value = whatvalue;
	
	//check for onChange() on text field
	var customOnChange = document.getElementById(activeCalPicker).getAttribute('onchange');
	if(customOnChange) {
		//Execute text field's onChange()
		document.getElementById(activeCalPicker).onchange();
	}
	
	//document.getElementById(activeCalPicker).changed = true;
	//document.getElementById(activeCalPicker).blur();
	calendarComponent_Hide();
}


function calendarComponent_Init() {

	var elCalendarFields = getElementsByClass(sInputElementClassName, "input", document);
	
	//Initialize each date picker field on the current page
	for (var i = 0; i < elCalendarFields.length; i++) {
			sCalendarInstanceName = "calendar_date_selector_field_instance" + i;		
		//Create Field Links if not disabled
		elCalendarFields[i].setAttribute("id",sCalendarInstanceName);
		
		if (elCalendarFields[i].getAttribute("disabled") != true) {
			newNodeLink = document.createElement("a");
			var newNoneLinkImage = document.createElement("img");
			newNoneLinkImage.setAttribute("src",+ sImagesDirectoryPath + "show-calendar.gif");
			newNoneLinkImage.setAttribute("border","0");
			newNoneLinkImage.setAttribute("align","absmiddle");
			//Get Calendar Icon Alt Text from oCalendarConfiguration
			newNoneLinkImage.setAttribute("alt",eval("oCalendarConfiguration" + i +".getTitleLabel()"));
			
		  //  newNodeLink.appendChild(newNoneLinkImage); commeneted by amarnath
			elCalendarFields[i].parentNode.insertBefore(newNodeLink, elCalendarFields[i].nextSibling);
			newNodeLink.setAttribute("href","javascript:calendarComponent_Show(" + i + ");");
		} else {
			//newNodeLink = document.createElement("a");
			var disabledOldClassAttribute = elCalendarFields[i].className;
			elCalendarFields[i].className = disabledOldClassAttribute + " calendar_date_selector_field_disabled";
			newNoneLinkImageDisabled = document.createElement("img");
			newNoneLinkImageDisabled.setAttribute("src", sImagesDirectoryPath + "show-calendar-disabled.gif");
			newNoneLinkImageDisabled.setAttribute("border","0");
			newNoneLinkImageDisabled.setAttribute("align","absmiddle");
			newNoneLinkImageDisabled.setAttribute("alt",eval("oCalendarConfiguration" + i +".getTitleLabel()"));
			elCalendarFields[i].parentNode.insertBefore(newNoneLinkImageDisabled, elCalendarFields[i].nextSibling);
		}
	}
	if (elCalendarFields.length > 0) {
		//Apply onclick actions for closing a popup when a user clicks outside a popup 
		//(This function is only applied when there is at least on instance of the calendar popup)
		addEventFunction(calendarComponent_clickOff, document, "click");
		//Create Main Container
		newNodeCalContainer = document.createElement("div");
		document.getElementsByTagName("BODY")[0].appendChild(newNodeCalContainer);
		newNodeCalContainer.setAttribute("id","calendar_date_selector");
		//Hide Calendar Widget
		newNodeCalContainer.className = "calendar_date_selector_hidden";
		if (isIE) {
			iFrameShim = new IFrameShim("calendar_date_selector_iframeshim");
			iFrameShim.hide();
		}
	}
} // end of function

function calendarComponent_selecttoday(i) {
	var oCalendarRulesInstance = null;
    // Get instance of associated CalendarRules object, if any
    try {
        oCalendarRulesInstance = eval(sCalendarRulesInstanceName);

    }catch(exception){
        // Error: oCalendarRulesN is undefined
        // Do nothing. Null oCalendarRulesN handled below
    }
	
	//Insert "Today"
		//Create DIV
		var calendarDateSelector = document.getElementById("calendar_date_selector");
		newNodeTodayDiv = document.createElement("div");
		calendarDateSelector.appendChild(newNodeTodayDiv);
		newNodeTodayDiv.setAttribute("id","calendar_date_selector_selecttoday");
		
		//Create "Today" text
		
			//Today Label
			var sTodayLinkText = eval("oCalendarConfiguration" + i +".getCurrentDateLabel()");
			
			thisCurrentDateFormat = eval("oCalendarConfiguration" + i +".getCurrentDateFormat()");
			
			var oDateForToday = new Date(iCurrentYear, iCurrentMonth, iCurrentDayOfMonth);
			
			sTodayLinkText = sTodayLinkText + " " + formatDate(oDateForToday,thisCurrentDateFormat);
			
		if((oCalendarRulesInstance != null 
			&& ((oCalendarRulesInstance.includes(iCurrentYear, iCurrentMonth, iCurrentDayOfMonth ) 
			&& oCalendarRulesInstance.isSetForEnablingDates() ) 
			|| (! oCalendarRulesInstance.includes(iCurrentYear, iCurrentMonth, iCurrentDayOfMonth) 
			&& ! oCalendarRulesInstance.isSetForEnablingDates()) )) 
			|| oCalendarRulesInstance == null){
				//Create Link
				newNodeTodayLink = document.createElement("a");
				newNodeTodayDiv.appendChild(newNodeTodayLink);
				newNodeTodayLink.appendChild(document.createTextNode(sTodayLinkText));
				var gridMonth_MM = addLeadingZeros(iCurrentMonth - (-1));
				var gridDay_DD = addLeadingZeros(iCurrentDayOfMonth);
				//datePickerTodayUrl = "javascript:calendarComponent_SetPickerField('" + gridMonth_MM + "/" + gridDay_DD + "/" + iCurrentYear + "');";
				datePickerTodayUrl = "javascript:calendarComponent_SetPickerField('" + gridMonth_MM + "','" + gridDay_DD + "','" + iCurrentYear + "','" + i + "');";
				newNodeTodayLink.setAttribute("href",datePickerTodayUrl);
		} else {
			//Create Unselectable Today
			newNodeTodayLink = document.createElement("div");
			newNodeTodayLink.className = "calendar_date_selector_selecttoday_nonselectable";
			newNodeTodayDiv.appendChild(newNodeTodayLink);
			newNodeTodayLink.appendChild(document.createTextNode(sTodayLinkText));
		}
			
}

function calendarComponent_headerbar(i) {
	//Insert Header w/ Close Button
	var calendarDateSelector = document.getElementById("calendar_date_selector");
	newNodeHeaderbarDiv = document.createElement("div");
	calendarDateSelector.appendChild(newNodeHeaderbarDiv);
	newNodeHeaderbarDiv.setAttribute("id","calendar_date_selector_headerbar");
		//Create Close Button
		newNodeHeaderbarLink = document.createElement("a");
		newNodeHeaderbarDiv.appendChild(newNodeHeaderbarLink);
		newNodeHeaderbarLink.setAttribute("href","javascript:calendarComponent_Hide();");
		newNodeHeaderbarLinkImg = document.createElement("img");
		newNodeHeaderbarLink.appendChild(newNodeHeaderbarLinkImg);
		newNodeHeaderbarLinkImg.setAttribute("src", sImagesDirectoryPath + "closebutton.gif");
		newNodeHeaderbarLinkImg.setAttribute("alt", eval("oCalendarConfiguration" + i + ".getcloseImageAlternativeText()"));
		newNodeHeaderbarLinkImg.setAttribute("border","0");
		newNodeHeaderbarLinkImg.setAttribute("align","right");
		//Get Calendar Icon Alt Text from oCalendarConfiguration
		newNodeHeaderbarDiv.appendChild(document.createTextNode(eval("oCalendarConfiguration" + i +".getTitleLabel()")));
}


function calendarComponent_yearsel(inMonth,inYear,selMonth,selDate,selYear,whatfield) {
	var calendarDateSelector = document.getElementById('calendar_date_selector');
	var sNodeTodayDiv = document.getElementById('calendar_date_selector_selecttoday');
	
	//Create Year Selector Container
	newNodeYearSelector = document.createElement("div");
	calendarDateSelector.appendChild(newNodeYearSelector);
	newNodeYearSelector.setAttribute("id","calendar_date_selector_incrementyear");
		//Create Prev Year Link
		newNodePrevLink = document.createElement("a");
		newNodePrevLink.appendChild(document.createTextNode("<"));
		newNodeYearSelector.appendChild(newNodePrevLink);
		newNodePrevLink.setAttribute("href","javascript:calendarComponent_ChangeMonthOrYear(" + inMonth + "," + (inYear - 1) + "," + selMonth + "," + selDate + "," + selYear + "," + whatfield + ");");
		//Commenting out Hardcoded English Tooltip
		//newNodePrevLink.setAttribute("title","< Previous Year");
		
		//Display Year
		newNodeYearSelector.appendChild(document.createTextNode(" " + inYear + " "));
		//Create Next Year Link
		newNodeNextLink = document.createElement("a");
		newNodeNextLink.appendChild(document.createTextNode(">"));
		newNodeYearSelector.appendChild(newNodeNextLink);
		newNodeNextLink.setAttribute("href","javascript:calendarComponent_ChangeMonthOrYear(" + inMonth + "," + (inYear - (-1)) + "," + selMonth + "," + selDate + "," + selYear + "," + whatfield +");");
		//Commenting out Hardcoded English Tooltip
		//newNodeNextLink.setAttribute("title","Next Year >");
}

function calendarComponent_monthsel(inMonth,inYear,selMonth,selDate,selYear,whatfield) {
	var calendarDateSelector = document.getElementById('calendar_date_selector');
	var sNodeTodayDiv = document.getElementById('calendar_date_selector_selecttoday');
	
	//Create Month Selector
	//Create Table
	newNodeMonthPicker = document.createElement("table");
	calendarDateSelector.appendChild(newNodeMonthPicker);
	newNodeMonthPicker.setAttribute("id","calendar_date_selector_monthpicker");
	//Create Tbody
	newNodeMonthPickerTbody = document.createElement("tbody");
	newNodeMonthPicker.appendChild(newNodeMonthPickerTbody);
	//Create Row 1
	newNodeMonthPickerTr = document.createElement("tr");
	newNodeMonthPickerTbody.appendChild(newNodeMonthPickerTr);
		//Create Td
		for (var j = 0; j < 6; j++) {
			newNodeMonthPickerTd = document.createElement("td");
			newNodeMonthPickerTr.appendChild(newNodeMonthPickerTd);
			if(j == inMonth) {
				newNodeMonthPickerTdStrong = document.createElement("strong");
				newNodeMonthPickerTd.appendChild(newNodeMonthPickerTdStrong);
				newNodeMonthPickerTdA = document.createElement("a");
				newNodeMonthPickerTdStrong.appendChild(newNodeMonthPickerTdA);
			} else {
				newNodeMonthPickerTdA = document.createElement("a");
				newNodeMonthPickerTd.appendChild(newNodeMonthPickerTdA);
			}
			newNodeMonthPickerTdA.appendChild(document.createTextNode(aCalendar_MonthsAbrv[j]));
			newNodeMonthPickerTdA.setAttribute("href","javascript:calendarComponent_ChangeMonthOrYear(" + j + "," + inYear + "," + selMonth + "," + selDate + "," + selYear + "," + whatfield + ");");
			newNodeMonthPickerTdA.setAttribute("title",aCalendar_Months[j]);
		}
	//Create Row 2
	newNodeMonthPickerTr = document.createElement("tr");
	newNodeMonthPickerTbody.appendChild(newNodeMonthPickerTr);
		//Create Td
		for (var j = 6; j < 12; j++) {
			newNodeMonthPickerTd = document.createElement("td");
			newNodeMonthPickerTr.appendChild(newNodeMonthPickerTd);
			if(j == inMonth) {
				newNodeMonthPickerTdStrong = document.createElement("strong");
				newNodeMonthPickerTd.appendChild(newNodeMonthPickerTdStrong);
				newNodeMonthPickerTdA = document.createElement("a");
				newNodeMonthPickerTdStrong.appendChild(newNodeMonthPickerTdA);
			} else {
				newNodeMonthPickerTdA = document.createElement("a");
				newNodeMonthPickerTd.appendChild(newNodeMonthPickerTdA);
			}
			newNodeMonthPickerTdA.appendChild(document.createTextNode(aCalendar_MonthsAbrv[j]));
			newNodeMonthPickerTdA.setAttribute("href","javascript:calendarComponent_ChangeMonthOrYear(" + j + "," + inYear + "," + selMonth + "," + selDate + "," + selYear + "," + whatfield + ");");
			newNodeMonthPickerTdA.setAttribute("title",aCalendar_Months[j]);
		}
}


function calendarComponent_calgrid(inMonth,inYear,selMonth,selDate,selYear,whatfield) {
        
    var oCalendarRulesInstance = null;
    // Get instance of associated CalendarRules object, if any
    try {
        oCalendarRulesInstance = eval(sCalendarRulesInstanceName);

    }catch(exception){
        // Error: oCalendarRulesN is undefined
        // Do nothing. Null oCalendarRulesN handled below
    }
    
	//Determine first day of week
	iThisFirstDayOfWeek = eval("oCalendarConfiguration" + whatfield +".getFirstDayOfWeek()");
	
	//Determine if Week Column should be shown
	if (eval("oCalendarConfiguration" + whatfield +".getDisplayWeekNumber()") == true) {
	var gShowBusinessWkColumn = 1;
	} else {
	var gShowBusinessWkColumn = 0;	
	}
	
	var gridDate = new Date();
	gridDate.setDate(1);
	gridDate.setMonth(inMonth);
	gridDate.setFullYear(inYear);
	
	if(iThisFirstDayOfWeek == 0) {
		var gridFirstDay = gridDate.getDay();
	} else {
		var gridFirstDay = gridDate.getDay() + (7 - iThisFirstDayOfWeek);
		if (gridFirstDay > 6) {
			gridFirstDay = gridFirstDay - 7;
		}
	}
	var gridDay=1;
	var gridLastDay=calendarComponent_get_daysofmonth(inMonth, inYear);
	var gridOnLastDay=0;
	
	
	var calendarDateSelector = document.getElementById('calendar_date_selector');
	var sNodeTodayDiv = document.getElementById('calendar_date_selector_selecttoday');
	//Create Calendar
		//Create Table
		newNodeCalendar = document.createElement("table");
		calendarDateSelector.appendChild(newNodeCalendar);
		newNodeCalendar.setAttribute("id","calendar_date_selector_grid");
		//Create Colgroup
		newNodeColGroup = document.createElement("colgroup");
		newNodeCalendar.appendChild(newNodeColGroup);
			//Create Cols
			if (gShowBusinessWkColumn == 1) {
				newNodeCol = document.createElement("col");
				newNodeColGroup.appendChild(newNodeCol);
				newNodeCol.className = "calendar_date_selector_wkcolumn";
			}
			for (var j = 0; j < 7; j++) {
				newNodeCol = document.createElement("col");
				newNodeColGroup.appendChild(newNodeCol);
				newNodeCol.className = "calendar_date_selector_column";
			}
		//Create Header Row
		newNodeThead = document.createElement("thead");
		newNodeCalendar.appendChild(newNodeThead);
		newNodeHeaderRow = document.createElement("tr");
		newNodeThead.appendChild(newNodeHeaderRow);
			//Create TH
			if (gShowBusinessWkColumn == 1) {
				newNodeTh = document.createElement("th");
				newNodeTh.appendChild(document.createTextNode(eval("oCalendarConfiguration" + whatfield +".getWeekNumberLabel()")));
				//getWeekNumberLabel
				newNodeTh.setAttribute("title",eval("oCalendarConfiguration" + whatfield +".getWeekNumberTooltipText()"));
				newNodeHeaderRow.appendChild(newNodeTh);
			}
			for (var k = iThisFirstDayOfWeek; k < 7; k++) {
				newNodeTh = document.createElement("th");
				newNodeTh.appendChild(document.createTextNode(aCalendar_DaysOfWeekAbrv[k]));
				newNodeTh.setAttribute("title",aCalendar_DaysOfWeek[k]);
				newNodeHeaderRow.appendChild(newNodeTh);
			}
			for (var k = 0; k < iThisFirstDayOfWeek; k++) {
				newNodeTh = document.createElement("th");
				newNodeTh.appendChild(document.createTextNode(aCalendar_DaysOfWeekAbrv[k]));
				newNodeTh.setAttribute("title",aCalendar_DaysOfWeek[k]);
				newNodeHeaderRow.appendChild(newNodeTh);
			}
		//Create Tbody
		newNodeTbody = document.createElement("tbody");
		newNodeCalendar.appendChild(newNodeTbody);
		
		
		//Create First Row
			//Create Row
			newNodeRow = document.createElement("tr");
			newNodeTbody.appendChild(newNodeRow);
			
			//Calculate Week
			var iFirstDayOfWeek = 
                eval("oCalendarConfiguration" + whatfield + ".getFirstDayOfWeek()");
			
			var iMinimalDaysInFirstWeekOfYear = 
                eval("oCalendarConfiguration" + whatfield + ".getMinimalDaysInFirstWeek()");
			
            var iWeekNumber = 
                calculateWeekNumber(inYear, 
                                    inMonth,
                                    gridDay, 
                                    iFirstDayOfWeek, 
                                    iMinimalDaysInFirstWeekOfYear, 
                                    false );
			     
				if (gShowBusinessWkColumn == 1) {
					newNodeTd = document.createElement("td");
					newNodeRow.appendChild(newNodeTd);
					newNodeTd.appendChild(document.createTextNode(iWeekNumber));
				}
				//Create Leading Empty Cells (If Necessary)
				for (i=0; i<gridFirstDay; i++) {
					newNodeTd = document.createElement("td");
					newNodeRow.appendChild(newNodeTd);
					newNodeTd.appendChild(document.createTextNode(" "));
				}
				//Create Rest of Week One
				for (j=gridFirstDay; j<7; j++)  {
					newNodeTd = document.createElement("td");
					newNodeRow.appendChild(newNodeTd);
					if((inMonth==selMonth)&&(gridDay==selDate)&&(inYear==selYear)) newNodeTd.className = "calendar_date_selector_selecteddate";
					if((inMonth==iCurrentMonth)&&(gridDay==iCurrentDayOfMonth)&&(inYear==iCurrentYear)) newNodeTd.setAttribute("id","calendar_date_selector_currentdate");
						//Create Link
                    if((oCalendarRulesInstance != null 
                        && ((oCalendarRulesInstance.includes(inYear, inMonth, gridDay ) && 
                            oCalendarRulesInstance.isSetForEnablingDates() ) ||
                           (! oCalendarRulesInstance.includes(inYear, inMonth, gridDay) &&
                            ! oCalendarRulesInstance.isSetForEnablingDates()) )) ||
                         oCalendarRulesInstance == null){
	                   
	                   // Set date as enabled 
					   newNodeTdA = document.createElement("a");
					   newNodeTd.appendChild(newNodeTdA);
					   newNodeTdA.appendChild(document.createTextNode(gridDay));
					   var gridMonth_MM = addLeadingZeros(inMonth - (-1));
					   var gridDay_DD = addLeadingZeros(gridDay);
					   datePickerUrl = "javascript:calendarComponent_SetPickerField('" + gridMonth_MM + "','" + gridDay_DD + "','" + inYear + "','" + whatfield + "');";
					   newNodeTdA.setAttribute("href",datePickerUrl);
					   
					}else{
           			   // Set date as disabled
           			   newNodeTd.className = "calendar_date_selector_nonselectable";
           			   newNodeTd.appendChild(document.createTextNode(gridDay));
					}
					
					gridDay=gridDay + 1;
				}
			// Write the rest of the weeks
			for (k=2; k<7; k++) {
				//Create Row
				newNodeRow = document.createElement("tr");
				newNodeTbody.appendChild(newNodeRow);
				
				iWeekNumber = 
                    calculateWeekNumber(inYear, 
                                        inMonth,
                                        gridDay, 
                                        iFirstDayOfWeek, 
                                        iMinimalDaysInFirstWeekOfYear, 
                                        false );
 
				if (gShowBusinessWkColumn == 1) {
					newNodeTd = document.createElement("td");
					newNodeRow.appendChild(newNodeTd);
					newNodeTd.appendChild(document.createTextNode(iWeekNumber));
				}
				for (j=0; j<7; j++) {
					//Create Cell
					newNodeTd = document.createElement("td");
					newNodeRow.appendChild(newNodeTd);
					if((inMonth==selMonth)&&(gridDay==selDate)&&(inYear==selYear)) newNodeTd.className = "calendar_date_selector_selecteddate";
					if((inMonth==iCurrentMonth)&&(gridDay==iCurrentDayOfMonth)&&(inYear==iCurrentYear)) newNodeTd.setAttribute("id","calendar_date_selector_currentdate");
						//Create Link
                    if((oCalendarRulesInstance != null 
                        && ((oCalendarRulesInstance.includes(inYear, inMonth, gridDay ) && 
                            oCalendarRulesInstance.isSetForEnablingDates() ) ||
                           (! oCalendarRulesInstance.includes(inYear, inMonth, gridDay) &&
                            ! oCalendarRulesInstance.isSetForEnablingDates()) )) ||
                         oCalendarRulesInstance == null ){ 
	                
	                   	// Set date as enabled
				        newNodeTdA = document.createElement("a");
						newNodeTd.appendChild(newNodeTdA);
						newNodeTdA.appendChild(document.createTextNode(gridDay));
						var gridMonth_MM = addLeadingZeros(inMonth - (-1));
						var gridDay_DD = addLeadingZeros(gridDay);
						datePickerUrl = "javascript:calendarComponent_SetPickerField('" + gridMonth_MM + "','" + gridDay_DD + "','" + inYear + "','" + whatfield + "');";
						newNodeTdA.setAttribute("href",datePickerUrl);
	                   
				    }else{
				       // Set date as disabled
				       newNodeTd.className = "calendar_date_selector_nonselectable";
					   newNodeTd.appendChild(document.createTextNode(gridDay));
				    }
 					gridDay=gridDay + 1;

					if (gridDay > gridLastDay) {
						gridOnLastDay = 1;
						break;
					}
				}

				if (gridOnLastDay == 1)
					break;
			}
}

/* CalendarConfiguration class. ------------------------------------------------
   Data Transfer Object (DTO) that contains the information required to render
   a calendar date selector pop-up
   
   Constructor parameters:
    sTitleLabel -
       Label to be displayed on the title bar of the calendar date selector pop-
       up
    bDisplayWeekNumber -
       Flag that indicates if the calendar displayed includes a column showing
       the week number for every week.
    sWeekNumberLabel -
       Heading for the week number column on the calendar
    sWeekNumberTooltipText
       Text displayed when the mouse pointer is hovering over the week number 
       column heading
    iFirstDayOfWeek -
       First day of the week displayed on the calendar. Valid values include: 
       0 - Sunday
       1 - Monday
       ...
       6 - Saturday
    iMinimalDayOfWeek -
       Minimal days required in the first week of the year.
    sCurrentDateLabel -
       Label to display next to the current date shown on the calendar date 
       selector pop-up
    sCurrentDateFormat -
       Format to apply when displaying the current date on the calendar date 
       selector pop-up.   
*/
function CalendarConfiguration(sTitleLabel, sCloseImageAlternativeText, 
                               bDisplayWeekNumber, sWeekNumberLabel, 
                               sWeekNumberTooltipText, iFirstDayOfWeek, 
                               iMinimalDaysInFirstWeek, sCurrentDateLabel, 
                               sCurrentDateFormat){

    this.titleLabel = sTitleLabel;
    this.closeImageAlternativeText = sCloseImageAlternativeText,
    this.displayWeekNumber = bDisplayWeekNumber;
    this.weekNumberLabel = sWeekNumberLabel;
    this.weekNumberTooltipText = sWeekNumberTooltipText;
    this.firstDayOfWeek = iFirstDayOfWeek;
    this.minimalDaysInFirstWeek = iMinimalDaysInFirstWeek;
    this.currentDateLabel = sCurrentDateLabel;
    this.currentDateFormat = sCurrentDateFormat;
}

/**
    Method getTitleLabel()
    
    Returns the String in member variable titleLabel
*/
CalendarConfiguration.prototype.getTitleLabel = function(){
    return this.titleLabel;
} 

/**
    Method getcloseImageAlternativeText()
    
    Returns the String in member variable closeImageAlternativeText
*/
CalendarConfiguration.prototype.getcloseImageAlternativeText = function(){
    return this.closeImageAlternativeText;
}

/**
   Method getDisplayWeekNumber()
   
   Returns the boolean value in member variable displayWeekNumber
*/
CalendarConfiguration.prototype.getDisplayWeekNumber = function(){
    return this.displayWeekNumber;
}

/**
   Method getWeekNumberLabel()
   
   Returns the String in member variable weekNumberLabel
*/
CalendarConfiguration.prototype.getWeekNumberLabel = function(){
    return this.weekNumberLabel;
}

/**
   Method getWeekNumberTooltipText()
   
   Returns the String in member variable weekNumberTooltipText
*/
CalendarConfiguration.prototype.getWeekNumberTooltipText = function(){
    return this.weekNumberTooltipText;
}

/**
   Method getFirstDayOfWeek()
   
   Returns the integer value in member variable firstDayOfWeek
*/
CalendarConfiguration.prototype.getFirstDayOfWeek = function(){
    return this.firstDayOfWeek;
}

/**
   Method getMinimalDaysInFirstWeek()
   
   Returns the integer value in member variable minimalDaysInFirstWeek
*/
CalendarConfiguration.prototype.getMinimalDaysInFirstWeek = function(){
    return this.minimalDaysInFirstWeek;
}

/**
   Method getCurrentDateLabel()
   
   Returns the String in member variable currentDateLabel
*/
CalendarConfiguration.prototype.getCurrentDateLabel = function(){
    return this.currentDateLabel;
}

/**
   Method getCurrentDateFormat()
   
   Returns the String in member variable currentDateFormat
*/
CalendarConfiguration.prototype.getCurrentDateFormat = function(){
    return this.currentDateFormat;
}

addLoadEvent(calendarComponent_Init);

// Check if app_config_for_presentation_fw.js variables have been declared and
// valid values have been assign to them.

if (typeof sImagesDirectoryPath == "undefined") {
    alert('JavaScript variable "sImagesDirectoryPath" has not been declared ' +
        'or no value has been assigned to it. Please make sure that file ' +
        'app_config_for_presentation_fw.js (distributed with the Presentation '+
        'framework) has been included in your JSP page and that it contains ' +
        'a definition for variable "sImagesDirectoryPath".');
}
if (typeof sIframeShimUrl == "undefined")  {
    alert('JavaScript variable "sIframeShimUrl " has not been declared ' +
        'or no value has been assigned to it. Please make sure that file ' +
        'app_config_for_presentation_fw.js (distributed with the Presentation '+
        'framework) has been included in your JSP page and that it contains ' +
        'a definition for variable "sIframeShimUrl ".');
}

if(typeof sImagesDirectoryPath != "undefined"){
   if(sImagesDirectoryPath == null || sImagesDirectoryPath == "" ){
      alert('JavaSript variable "sImagesDirectoryPath" in file ' +
      'app_config_for_presentation_fw.js contains an invalid value (empty ' +
      'String or null). Please assign a valid value to "sImagesDirectoryPath".');
   }  
}
  
if(typeof sIframeShimUrl != "undefined"){
    if(sIframeShimUrl == null || sIframeShimUrl == "" ){
      alert('JavaSript variable "sIframeShimUrl" in file ' +
      'app_config_for_presentation_fw.js contains an invalid value (empty ' +
      'String or null). Please assign a valid value to "sIframeShimUrl".');
    }
}
