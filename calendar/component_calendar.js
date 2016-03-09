/*******************************************
Calendar (version .93)
---------------
Creates a fully-threaded popup-Calendar linked to a form input field.  This calendar is highly customizable.  See documentation for full details.

REQUIRES MOOTOOLS VERSION 1.11
Incompatible with any other version of Mootools.

Calendar 
By Scott Shepard, Eric Schrage and others
2008-10-07 (version 0.93) sshepar3 - 
	Added: 
		Component Registry
		Requires Mootilities version 2.28

2008-08-26 (version .92) sshepar3 - 
	Updated: bug fix with positioning.
	
2008-08-12 (version .91) sshepar3 - 
	Added: 
		version declaration, 
		version compatibility checking, 
		window edge detection.  
		Requires mootilities v.2.27.
		
08/04/2008 (version .9) sshepar3 - First Tech review and updates completed
*******************************************/
window.calendar = .93
if (mootilities < 2.28) alert('Your version of Mootilities.js is incompatible with component_calendar.js'); 

/* AUTO-LOAD CALENDAR COMPONENT */
window.componentRegistry.addComponent('calendar', function(options){
														   
	var calendarInputs = $ES('input.calendar_date_selector_field', options.root);	
	calendarInputs.each(function(input, i){ 
		new Calendar($merge(options, {'inputField':input}))
	});
	
});

/*
CLASS NAME: Calendar
--------------------------------
Creates a pop-up calendar for selecting dates.

USAGE:
============
A form is required with at least one input field.

Creating a calendar:
new Calendar({'inputField': myform.dateField})

INPUTS: (Object) - 
===============
Default inputs are listed in the 'options' property.  You may override inputs by setting them directly when creating the Calendar as with the 'inputField' in the example above, or use a hidden field that matches the name of the input text field + 'Options', like: <input name="dateFieldOptions" type="hidden" value="{ title:"Please select date" }

	year: (Integer) a 4-digit year,
	month: (Integer) a two-digit month starting with 0 as January,
	day: day of the month,
	months: (Hash key:value pairs.)  The 'key' is the full name of the month 
		(language-independent), the 'value' is the abbreviation.
	days: (Hash key:value pairs.) Just like months.  The 'key' is the name of 
		the day of week, like 'Monday' and the 'value' is the abbreviation, 
		like 'Mon'.
	inputDateFormat: (String) Date formatting string, like, "MM/dd/yyyy".  See 
		Calendar.formatDate for details.
	title: (String) The text that appears at the top of the calendar, like: 
		"Select a date",
	displayWeekNumber: (boolean [true,false]), shows an additional column with 
		the week number in front of the week.  Defaus to 'false'.
	weekNumberLabel: (String) The column heading for week number.  Not displayed if 
		displayWeekNumber = false.  Defaults to "wk#".
	weekNumberTooltipText: (String) Floating text that appears when mouse is over 
		the weekNumberLabel.  Defaults to "Week Number"
	firstDayOfWeek: (String) The day you want the week to start on.  Language-
		independent.  Must match a key from 'days'.  Defaults to "Sunday".
	minDaysInFirstWeek: (Integer [1-7]) Minimum number of days in first week of the 
		year.  Influences when to begin counting the first week.  If 1 is used, then 
		the week counter always starts on the first day of the new year.  If 7 is 
		chosen, then the first full week of the new year begins the counting.  
		Default is 1.
	showCurrentDateLabel: (boolean) The current date is marked in the calendar grid 
		with a red outline, but is also written in its own area at the bottom of the 
		Calendar.  Set to true, this option provides a clickable link to today's date.  
		Defalt is 'true'.
	currentDateLabel: (String) The current date's label prefix.  Defaults to "Today - ".
	currentDateFormat: (String, date format) The current date's date format.  
		Defaults to "MMMM dd, yyyy".
	closeAltText: (String) There is a close button at the top-right of the calendar.  
		This text appears when you mouse over it.  Defaults to "Close Calendar".
	closeButton: (String, url) Close button image.  You can replace it with your own.  
		Defaults to sImagesDirectoryPath + "closebutton.gif".
	rules: (array of functions) These rules effect which dates are selectable.  See 
		documentation for details.  null,
	inputField: (HTMLInputElement) This field will be automatically detected at page 
		load using the css selector supplied in the onload event.
*/
var Calendar = new Class ({
	
	/* 
	CALENDAR PARAMETER: (Object) options
	------------------------------
	Default options. Any of these can be overridden at Calendar creation time. 
	*/
	options: {
		year: null,
		month: null,
		day: null,
		months: { January:"Jan", February:"Feb", March:"Mar", April:"Apr", May:"May", June:"Jun", July:"Jul", August:"Aug", September:"Sep", October:"Oct", November:"Nov", December:"Dec"},
		days: { Sunday:'Sun', Monday:'Mon', Tuesday:'Tue', Wednesday:'Wed', Thursday:'Thu', Friday:'Fri', Saturday:'Sat'},
		inputDateFormat: "MM/dd/yyyy",
		title: "Select a date",
		displayWeekNumber: false, 
		weekNumberLabel: "wk#",
		weekNumberTooltipText: "Week Number",
		firstDayOfWeek: "Sunday", 
		minDaysInFirstWeek: 1,
		showCurrentDateLabel: true, 
		currentDateLabel: "Today - ", 
		currentDateFormat: "MMMM dd, yyyy",
		closeAltText: "Close Calendar",
		closeButton: sImagesDirectoryPath + "closebutton.gif",
		rules:null,
		inputField: null
	},
	
	
	/* 
	CALENDAR METHOD: (Calendar) initialize
	---------------------------------
	Perform these tasks upon Class object instantiation. 
	*/
	initialize: function(options){
		
		this.setProperties(options);
		this.detectDateInputField();
		options = $merge(options, this.getOptions());
		this.setProperties(options);
		
		/* add unavailable dates */
		if (!this.rules) this.rulesSet = null
		else {
			this.rules = this.rules || [];
			this.rulesSet = new CalendarRules();
			for (var i=0,rule;rule = this.rules[i];i++){
				this.rulesSet.addRule(rule)
			}
		}
		this.buildCalendar();
		this.inputField.addEvent('blur', function(){ this.selectDateFromInput() }.bind(this));
	}

});	
	

/*   
CALENDAR PROTOTYPE: buildCalendar (void)
---------------------------------
Create the Calendar in DHTML.  When we create it, we immediately hide it so it doesn't pollute the screen when it is being created.
*/
Calendar.prototype.buildCalendar = function(){
	this.calendarWrap = new Element('div', { 'styles': { position:'absolute', top:0, left:0, opacity:0 }})
		.inject(document.body);
	hide(this.calendarWrap);
	this.calendarWrap.hideFx(function(){show(this.calendarWrap)}.bind(this));
	/* 
		Make the calendar draggable.
		Don't let it go outside the window.
		Don't let it alter the window.
		Remember its position. 
	*/
	this.calendarWrap.makeDraggable({
			onBeforeStart: function(){ this.windowSavedState = window.getCoordinates(); }.bind(this),
			onDrag: function(){this.calendarWrap.setPosition({elAnchor:"closest",'relativeEl':this.windowSavedState});}.bind(this),
			onComplete:function(){
				this.userPosition = true;
				this.calendarWrap.setPosition({elAnchor:'closest'});
			}.bind(this)
		});
	
	/* The visual part of the calendar */
	this.calendar = new Element('div', { 'class':"calendar_date_selector" })
		.inject(this.calendarWrap);
	
	
	/*
	this.date is the current calendar view.
	this.selectedDate is the date selected, which will match this.inputField.value, or what was preset in the Calendar inputFieldOptions.
	*/
	var minDate = new Date(1960, 0,1)
	if (this.selectedDate > minDate) {
		this.date = this.selectedDate.clone()
		this.updateInputField(this.selectedDate);
	} else {
		date = $(this.inputField).value
		if ($chk(date) && this.isDate(date)){
			this.date = this.getDateFromFormat(date)
			this.selectedDate = this.date.clone()
		} else {
			this.date = new Date();
			this.selectedDate = new Date();
		}
	}
	
	/* update or create new Calendar parts */
	this.updateHeader();
	this.updateYear();
	this.updateMonth();
	this.updateDateGrid();
	this.updateFooter();
	
	/* iFrame fixes a z-index bug in ie6 related to select menus */
	if (window.ie6){ this.setIFrame() }
	
	/* the Calendard wrap must be the same dimensions as the Calendar */
	this.resizeCalendarWrap();
	
	/* all Calendars must hide if any other part of the page is clicked on. */
	document.body.addEvent('click', function(e) {
		if (this.open && !clickedOn(e, this.calendar)) {
			this.calendarWrap.hideFx( function(){ this.open = false; }.bind(this) ) 
		}
	}.bind(this) );
	
}


