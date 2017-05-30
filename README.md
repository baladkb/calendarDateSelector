# calendarDateSelector
Select particular Dates(From date and To date) using JavaScript.

CalendarDateSelector is a particular date selector listed below for From and To date  

- Today
- Yesterday
- Last Week
- Last Month
- Last 7 Days
- Last 30 Days

## Version 1.0.0

##Steps 

**First** : Include [siv.js](https://github.com/baladkb/calendarDateSelector/blob/master/siv.js) in HTML file 
```javascript
<script type="text/javascript" src="siv.js"></script>
```
**Second** : Include below code in HTML file
```HTML
<select  onchange="javascript:DateSelector.selectFromToDates();" id="selectDatesId">
			<option value="Select">Date Select</option>
			<option value="0">Today</option>
			<option value="1">Yesterday</option>
			<option value="2">Last Week</option>
			<option value="3">Last Month</option>
			<option value="4">Last 7 Days</option>
			<option value="5">Last 30 Days</option>
		</select>
```
```HTML
From Date : <input type="text" name="" id="calendar_date_selector_field_instance0" 
		size="11" value="" readonly="readonly" >
To Date   : <input type="text" name="" id="calendar_date_selector_field_instance1" 
		size="11" value="" readonly="readonly">
```
## Demo
Demo on [JSFiddle](https://jsfiddle.net/baladkb/tj8w2102/)