/*
CALENDAR PROTOTYPE: createDateGrid (void)
---------------------------------
Build the date chart for the month/year view.  Apply click events, today and selected date styles.
*/
Calendar.prototype.createDateGrid = function(){
	
	/* PRIVATE FUNCTION: createDayElement
	-----------------------------------------
	Create a Day Element with the given date for the Date Grid and insert it.
	
	PARAMETERS:
	===============
	selectedDate: (Date) the currently selected date.
	date: (Date) the month and year information for the current view on the Calendar.
	gridDay: (Integer) The day of month we are creating the table cell for.
	*/
	var createDayCell = function(selectedDate, date, day, columns) {
		
		/* if this date violates a rule, then mark it non-selectable */
		date = new Date(date.getFullYear(), date.getMonth(), day);
		if (!this.rulesTest(date)){

			createInactiveDayCell(day, columns, {
				'class':'calendar_date_selector_nonselectable'
			});
						
			return;
		}


		/* Create a new linkable date */
		var dayEl = new Element('div')
			.inject(this.daysTable)			


		/* mark this as selected date */
		if (
			(date.getMonth() == selectedDate.getMonth()) &&
			(day == selectedDate.getDate()) &&
			(date.getFullYear() == selectedDate.getFullYear())
		) dayEl.addClass('calendar_date_selector_selecteddate');
		
		
		/* mark this as today's date */
		var today = new Date();
		if (
			(date.getMonth() == today.getMonth()) &&
			(day == today.getDate()) &&
			(date.getFullYear() == today.getFullYear())
		) dayEl.addClass('calendar_date_selector_currentdate');
		
		/* Create Link */
		createDateLink(day, date, dayEl, this.inputDateFormat, this.inputField);
		dayEl.setStyle('width', getColumnWidth(columns, true));
		
		
	}.bind(this);
	/* [END] createDayCell private function 
	
	
	/*
	PRIVATE FUNCTION: createInactiveDayCell (void)
	-----------------------------------------------
	Creates a cell that has no link.
	
	PARAMETERS: 
	==============
		text (String) - The text of the new element (probably the day).
		options (Object) - Additional attributes like 'class' and 'title'
	*/
	var createInactiveDayCell = function(text, columns, options){
		var el = new Element('div', options)
					.inject(this.daysTable)
					.setStyle('width', getColumnWidth(columns));
		
		new Element('span', { 'class': 'fauxAnchor' })
			.setText(text)
			.inject(el);
	}.bind(this)
	
	
	/*
	PRIVATE FUNCTION: createDateLink (void)
	---------------------------------------
	Creates the link behavior for a particular date in the Date Grid.
	
	PARAMETERS:
	===============
	day: (Integer) the day in the Date Grid we are creating the link for.
	date: (Date) the month and year information for the current view on the Calendar.
	parent: (HTMLElement) the TD this link is being inserted into.
	inputDateFormat: (String) a date format
	inputField: (HTMLInputElement) The input field which will be updated.
	*/
	var createDateLink = function(day, date, parent, inputDateFormat, inputField){
		new Element('a', { 'href':'javascript:;' } )
			.setText(day)
			.inject(parent)
			.addEvent('click', function(){
				
				this.selectedDate = date;
				this.updateDateGrid();
				this.updateInputField(date, inputDateFormat, inputField)
				
			}.bind(this))
	}.bind(this)
	/* [END] createDateLink private function */
	
	
	/*
	PRIVATE FUNCTION: getDaysOfMonth (Integer)
	--------------------------------------------------
	Check for leap year:
	1.Years evenly divisible by four are normally leap years, except for... 
	2.Years also evenly divisible by 100 are not leap years, except for... 
	3.Years also evenly divisible by 400 are leap years.
	
	RETURNS: number of days for this.date.getMonth()
	*/
	var getDaysOfMonth = function(date) {
		var month = date.getMonth(), year = date.getFullYear()
		/* Non-Leap year days indexed by month.*/
		var nonLeapDays = [31, 28, 31, 30, 31, 30, 31, 31, 30, 31, 30, 31];
		
		/* Leap year days indexed by month. */
		var leapDays = [31, 29, 31, 30, 31, 30, 31, 31, 30, 31, 30, 31];
		if ((year % 4) == 0) {
			if ((year % 100) == 0 && (year % 400) != 0) return nonLeapDays[month];
			return leapDays[month];
		} 
		return nonLeapDays[month];
	}
	
	/*
	PRIVATE FUNCTION: getColumnWidth (Integer)
	-------------------------------------
	Calculates the width of the columns.
	
	PARAMETERS: 
	===============
		columns (Integer) - the number of columns to appear.
		anchor (Boolean, optional) - Whether an anchor tag is inside.
	*/
	var getColumnWidth = function(columns, anchor) {
		var tableWidth = this.daysTable.scrollWidth
		tableWidth -= columns * 2 ;
		
		if (window.ie6) {
			if (anchor) tableWidth = tableWidth/columns - 2;
			else tableWidth = tableWidth/columns - 1;
		
		} else {
		
			if (anchor)  tableWidth = tableWidth/columns - 1;
			else tableWidth = tableWidth/columns - 1;
		}
		
		return tableWidth;
	}.bind(this);
	
	

	var date = this.date.clone()
	date.setDate(1);
	
	this.daysTable = new Element('div', { 'class':'calendar_date_selector_days' })
		.injectAfter(this.monthTable)
	
	var columns = 7;
	
	
	/* optional column that displays the number of weeks from beginning of year */
	if (this.displayWeekNumber) {
		
		columns = 8;

		createInactiveDayCell(this.weekNumberLabel, columns, {
			'class':'calendar_date_selector_wkcolumn',
			'title':this.weekNumberTooltipText
		});
	}
	
	/* an array of day names */
	var daysOfWeekKeys = $H(this.days).keys()
	/* an array of day abbriviations */
	var daysOfWeekValues = $H(this.days).values()
	/* column headings start with the first day of the week as defined */
	var firstDayIndex = getPropertyIndexByKey(this.firstDayOfWeek, this.days);
	
	/* create the day column headers based on which day was indicated to be the first day of the week. */
	for (var k = firstDayIndex; k < 7; k++) {
		
		createInactiveDayCell(daysOfWeekValues[k], columns, {
			'class':'calendar_date_selector_days_head',
			'title':daysOfWeekKeys[k]
		});
		
	}
	/* any remaining days of the week. */
	for (var k = 0; k < firstDayIndex; k++) {
		
		createInactiveDayCell(daysOfWeekValues[k], columns, {
			'class':'calendar_date_selector_days_head',
			'title':daysOfWeekKeys[k]
		});
	
	}
	
	/*****
	Determine the first day
	*****/
	
	/* first day, month, year */
	firstDay = date.getDay(), month = date.getMonth(), year = date.getFullYear();

			
	/* if displaying the week number, create a table cell for it now. */
	if (this.displayWeekNumber) {
		var week = this.calculateWeekNumber({
			'date': date, 
			'firstDayOfWeek':firstDayIndex,
			'minDaysInFirstWeek':this.minDaysInFirstWeek, 
			'labelFirstWeekAsLastWeek': false
		});
		
		createInactiveDayCell(week, columns, {
			'class':'calendar_date_selector_wkcolumn'
		});
		
	}

	/* current day we are building */
	var day = 1;
	/* the last day of the month */
	var lastDay = getDaysOfMonth(this.date);
	/* indicate this is the last day */
	var reachedLastDay = false;
	
	/* determine which column in our table the first day of the month should start */
	if (firstDayIndex > 0) {
		firstDay += (7 - firstDayIndex);
		if (firstDay > 6) firstDay = firstDay - 7;
	}
	
	/*****
	Create First Week
	*****/
	
	/* Create leading empty cells until we get to the first day of the month */
	for (i=0; i<firstDay; i++) {
		
		createInactiveDayCell("non", columns, {
			'class':'empty'
		});
		
	}
	
	/* Create the rest of week one, starting with the first day of the month */
	for (j=firstDay; j<7; j++) {
		
		createDayCell(this.selectedDate, this.date, day, columns);
		day ++;

	}

	/****** 
	Create the second week and the rest of the weeks up to 6 total for this month. 
	******/
	for (k=2; k<7; k++) {		
		
		if (this.displayWeekNumber) {
			week = this.calculateWeekNumber({
				'year': year,
				'month': month,
				'day': day,
				'firstDayOfWeek':firstDayIndex,
				'minDaysInFirstWeek':this.minDaysInFirstWeek, 
				'labelFirstWeekAsLastWeek': false
			});
			
			createInactiveDayCell(week, columns, {
				'class':'calendar_date_selector_wkcolumn'
			});
		}
		
		/* create the date table cells for this week */
		for (j=0; j<7; j++) {
			
			createDayCell(this.selectedDate, this.date, day, columns);
			
			day ++;
			
			/* indicate this is the last day if true */
			if (day > lastDay) {
				reachedLastDay = true;
				break;
			}
		}	
		
		/* if last day, then exit loop*/
		if (reachedLastDay) break;
	}
}


/*
CALENDAR PROTOTYPE: createFooter (void)
---------------------------------
Create today's date link and display at bottom of Calendar.
*/
Calendar.prototype.createFooter = function(){
	
	/* clear table above */
	this.calendarClear = new Element('div', { 'class':'clear' })
		.inject(this.calendar);
	
	this.todayDisplay = new Element('div', { 'class':'calendar_date_selector_selecttoday' })
		.inject(this.calendar);
	
	
	var todayText = this.currentDateLabel
	var today = new Date()
	todayText += " " + this.formatDate(today, this.currentDateFormat);
	
	
	if (this.rulesTest(today)){
		
		this.todayDisplayLink = new Element('a', { 'href':'javascript:;' })
			.setText(todayText)
			.inject(this.todayDisplay)
			.addEvent('click', function(){ 
				this.selectedDate = today;
				this.updateYear(today);
				this.updateMonth(today);
				this.updateDateGrid(today);
				this.updateInputField(today, this.inputDateFormat, this.inputField)
			}.bind(this) );
				
	} else {
		
		this.todayDisplay
			.addClass('calendar_date_selector_selecttoday_nonselectable')
			.setText(todayText)
	}
}

		
/*
CALENDAR PROTOTYPE: createHeader (void)
---------------------------------
Create title text of Calendar and close button.
*/
Calendar.prototype.createHeader = function(){
	
	this.header = new Element('div', {'class':'calendar_date_selector_headerbar'})
		.inject(this.calendar)
		.setText(this.title);

	var closeLink = new Element('a', { 'href':'javascript:;'})
		.injectTop(this.header)
		.addEvent('click', function(){ this.calendarWrap.hideFx(function(){ this.open = false; }.bind(this)) }.bind(this))
		
	new Element('img', {
			'src': this.closeButton,
			'alt': this.closeAltText,
			'border':0,
			'class':'calendar_date_selector_bgclicktoclose'
		})
		.inject(closeLink)

}


/*
CALENDAR PROTOTYPE: createMonthControls (void)
---------------------------------
Create the Month grid.  Months will be display with abbreviated names in two rows. 
*/
Calendar.prototype.createMonthControls = function(date){
	
	/*
	PRIVATE FUNCTION: createMonthCell
	---------------------------------------------
	Adds a month button to the calendar.
	
	PARAMETERS:
	====================
		index: (Integer) - the month we are on by number, starting at 0.
		date: (Date) - Display date, so the current month can be highlighted.
	*/
	var createMonthCell = function(index, date){
		var month = new Element('div')
			.inject(this.monthTable)
			.setStyle('width',getColumnWidth(6));
			
		if (j == date.getMonth()) {
			month.addClass('calendar_date_selector_monthpicker_current')
		}
		
		var monthAbbr = $H(this.months).values()[j]
		var monthName = $H(this.months).keys()[j]
		var a = new Element('a', { 'href':'javascript:;', 'title':monthName })
			.setText(monthAbbr)
			.addEvent('click', function() { this.updateView({'setMonth':monthAbbr}) }.bind(this) )
			.inject(month);
		
	}.bind(this);
	
	/*
	PRIVATE FUNCTION: getColumnWidth (Integer)
	-------------------------------------
	Calculates the width of the columns.
	
	PARAMETERS: 
	===============
		columns (Integer) - the number of columns to appear.
		anchor (Boolean, optional) - Whether an anchor tag is inside.
	*/
	var getColumnWidth = function(columns) {
		var tableWidth = this.monthTable.scrollWidth
		tableWidth -= columns * 2 ;
		if (window.ie6) tableWidth = tableWidth/columns;
		else tableWidth = tableWidth/columns + 1;
		return tableWidth;
	}.bind(this);

	

	/* create months table */
	this.monthTable = new Element('div', { 'class': 'calendar_date_selector_monthpicker' })
		.injectAfter(this.yearSelector);
	
	for (var j = 0; j < 12; j++) { createMonthCell(j, $pick(date,this.date)) }
	
	new Element('div', {'class':'clear'}).inject(this.monthTable);
}


/* 
CALENDAR PROTOTYPE: createYearControls (void)
---------------------------------
Create the Year text and the buttons that allow the user to change the Year 
*/
Calendar.prototype.createYearControls = function(){
	
	this.yearSelector = new Element('div', { 'class':'calendar_date_selector_incrementyear' })
		.inject(this.calendar)
		.setHTML("<span>" + this.date.getFullYear() + "</span>");
	
	new Element('a', {'href':'javascript:;'})
		.setText('<')
		.injectTop(this.yearSelector)
		.addEvent('click', function(){ this.updateView({'addYear':'-1'}) }.bind(this) );

	new Element('a', {'href':'javascript:;'})
		.setText('>')
		.injectInside(this.yearSelector)
		.addEvent('click', function(){ this.updateView({'addYear':1}) }.bind(this) );
},


/*
CALENDAR PROTOTYPE: detectDateInputField (void)
---------------------------------
Detects the input field for this calendar and sets up event triggers. 
*/
Calendar.prototype.detectDateInputField = function(){
	var input = this.inputField;
	if (!input) return false;
	
	/* if field is disabled, indicate as such with a disabled icon. */
	if (input.disabled) {
		
		input.addClass('calendar_date_selector_field_disabled');
		new Element('img', {
			src:sImagesDirectoryPath + 'show-calendar-disabled.gif', border:0, alt:this.title
		}).injectAfter(input);
	
	/* if not disabled, show calendar icon and create link to calendar widget */
	} else {
		var img = new Element('img',{ src:sImagesDirectoryPath + "show-calendar.gif", border:0, alt:this.title })
		var a = new Element('a', { 'href':'javascript:;' })
		
		img.inject(a);
		a.injectAfter(input).addEvent('click', function(){ this.show() }.bind(this))
		
	}
}


/*   
CALENDAR PROTOTYPE: getOptions (Object)
---------------------------------
Detects and interprets all Calendar options from Options hidden field 
*/
Calendar.prototype.getOptions = function(){
	var optionsEl = this.inputField.form[this.inputField.name + 'Options'];
	if ($empty(optionsEl.value)) return {};
	
	return Json.evaluate(optionsEl.value);
}


/* 
CALENDAR PROTOTYPE: resizeCalendarWrap (void)
---------------------------------
Calendar wrapper defines the window the calendar appears in.  Make the iFrame easier to align to the calendar and handle visible state.  The Calendar wrapper must be exactly the same size as the calendar. 
*/
Calendar.prototype.resizeCalendarWrap = function() {
	
	
	this.calendarWrap.setStyles({ 
		width:this.calendar.scrollWidth + this.calendar.getStyle('borderLeftWidth').toInt() + this.calendar.getStyle('borderRightWidth').toInt() + 'px', 
		height:this.calendar.scrollHeight + this.calendar.getStyle('borderTopWidth').toInt() + this.calendar.getStyle('borderBottomWidth').toInt() + 'px',
		overflow:'hidden'
	});
	
}


/*
CALENDAR PROTOTYPE: rulesTest (Boolean)
---------------------------------
Runs the given date through the date rules filters and returns whether this date is valid or not.
*/
Calendar.prototype.rulesTest = function(date){
	return (
		(this.rulesSet != null && $type(this.rulesSet) == 'object' && 
			(
				(
					this.rulesSet.includes(date.getFullYear(), date.getMonth(), date.getDate() ) && 
					this.rulesSet.isSetForEnablingDates()
				) || (
					!this.rulesSet.includes(date.getFullYear(), date.getMonth(), date.getDate()) &&
					!this.rulesSet.isSetForEnablingDates()
				)
			)
		) || this.rulesSet == null)
}


/* 
CALENDAR PROTOTYPE: selectDateFromInput (void)
---------------------------------
The updating the input field will set the date if it is a valid date.  The Calendar display is updated now as well. 
*/
Calendar.prototype.selectDateFromInput = function(){
	var inputDate = this.getDateFromFormat(this.inputField.value);
	if (inputDate){
		this.date = inputDate.clone();
		if (inputDate.getYear() != this.selectedDate.getYear()) this.updateYear(inputDate);
		if (inputDate.getMonth() != this.selectedDate.getMonth()) this.updateMonth(inputDate);
		this.selectedDate = inputDate.clone();
		if (inputDate != this.date) this.updateDateGrid();
	}
}


/*  
CALENDAR PROTOTYPE: setIFrame (void)
---------------------------------
Create an iFrame an inject it into the Calendar wrapper. 
*/
Calendar.prototype.setIFrame = function(){
	
	if (!this.iFrame || !this.iFrame.parentNode) { 
			
		this.iFrame = new Element('iframe', {
			"src": sIframeShimUrl,
			"scrolling": "no",
			"frameborder": "0",
			'display': "none",
			'width':'500px',
			'height':'500px',
			'position':'absolute'
		}).inject(this.calendarWrap)
	
	}

}


/* 
CALENDAR PROTOTYPE: setProperties (void)
---------------------------------
Create local properties based on defaults, overriding where applicable. 
*/
Calendar.prototype.setProperties = function (options){
	for (prop in this.options) { this[prop] = $pick(options[prop], this.options[prop]) }
	this.selectedDate = new Date(this.year, this.month, this.day);
	
}


/* 
CALENDAR PROTOTYPE: show (void)
---------------------------------
Update the Calendar display, position the calendar in the correct screen location, and then bring it out of hiding. 
*/
Calendar.prototype.show = function(){
	this.selectDateFromInput()
	
	if (!this.userPosition) {
		this.windowSavedState = window.getCoordinates();
		this.calendarWrap.setPosition({ elAnchor:'top-left','relativeEl':this.inputField, 'relativeAnchor':'bottom-right' });
	}
	this.resizeCalendarWrap();
	this.calendarWrap.showFx( function(){ this.open = true; }.bind(this) );
}


/*
CALENDAR PROTOTYPE: updateDateGrid (void)
---------------------------------
Remove the Calendar date grid and rebuild it.
*/
Calendar.prototype.updateDateGrid = function() {
	if (this.daysTable) this.daysTable.parentNode.removeChild(this.daysTable);
	this.createDateGrid();
	
	if (window.ie6){ this.setIFrame() }
}


/*
CALENDAR PROTOTYPE: updateFooter (void)
---------------------------------
Refresh today's date link and display at bottom of Calendar if showCurrentDateLabel == true.
*/
Calendar.prototype.updateFooter = function(){
	if (this.todayDisplay) this.todayDisplay.parentNode.removeChild(this.todayDisplay);
	if (!this.showCurrentDateLabel) return true;
	
	this.createFooter();
	
	if (window.ie6){ this.setIFrame() }
}	


/*
CALENDAR PROTOTYPE: updateHeader (void)
---------------------------------
Update title text of Calendar.
*/
Calendar.prototype.updateHeader = function(){
	if (this.header) {
		this.header.setText(this.title)
	} else {
		this.createHeader();
	}
}


/*
CALENDAR PROTOTYPE: updateInputField (void)
--------------------------------------------------
Sets the Calendar's input field to display the selected date.
*/
Calendar.prototype.updateInputField = function(date, format, input) {

	this.inputField.value = this.formatDate(date, this.inputDateFormat)
	this.inputField.fireEvent('change')
	this.calendarWrap.hideFx(function(){ this.open = false; }.bind(this));
	
}


/*
CALENDAR PROTOTYPE: updateMonth (void)
---------------------------------
If the Month Grid exists, remove it.  Then create a new Month Grid. 
*/
Calendar.prototype.updateMonth = function(date) {
	if (this.monthTable) this.monthTable.parentNode.removeChild(this.monthTable);
	this.createMonthControls(date);
	
	if (window.ie6){ this.setIFrame() }
}


/*
CALENDAR PROTOTYPE: updateView (void)
---------------------------------
Called when incrementing/decrementing a Year, or selecting a Month from the Month Grid.  Updates the view without updating the selectedDate.
*/
Calendar.prototype.updateView = function(options){
	if (!options) return false;
	
	/* Add or subtract years */
	if (options.addYear && parseInt(options.addYear)){
		this.date.setYear(this.date.getFullYear()+parseInt(options.addYear))
	}
	
	/* months can be set with a number or text value, matching abbreviation or full month name against list of valid Month names (this.months). */
	if (options.setMonth){
		
		var month = getPropertyIndexByValue(options.setMonth, this.months)
		if (parseInt(month) != NaN) this.date.setMonth(month);
		else {
			if (month.length > 3){
				for (var i=0;i<12;i++){
					if ($H(this.months).keys()[i] == month) this.date.setMonth(i);
				}
			} else {
				for (var i=0;i<12;i++){
					if ($H(this.months).values()[i] == month) this.date.setMonth(i);
				}
			}
		}
	}
	
	/* redraw all calendar parts */
	this.updateYear();
	this.updateMonth();
	this.updateDateGrid();
	this.updateFooter();
	this.resizeCalendarWrap();
}


/*
CALENDAR PROTOTYPE: updateYear (void)
---------------------------------
Create the Year display and controls, or update the Year text if it already exists 
*/
Calendar.prototype.updateYear = function(date){
	if (!this.yearSelector) { this.createYearControls(); return }
	
	$E('span', this.yearSelector).setText($pick(date,this.date).getFullYear());

	if (window.ie6){ this.setIFrame() }
}


/************************
Calendar Utility Methods
************************


CALENDAR PROTOTYPE: calculateWeekNumber (Integer)
---------------------------------------------------------------------------

Calculate the week number of the week that includes the date passed. The 
week number is calcuated taking into account the first day of week specified 
(firstDayOfWeek) and the minimal days in first week of the year 
(minDaysInFirstWeek). The caller of this function may include an optional 
parameter called labelFirstWeekAsLastWeek which determines whether the
week number returned for a date in a week that belongs to the previous year 
is is 0 (zero) or to the actual week number of the previous year's last week. 

INPUTS (JSON format): 
===============
year: (int, optional) 4-digit year, defaults to 'date' if passed or this.date.getFullYear().
month: (int, optional) 2-digit month, defaults to 'date' if passed or this.date.getMonth(). Valid values for month:  0...11  (January to December).
day: (int, optional) 2-digit day of month, defaults to 'date' if passed, or this.date.getDate().
date: (Date, optional) Date object, defaults to 'year', 'month', 'day' values.
firstDayOfWeek: (int [0...6], optional) index values referring to Sunday to Saturday, defaults to this.firstDayOfWeek.
minDaysInFirstWeek: )int [1...7], optional) minimum number of days to appear in the first calendar week.  Defaults to this.minDaysInFirstWeek.
labelFirstWeekAsLastWeek: (boolean, optional) Label the first week of the year as the last week of last year rather than '0' (zero).  Defaults to false.

USAGE:
=================
calculateWeekNumber ({
	date: this.date,
	callAWeekBelongingToLastYearWeekNumber_0: true
})
*/
Calendar.prototype.calculateWeekNumber = function(options){
	
	
	var year = null, month = null, day = null;
	var date = $pick(options.date, null);
	var firstDayOfWeek = $pick(options.firstDayOfWeek, this.firstDayOfWeek);
	var minDaysInFirstWeek = $pick(options.minDaysInFirstWeek,this.minDaysInFirstWeek);
	var labelFirstWeekAsLastWeek = $pick(options.labelFirstWeekAsLastWeek, false);
	if (date) {
		year = date.getFullYear();
		month = date.getMonth();
		day = date.getDate();
	} else {
		year = $pick(options.year, this.date.getFullYear())
		month = $pick(options.month, this.date.getMonth())
		day = $pick(options.day, this.date.getDate())		
	}
	

	// Get day of week of the first day of the year
	var oJan1Date = new Date(year, 0, 1);
	var iJan1DayOfWeek = oJan1Date.getDay();         
	
	// Get number of days in calendar's first week (Jan 1st. week)
	// First get Jan 1st's relative day of the week given the first date of week
	var iJan1RelativeDayNumber = (iJan1DayOfWeek + 7 - firstDayOfWeek) % 7;   //  0 = Sun, 1 = Mon, etc.
	var iDaysInFirstWeekOfYear = 7 - iJan1RelativeDayNumber;
	
	// Set initial value in week number counter based on the number of days
	// in first week of the year
	var iWeekNumber = 0;;
	if (iDaysInFirstWeekOfYear >= minDaysInFirstWeek){ iWeekNumber = 1; }
	
	// Get the date of the first day of the week in the week that contains 
	// Jan 1st and set it in oFirstDayOfWeek.
	var iDaysToFirstDayOfWeek = 7 - iDaysInFirstWeekOfYear;
	var oFirstDayOfWeek = new Date(oJan1Date.setDate(oJan1Date.getDate() - iDaysToFirstDayOfWeek));
	
	// Date passed as argument
	var oDatePoint = new Date(year, month, day);    
	
	// Count weeks up to the date that was passed to this fucntion
	while(oFirstDayOfWeek <= oDatePoint){
		var oAuxDate = new Date(oFirstDayOfWeek);
		var oLastDayOfWeek = new Date(oAuxDate.setDate(oAuxDate.getDate() + 6));
		
		if(oFirstDayOfWeek <= oDatePoint && oLastDayOfWeek >= oDatePoint){
			if(iWeekNumber == 0){
				// Date passed is in the first calendar week of the year
				if(labelFirstWeekAsLastWeek){
					// Change week number in first calendar week to the previous
					// year's last week number
					iWeekNumber = this.calculateWeekNumber({
						'year': year -1,
						'month': 11,
						'day': 31,
						'firstDayOfWeek': firstDayOfWeek,
						'minDaysInFirstWeek': minDaysInFirstWeek,
						'labelFirstWeekAsLastWeek': true
					});
				}
			}
			break;
		}
		oFirstDayOfWeek.setDate(oFirstDayOfWeek.getDate() + 7);
		iWeekNumber++;
		
	}
	
	// Adjust week number counter in the case the date passed occurs in the last 
	// week of year that belongs to next year
	if(month == 11){
		// Get day of week of the first day in December
		var oDec31Date = new Date(year, 11, 31);
		var iDec31DayOfWeek = oDec31Date.getDay();         
	
		// Get number of days in the last week of December.
		// First get Dec. 31st's relative day of the week given the first date of week
		iDaysToFirstDayOfWeek = 
			(iDec31DayOfWeek + 7 - firstDayOfWeek) % 7;  // 0=Sun, 1=Mon, etc.
  
		var oFirstDayInLastWeekOfYear = 
		   new Date(oDec31Date.setDate(oDec31Date.getDate() - iDaysToFirstDayOfWeek));
		var iDaysInLastWeekOfYear = iDaysToFirstDayOfWeek + 1;
		
		// Is the date passed as argument occurs in the last week of the year?
		if(oFirstDayInLastWeekOfYear <= oDatePoint){    
			// Does last week in the year belong to next year?
			if(( 7 - iDaysInLastWeekOfYear) >= minDaysInFirstWeek){
				// Set week number to 1 (week belongs to next year)
				iWeekNumber = 1;
			}
		}
	}
	return iWeekNumber;
}

/*
CALENDAR PROTOTYPE: isDate (Boolean)
--------------------------------------------------------------------------------

This method returns true If date_string is formatted with the format specified 
in format_string. Otherwise returns false. 
It is recommended to trim whitespace around the value before passing it to this 
function, as whitespace is NOT ignored!
*/
Calendar.prototype.isDate = function(date_string) {
	return (this.getDateFromFormat(date_string,this.inputDateFormat) == 0) ? false : true;
}

/*
CALENDAR PROTOTYPE: getDateFromFormat (Date)
--------------------------------------------------------------------------------
  
This function is a date parser. If the date in date_string is formatted with the
format specified in format_string, this function returns the time in 
milliseconds (getTime()) that represents the date passed. If date_string does 
not adhere to the format specified in format_string, this function returns 0.

The following table shows if a given date can be parsed by getDateFromFormat. 
For simplicity, the first column contains only the corresponding value in 
date_string for the pattern letter(s) in the format of the second column.

  Corresponding                 Pattern letter(s)         Can it be sucessfully
value in date_string            in format_string                parsed?    
       1                                d                        yes   
       1                               dd                        yes   
      01                                d                        yes   
      01                               dd                        yes   
      15                                d                        yes     
      15                               dd                        yes   
      15                                E                         NO
      15                               EE                         NO
      15                              EEE                         NO
      15                             EEEE                         NO
      15                            EEEEE                         NO
     Fri*                               E                        yes 
     Fri                               EE                        yes
     Fri                              EEE                        yes
     Fri                             EEEE                         NO
     Fri                            EEEEE                         NO  
  Friday*                               E                         NO
  Friday                               EE                         NO
  Friday                              EEE                         NO
  Friday                             EEEE                        yes
  Friday                            EEEEE                        yes
      
       1                                M                        yes
       1                               MM                        yes
       1                              MMM                         NO
       1                             MMMM                         NO
      01                                M                        yes
      01                               MM                        yes
      01                              MMM                         NO
      01                             MMMM                         NO
     dec*                               M                         NO
     dec                               MM                         NO
     dec                              MMM                        yes
     dec                             MMMM                         NO
December*                               M                         NO
December                               MM                         NO
December                              MMM                         NO
December                             MMMM                        yes

    2006                                y                        yes
    2006                               yy                         NO
    2006                              yyy                         NO
    2006                             yyyy                        yes
      06                                y                        yes
      06                               yy                        yes
      06                              yyy                         NO
      06                             yyyy                         NO

* Values are provided for illustration purposes only. Other abbreviated or full 
  weekday/month names result in the same parsing behavior.

INPUTS:
==================
date_string (String) - The human-readable date string
format_string (String) - The format pattern derived from the chart above.
*/
Calendar.prototype.getDateFromFormat = function(date_string, format) {
	date_string=date_string+"";
	format_string = $pick(format,this.inputDateFormat);
	var dateIndex=0, formatIndex=0, c="", token="", token2="", x, y, ampm="";
	var now=new Date();
	var year=now.getYear();
	var month=now.getMonth()+1;
	var date=1;
	var hh=now.getHours();
	var mm=now.getMinutes();
	var ss=now.getSeconds();
	var monthsAbbr = $H(this.months).values();
	var months = $H(this.months).keys();
	var daysAbbr = $H(this.days).values();
	var days = $H(this.days).keys();
	var _getInt = function(str,i,minlength,maxlength) {
		var _isInteger = function(val) { return /^[0-9]+$/.test(val) }
		for (var x=maxlength; x>=minlength; x--) {
			var token=str.substring(i,i+x);
			if (token.length < minlength) { return null; }
			if (_isInteger(token)) { return token; }
			}
		return null;
		}
		
		
	while (formatIndex < format_string.length) {
		// Get next token from format_string 
		c=format_string.charAt(formatIndex);

        // Escaped text (in single quotes)
		if(c == "'") {
		   formatIndex++; 

		   /* Double quotes found? Then increment formatIndex to go on to 
		    the next character and increment dateIndex as every double 
		    quotes is a single quote in date_string.*/
		   if(format_string.charAt(formatIndex) == "'"){
		       formatIndex++;
		       dateIndex++;     
		       continue;
		   }
	
		   /* Increment (go on in parsing process)formatIndex in case of 
		    escaped text as such text does not need to be interpreted in any 
		    way. Count the characters in the escaped text to increment 
		    dateIndex so that the parsing pointer in the format_string 
		    (formatIndex) and in date_string (dateIndex) point to the 
		    same piece of information */
           charsInEscapedText = 0;
           for(;format_string.charAt(formatIndex) != "'" && (formatIndex < format_string.length);
                formatIndex++, charsInEscapedText++);
           formatIndex++;
           dateIndex += charsInEscapedText;
		   continue; 
		}
		
		token=""
		/* match consecutive characters of the same value (MM,DD,YYYY, etc)*/
		while ((format_string.charAt(formatIndex)==c) && (formatIndex < format_string.length)) {
			token += format_string.charAt(formatIndex++);
			}
		
		
		// Extract contents of value based on format token
		
		if (/^[y]{1,5}$/.test(token)) {
			if (/^[y]{3,5}$/.test(token)) { x=4; y=4; }
			else if (token == "yy") { x=2; y=2; }
			else if (token == "y") { x=2; y=4; }
			year=_getInt(date_string,dateIndex,x,y);
			if (year==null) { return 0; }
			dateIndex += year.length;
			if (year.length==2) {
				if (year > 70) { year=1900+(year-0); }
				else { year=2000+(year-0); }
			}
		}
			
		else if (token=="MMM"){	
			month=0;
			for (var i=0; i<monthsAbbr.length; i++) {
				var month_name=monthsAbbr[i];
				if (date_string.substring(dateIndex,dateIndex+month_name.length).toLowerCase()==month_name.toLowerCase()) {
					month=i+1;
					dateIndex += month_name.length;
					break;
				}
			}
			if ((month < 1)||(month>12)){return 0;}
		}
		
		else if (token=="MMMM" || token == "MMMMM"){	
			month=0;
			for (var i=0; i<months.length; i++) {
				var month_name=months[i];
				if (date_string.substring(dateIndex,dateIndex+month_name.length).toLowerCase()==month_name.toLowerCase()) {
					month=i+1;
					dateIndex += month_name.length;
					break;
				}
			}
			if ((month < 1)||(month>12)){return 0;}
		}
		
		else if (token=="E" | token=="EE" | token=="EEE"){
			for (var i=0; i< daysAbbr.length; i++) {
				var day_name=daysAbbr[i];
				if (date_string.substring(dateIndex,dateIndex+day_name.length).toLowerCase()==day_name.toLowerCase()) {
				dateIndex += day_name.length;
				break;
				}
			}
		}
		
		else if (token=="EEEE" | token=="EEEEE"){
			for (var i=0; i<days.length; i++) {
				var day_name=days[i];
				if (date_string.substring(dateIndex,dateIndex+day_name.length).toLowerCase()==day_name.toLowerCase()) {
				dateIndex += day_name.length;
				break;
				}
			}
		}
		
		else if (token=="MM"||token=="M") {
			month=_getInt(date_string,dateIndex,1,2);
			if(month==null||(month<1)||(month>12)){return 0;}
			dateIndex+=month.length;
		}
		
		else if (token=="dd"||token=="d") {
            date=_getInt(date_string,dateIndex,1,2);
			if(date==null||(date<1)||(date>31)){return 0;}
			dateIndex+=date.length;
		}
		
		else if (token=="hh"||token=="h") {
			hh=_getInt(date_string,dateIndex,token.length,2);
			if(hh==null||(hh<1)||(hh>12)){return 0;}
			dateIndex+=hh.length;
		}
		
		else if (token=="HH"||token=="H") {
			hh=_getInt(date_string,dateIndex,token.length,2);
			if(hh==null||(hh<0)||(hh>23)){return 0;}
			dateIndex+=hh.length;
		}
		
		else if (token=="KK"||token=="K") {
			hh=_getInt(date_string,dateIndex,token.length,2);
			if(hh==null||(hh<0)||(hh>11)){return 0;}
			dateIndex+=hh.length;
		}
		
		else if (token=="kk"||token=="k") {
			hh=_getInt(date_string,dateIndex,token.length,2);
			if(hh==null||(hh<1)||(hh>24)){return 0;}
			dateIndex+=hh.length;hh--;
		}
		
		else if (token=="mm"||token=="m") {
			mm=_getInt(date_string,dateIndex,token.length,2);
			if(mm==null||(mm<0)||(mm>59)){return 0;}
			dateIndex+=mm.length;
		}
		
		else if (token=="ss"||token=="s") {
			ss=_getInt(date_string,dateIndex,token.length,2);
			if(ss==null||(ss<0)||(ss>59)){return 0;}
			dateIndex+=ss.length;
		}
		
		else if (token=="a") {
			if (date_string.substring(dateIndex,dateIndex+2).toLowerCase()=="am") {ampm="AM";}
			else if (date_string.substring(dateIndex,dateIndex+2).toLowerCase()=="pm") {ampm="PM";}
			else {return 0;}
			dateIndex+=2;
		}
		
		else {
			if (date_string.substring(dateIndex,dateIndex+token.length)!=token) {return 0;}
			else {dateIndex+=token.length;}
		}
	} // while loop

	// If there are any trailing characters left in date_string, it doesn't match
	if (dateIndex != date_string.length) { return 0; }
	// Is date valid for month?
	if (month==2) {
		// Check for leap year
		if ( ( (year%4==0)&&(year%100 != 0) ) || (year%400==0) ) { // leap year
			if (date > 29){ return 0; }
			}
		else { if (date > 28) { return 0; } }
		}
	if ((month==4)||(month==6)||(month==9)||(month==11)) {
		if (date > 30) { return 0; }
		}
	// Correct hours value
	if (hh<12 && ampm=="PM") { hh=hh-0+12; }
	else if (hh>11 && ampm=="AM") { hh-=12; }
	return new Date(year,month-1,date,hh,mm,ss);
	}





/*
CALENDAR PROTOTYPE: formatDate (String)
--------------------------------------------------------------------------------

This function returns the string representation of the date passed in 
date_object using the format in format_string.

The following table shows the output generated by the function formatDate given
the format shown on the first column and two sample dates. For simplicity, 
individual pattern letters are provided. An actual date format pattern includes 
one or more pattern letters for the weekday, date, month, and year of the date.


                    Sample dates (provided in date_object parameter)
            Wednesday  November 1st, 2006       Tuesday January 10th, 2006
     Format
         d                  1                              10
        dd                 01                              10
         E                Wed                             Tue
        EE                Wed                             Tue
       EEE                Wed                             Tue
      EEEE          Wednesday                         Tuesday
        
         M                 11                               1 
        MM                 11                              01
       MMM                Nov*                            Jan*
      MMMM           November**                       January**
         y                 06                              06
        yy                 06                              06
       yyy                 06                              06
      yyyy               2006                            2006


* MMM generates the abbreviated name of the month regardless of the length of 
  the resulting abbreviated month (abbreviated month names in other languages 
  may not be 3 characters long).
  
** MMMM generates the name of the month regardless of the length of the actual
   name of the month.
   
INPUT PARAMETERS:
=====================
date_object (Date) - The date to format
format_string (String) - The format pattern to use.
*/
Calendar.prototype.formatDate = function(date_object, format_string) {
	format_string=format_string+"";
	var result="";
	var formatIndex=0;
	var c="";
	var token="";
	var y=date_object.getYear()+"";
	var M=date_object.getMonth()+1;
	var d=date_object.getDate();
	var E=date_object.getDay();
	var H=date_object.getHours();
	var m=date_object.getMinutes();
	var s=date_object.getSeconds();
	var yyyy,yy,MMM,MM,dd,hh,h,mm,ss,ampm,HH,H,KK,K,kk,k;
	// Convert real date parts into formatted versions
	var value=new Object();
	var monthsAbbr = $H(this.months).values();
	var months = $H(this.months).keys();
	var daysAbbr = $H(this.days).values();
	var days = $H(this.days).keys();
	var LZ = function(num) { return new String(num).addLeadingZeros(2) }


	if (y.length < 4) {y=""+(y-0+1900);}   
    if(y.length == 4){
        yy = y.substring(2,4);
    }
	value["y"]=yy
    value["yy"]=yy;
    value["yyy"]=yy;
	value["yyyy"]=y;
	value["yyyyy"]=y;
	value["M"]=M;
	value["MM"]=LZ(M);
	value["MMM"]= monthsAbbr[M-1];
	value["MMMM"]= months[M-1];       
	value["MMMMM"]= months[M-1];      
	value["d"]=d;
	value["dd"]=LZ(d);
	value["E"]= daysAbbr[E];
	value["EE"]= daysAbbr[E];
    value["EEE"]= daysAbbr[E];
   	value["EEEE"]= days[E];
	value["EEEEE"]= days[E];   	
	value["H"]=H;
	value["HH"]=LZ(H);
	if (H==0){value["h"]=12;}
	else if (H>12){value["h"]=H-12;}
	else {value["h"]=H;}
	value["hh"]=LZ(value["h"]);
	if (H>11){value["K"]=H-12;} else {value["K"]=H;}
	value["k"]=H+1;
	value["KK"]=LZ(value["K"]);
	value["kk"]=LZ(value["k"]);
	if (H > 11) { value["a"]="PM"; }
	else { value["a"]="AM"; }
	value["m"]=m;
	value["mm"]=LZ(m);
	value["s"]=s;
	value["ss"]=LZ(s);
	
	/**
	  A single quote in format_string indicates that the text ahead of the 
	  quotes should be escaped until the next quote is found. That is, text in
	  between single quotes becomes part of the formated date string returned 
	  by this function.
	  
	  Two consecutive quotes result in a single quote being included in the 
	  formated date string returned.
	  
	  In the code below we identify if the characer read is a quote. If so, in 
	  the inner while loop we store all the characters in the variable 
	  escapedText until we find another quote. We then append the contents of
	  escapedText to result which is the final formated string returned.
	  
	  If two consecutive quotes are found, we add a single quote to the variable
	  result.
	  
	  In both cases, we update pointer formatIndex so that it refers to the
	  correct index of the next character to read from format_string.
	*/
	var escapedText="";
	while (formatIndex < format_string.length) {
		c=format_string.charAt(formatIndex);
		if(c == "'") {
		   formatIndex++; 
		   // Two quotes found? Then add a single quote 
		   if(format_string.charAt(formatIndex) == "'"){
		       result += "'";     
		       formatIndex++;
		       continue;
		   }
		   // Text in single quotation marks is passed as is in string returned
           escapedText="";
		   while( format_string.charAt(formatIndex) != "'" && (formatIndex < format_string.length)){
		       escapedText += format_string.charAt(formatIndex++);
		   }
		   result += escapedText;
           formatIndex++;
		   continue; 
		}
		
		token="";
		while ((format_string.charAt(formatIndex)==c) && (formatIndex < format_string.length)) {
			token += format_string.charAt(formatIndex++);
			}
		if (value[token] != null) { result=result + value[token]; }
		else { result=result + token; }
		}
	return result;
	}





/* 
DATE PROTOTYPE: clone (Date)
-------------------------------
returns a copy of itself to prevent variables based on the same date from becoming merely references to each other.
*/
Date.prototype.clone = function(){ return new Date(this) };

/*
STRING PROTOTYPE: addLeadingZeros (String)
--------------------------------------
returns the current string padded with zeros to match the given total length.
*/
String.prototype.addLeadingZeros = function(len) {
	if (!len) return this;
	var tmp = this;
	while (tmp.length < len) { tmp = '0' + tmp }; 
	if (tmp.length > len) tmp = tmp.substring(len-tmp.length,len-1)
	return tmp;
}





/* 
CLASS: DaysInWeekRule
-------------------------------------------------------
   Defines a rule involving dates in a calendar. A given date (see includes 
   method) is said to meet the DaysInWeekRule if that date occurs during one of 
   days of the week specified in the member variable days.
   
Constructor parameter. 
    sDays -
       The String of 0-based comma-separated days of the week used in the 
       evaluation of this rule. Examples of week days passed as arguments:
       
       String passed                    Meaning
       "0"                              Sunday
       "0,1"                            Sunday and Monday
       "6"                              Saturday
       "0,1,2,3,4,5,6"                  Whole set of days of the week Sun - Sat
*/
var DaysInWeekRule = new Class({
	initialize: function(sDays){
		this.days = sDays;
	},
	
	/* Method includes(iYear, iMonth, iDay)
	
	   Returns true if the date represented by the values passed as arguments occurs 
	   during one of the days of the week specified in member variable days. 
	   Otherwise this method returs false.
	*/
	includes: function(iYear, iMonth, iDay){
		// Create a Date object from argument passed
		var oDate = new Date(iYear, iMonth, iDay);
		
		/* parse the days and place it in an array */
		var aDays = this.days.split(",");
		
		/* If we find that the day in oDate is one of the days in array aDays, then
		 return true */
		for(var i=0,day;day=aDays[i];i++){
		   if(oDate.getDay() == day) return true;
		}
		
		return false
	}
})

/* 
CLASS: DateRangeRule. 
--------------------------------------------------------
   Defines a rule involving a date range. A given date (see includes 
   method) is said to meet the DateRangeRule if that date occurs during the date
   range -including the lower and upper limit- defined by the arguments provided
   to the constructor.
   This class supports the use of open date range limits by specifiying the 
   string "*" instead of the three integer arguments which otherwise would define
   a closed date range limit. Open date range limits are used to specify such
   date ranges as the following:
   
      ["*", 2008, 05, 01]  All dates occurring before and on May 1, 2008 
      
      [2008, 05, 01, "*"]  All future dates starting with May 1, 2008 
      
   
   Please refer to second and third constructors supported (below) for more 
   information.
   
   
   Ways to instantiate this class (Constructors):
   
   1. DateRangeRule(startYear, startMonth, startDay, endYear, endMonth, endDay)
      
      This constructor defines a date range of all dates starting on the date
      provided in the first three arguments (startYear, startMonth, and startDay) 
      and ending on the date specified in the next three arguments (endYear, 
      endMonth, and endDay).
      
      
   2. DateRangeRule("*", endYear, endMonth, endDay)
      
      A DateRangeRule is defined with an open lower date range limit and a 
      closed upper date range limit. The date range defined by this constructor 
      includes all dates ocurring before and on the date provided in the last 
      three arguments (endYear, endMonth, and endDay). 
      
       
   3. DateRangeRule(startYear, startMonth, startDay, "*")

      A DateRangeRule is defined with a closed lower date range limit and an 
      open upper date range limit. The date range defined by this constructor 
      includes all dates starting on the date provided in the first three 
      arguments (startYear, startMonth, and startDay). 
      
   *IMPORTANT:*  Month values (startMonth, endMonth) are calendar-based. Hence, 
                 valid values for months include 1,2,3,4,5,6,7,8,9,10,11, and 12
*/
var DateRangeRule = new Class({
   /* Properties of this class:
       this.startDate and
       this.endDate
   */
	initialize: function(vArg1, iArg2, iArg3, vArg4, iArg5, iArg6){
		if(arguments.length == 6){                       
			// First three arguments form the lower limit date range. 
			this.startDate = new Date(vArg1, iArg2-1, iArg3);
			
			// Last three arguments form the upper limit date range. 
			this.endDate = new Date(vArg4, iArg5-1, iArg6);
		
		} else {
			/* User should have provided an open limit date:
				 *, endYear, endMonth, endDay    or
				 startYear, startMonth, startDay, *
			*/
			
			if(vArg1 == "*") {
				// Open lower date range limit
				this.startDate = vArg1;
				
				// Next three arguments form the upper limit date range. 
				this.endDate = new Date(iArg2, iArg3-1, vArg4);
			} else if (vArg4 == "*") {
				// First three arguments form the lower limit date range. 
				this.startDate = new Date(vArg1, iArg2-1, iArg3);
			
				// Open upper date range limit
				this.endDate = vArg4;
			}
		}
	},
	
	/* Method includes(iYear, iMonth, iDay)

	   Returns true if the date represented by the values passed as arguments occurs 
	   during the date range -including the lower and upper limits- defined by 
	   member variables startDate and endDate. Otherwise this method returns false.
	*/
	includes: function(iYear, iMonth, iDay){
		// Create a Date object from argument passed
		var oDate = new Date(iYear, iMonth, iDay);
		// Compare dates
		
		var bResult;
		
		if (this.startDate == "*") {
		   // Open lower date range limit [infinite - endDate]
		   // Is date provided less than or equal to upper date range limit?
		   bResult = (oDate <= this.endDate);
		} else if (this.endDate == "*") {
		   // Open upper date range limit [startDate - infinite]
		   // Is date provided greater than or equal to lower date range limit?
		   bResult = (oDate >= this.startDate);
		} else {
		   // Using closed date range limits [startDate - endDate]
		   bResult = (this.startDate <= oDate && this.endDate >= oDate);    
		}
		
		return bResult;
	},
	
	/**
   Method toString()
   
	   Returns the string representation of the date range defined by the 
	   DateRangeRule class. 
	*/
	toString: function(){
		// We are not using Date.toString() method as it is verbose.
		var sToStr;
		if (this.startDate == "*") {
		   sToStr = "[* - " + this.endDate.getMonth() + "/" + this.endDate.getDate() 
				   + "/" + this.endDate.getYear() + "]\n";         
		
		} else if (this.endDate == "*") {
		   sToStr =  "[" + this.startDate.getMonth() + "/" + this.startDate.getDate() 
					+ "/" + this.startDate.getYear() + " - *]\n";         
		} else {
		   sToStr = "[" + this.startDate.getMonth() + "/" + this.startDate.getDate() 
				   + "/" + this.startDate.getYear() + " - [" + 
				   this.endDate.getMonth() + "/" + this.endDate.getDate() + "/" + 
				   this.endDate.getYear() + "]\n";         
		}
		
		return sToStr;
	}

});







/* 
CLASS: RuleSetBase. 
--------------------------------------------------------
BASE CLASS for rules.  Common functionality to handle a set of rule objects.
*/
var RulesSetBase = new Class({
	initialize: function(){
		// Collection of rule objects
		this.rules = new Array();
	},

	/** 
	   Method addRule(oRule)
	   
	   Adds the object passed as an argument to the set of rules contained by this
	   object.
	*/
	addRule: function(oRule){
		this.rules = this.rules.concat(oRule);
	},
	
	
	/** 
	   Method removeRule(oRule)
	   
	   Removes the object passed as an argument from the set of rules contained by 
	   this object.
	*/
	removeRule: function(oRule){
	   for (var i=0,rule;rule=this.rules[i];i++){
		   if(oRule == rule){
			  // Remove rule starting at index i from array of rules
			  this.rules.splice(i, 1);
		   }
	   }
	}
});


/*
CLASS: Union. 
-------------------------------------------------------
   Class used to define a set of rules which participate in a union operation. 
   The result of constructing a Union object is a union rule that defines a set 
   that encompasses all the dates defined by all rules in the Union object. 
   Please refer to method includes below for more information.
   
   Extends RulesSetBase.
*/
var Union = RulesSetBase.extend({

	/**
	   Method includes refers to actual function (method) that provides the 
	   intended functionality
	*/
	includes:satisfiesAnyRule
});



/* 
CLASS: Intersection. 
-------------------------------------------------------
   Class used to define a set of rules which participate in an intersection 
   operation. The result of constructing an Intersection object is an 
   Intersection rule that defines a set of dates which are members of all the 
   date sets (rule sets) in the Intersection object.
   Please refer to method includes below for more information. 
   
   Extends RulesSetBase.
*/
var Intersection = RulesSetBase.extend({

/**
   Method includes(iYear, iMonth, iDay)
   
   Core method for classes that contain rules that participate in an 
   Intersection operation. 

   
   Returns true if the date provided as an argument meets *all* the rules 
   contained in this object's rules arrray. Otherwise, this method returns false.
*/
	includes: function(iYear, iMonth, iDay){
		var bResult = true;
		
		for (var i in this.rules){
			var oRule = this.rules[i];
			if(! oRule.includes(iYear, iMonth, iDay)){
				bResult = false;
				break;
			}
		}
		
		return bResult;
	}
});


/*
CLASS: Difference. 
-----------------------------------------------------------
   Class used to define a two rules that participate in a difference set 
   operation. The result of constructing an Intersection object is an 
   intersection rule that defines a set of dates which includes the dates 
   defined by the rule in oMinuendRule minus the dates defined by the 
   rule in oSubtrahenbRule.
   Please refer to method includes below for more information.
   
   Constructor parameters:
    oMinuendRule -
       Rule object that defines the dates set from which some dates are 
       substracted.
       
    oSubtrahendRule -
       Rule object that defines the dates that are substracted from dates set
       defined by oMinuendRule (member variable rule1).
   
*/
var Difference = new Class({
	initialize: function(oMinuendRule, oSubtrahendRule){
    	this.rule1 = oMinuendRule;
    	this.rule2 = oSubtrahendRule;
	},
	
	/**
	   Method includes(iYear, iMonth, iDay)
	   
	   Returns true if the date passed as an argument is included in the dates set 
	   defined by the rule1 member variable and it is *not* included in the dates
	   set defined by the rule2 member variable.
	*/
	includes: function(iYear, iMonth, iDay){
		var bResult = (this.rule1.includes(iYear, iMonth, iDay) && 
					  !this.rule2.includes(iYear, iMonth, iDay));
		return bResult;
	}
});


/*
FUNCTION: satisfiesAnyRule (Boolean)
--------------------------------------------------------
   Core method for classes that contain rules that participate in a union 
   operation.  Returns true if the date provided as an argument meets any of the rules 
   contained in this object's rules array. This method returns false if no
   rule in this object's rules array is satisfied with the date supplied. 

PARAMETERS:
	iYear (Integer) - Year
	iMonth (Integer) - Month
	iDay (Integer) - Day
*/
function satisfiesAnyRule(iYear, iMonth, iDay){

	for (var i=0,rule;rule=this.rules[i];i++){
		if(rule.includes(iYear, iMonth, iDay))return true;
	}

    return false;
}


/* 
CLASS: CalendarRules
--------------------------------------------------------
   Contains all the rules that are used to determine if a date 
   (provided to the includes method) is enabled or disabled for selection using
   a calendar date selector (JavaScript) component.
   
   Extended from RulesSetBase.
*/
var CalendarRules = RulesSetBase.extend({	
	/**
	   Method includes refers to actual function (method) that provides the 
	   intended functionality
	*/
	'includes': satisfiesAnyRule,
	
	/* Boolean property that indicates if the the rules in this object are for
    enabling or for disabling dates. */
	'forEnablingDates': false,
	
	/**
	   Method setForEnablingDates(bForEnablingDates)
	   
	   Sets member variable forEnablingDates to the boolean value passed as an 
	   argument. 
	*/
	'setForEnablingDates': function(bForEnablingDates){ this.forEnablingDates = bForEnablingDates; },

	/**
	   Method isSetForEnablingDates()
	   
	   Returns the boolean value stored in member variable forEnablingDates. More
	   precisely, this method returns true if the rules contained by an instance of 
	   this class are used for enabling dates. This method returns false if the 
	   rules contained by an instance of this class are used for disabling dates.
	*/
	'isSetForEnablingDates': function(){ return this.forEnablingDates; }
});
