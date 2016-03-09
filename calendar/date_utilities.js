// =============================================================================
// Original Author: Matt Kruse <matt@mattkruse.com>
// WWW: http://www.mattkruse.com/
//
// NOTICE: You may use this code for any purpose, commercial or
// private, without any further permission from the author. You may
// remove this notice from your final code if you wish, however it is
// appreciated by the author if at least my web site address is kept.
//
// You may *NOT* re-distribute this code in any way except through its
// use. That means, you can include it in your product, or your web
// site, or any other form where the code is actually being used. You
// may not put the plain javascript up on your site for download or
// include it in your javascript libraries for download. 
// If you wish to share this code with others, please just point them
// to the URL instead.
// Please DO NOT link directly to my .js files from your site. Copy
// the files to your server and use them there. Thank you.
// =============================================================================

// HISTORY
// -----------------------------------------------------------------------------
// Sep. 19, 2006: Javier Fernández (Ford Motor Co.) made changes to functions 
//                formatDate and getDateFromFormat so that format and parsing
//                functionality is similar to that of Java's  SimpleDateFormat 
//                for date formats that contain pattern symbols 'E', 'd', 'M', 
//                and 'y'. As a consequence, support for NNN format pattern has 
//                been removed. 
//                eTracker # 3913409.
//
// May 17, 2003: Fixed bug in parseDate() for dates <1970
// March 11, 2003: Added parseDate() function
// March 11, 2003: Added "NNN" formatting option. Doesn't match up
//                 perfectly with SimpleDateFormat formats, but 
//                 backwards-compatability was required.

/**
-----------------------------------------------------------------------------
 The main utilities provided in this file are formatDate and getDateFromFormat.
 These functions use the following pattern symbols. The functionality obtained
 from formatDate and getDateFromFormat is similar to what 
 java.text.SimpleDateFormat's format and parse methods offer.
 
   Field        |             Pattern symbols    
   -------------+--------------------------------------------------------
   Year         | yyyy (4 digits)     yy (2 digits), y (2 or 4 digits)
   Month        | MMMM (full name)    MMM (abbreviated)   MM (2 digits) 
                | M (1 or 2 digits)
   Day of Month | dd (2 digits)       d (1 or 2 digits)
   Day of Week  | EEEE (full weekday)     EEE (abbreviated weekday)  
                | EE (abbreviated weekday)  E (abbreviated weekday) 
   Hour (1-12)  | hh (2 digits)       h (1 or 2 digits)
   Hour (0-23)  | HH (2 digits)       H (1 or 2 digits)
   Hour (0-11)  | KK (2 digits)       K (1 or 2 digits)
   Hour (1-24)  | kk (2 digits)       k (1 or 2 digits)
   Minute       | mm (2 digits)       m (1 or 2 digits)
   Second       | ss (2 digits)       s (1 or 2 digits)
   AM/PM        | a                  
   
   Additionally, in the format string you can use the following symbols:
   
   Symbol       |     Meaning
   -------------+--------------------------
   '            |     escape for text
   ''           |     single quote
   
 
   PLEASE NOTE THE DIFFERENCE BETWEEN MM and mm:
        Month=MM or M, not mm or m (minutes).
--------------------------------------------------------------------------------
*/


/*   
The following arrays are used by functions formatDate and getDateFromFormat.
If you are directly calling these functions, you need to uncomment these array
definitions. You also may want to change the values in these arrays to reflect 
the language your application requires.
     
Please note that if you are using the Calendar Date Selector provided with the 
Presentation framework, these arrays need to be commented out becuase the 
Calendar Date Selector automatically defines these arrays with values in the 
appropriate language.

var aCalendar_MonthsAbrv = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
var aCalendar_Months = ["January", "February", "March", "April", "May", "June", "July", "August", "September", "October", "November", "December"];
var aCalendar_DaysOfWeekAbrv = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];
var aCalendar_DaysOfWeek = ["Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"];

*/

/*
--------------------------------------------------------------------------------
LZ(number)

This function adds a leading zero to number if number is a single digit number
--------------------------------------------------------------------------------
*/
function LZ(number) {return(number<0||number>9?"":"0")+number}


/*
--------------------------------------------------------------------------------
isDate (date_string, format_string)

This function returns true If date_string is formatted with the format specified 
in format_string. Otherwise returns false. 
It is recommended to trim whitespace around the value before passing it to this 
function, as whitespace is NOT ignored!
--------------------------------------------------------------------------------
*/
function isDate(date_string,format_string) {
	var date=getDateFromFormat(date_string,format_string);
	if (date==0) { return false; }
	return true;
}

/*
--------------------------------------------------------------------------------
compareDates(date1,date1format,date2,date2format)
  
This function compares two date strings and returns:
  
  1 if date1 is greater than date2
  0 if date2 is greater than date1 or if the dates passed are the same date
 -1 if either of the dates is in an invalid format
--------------------------------------------------------------------------------
*/
function compareDates(date1,dateformat1,date2,dateformat2) {
	var d1=getDateFromFormat(date1,dateformat1);
	var d2=getDateFromFormat(date2,dateformat2);
	if (d1==0 || d2==0) {
		return -1;
		}
	else if (d1 > d2) {
		return 1;
		}
	return 0;
	}

/*
--------------------------------------------------------------------------------
formatDate (date_object, format_string)

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
--------------------------------------------------------------------------------
*/
function formatDate(date_object,format_string) {
	format_string=format_string+"";
	var result="";
	var i_format_string=0;
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
	value["MMM"]= aCalendar_MonthsAbrv[M-1];
	value["MMMM"]= aCalendar_Months[M-1];       
	value["MMMMM"]= aCalendar_Months[M-1];      
	value["d"]=d;
	value["dd"]=LZ(d);
	value["E"]= aCalendar_DaysOfWeekAbrv[E];
	value["EE"]= aCalendar_DaysOfWeekAbrv[E];
    value["EEE"]= aCalendar_DaysOfWeekAbrv[E];
   	value["EEEE"]= aCalendar_DaysOfWeek[E];
	value["EEEEE"]= aCalendar_DaysOfWeek[E];   	
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
	  
	  In both cases, we update pointer i_format_string so that it refers to the
	  correct index of the next character to read from format_string.
	*/
	var escapedText="";
	while (i_format_string < format_string.length) {
		c=format_string.charAt(i_format_string);
		if(c == "'") {
		   i_format_string++; 
		   // Two quotes found? Then add a single quote 
		   if(format_string.charAt(i_format_string) == "'"){
		       result += "'";     
		       i_format_string++;
		       continue;
		   }
		   // Text in single quotation marks is passed as is in string returned
           escapedText="";
		   while( format_string.charAt(i_format_string) != "'" && (i_format_string < format_string.length)){
		       escapedText += format_string.charAt(i_format_string++);
		   }
		   result += escapedText;
           i_format_string++;
		   continue; 
		}
		
		token="";
		while ((format_string.charAt(i_format_string)==c) && (i_format_string < format_string.length)) {
			token += format_string.charAt(i_format_string++);
			}
		if (value[token] != null) { result=result + value[token]; }
		else { result=result + token; }
		}
	return result;
	}

/*
--------------------------------------------------------------------------------
Utility functions for parsing in getDateFromFormat()
--------------------------------------------------------------------------------
*/	
function _isInteger(val) {
	var digits="1234567890";
	for (var i=0; i < val.length; i++) {
		if (digits.indexOf(val.charAt(i))==-1) { return false; }
		}
	return true;
	}
function _getInt(str,i,minlength,maxlength) {
	for (var x=maxlength; x>=minlength; x--) {
		var token=str.substring(i,i+x);
		if (token.length < minlength) { return null; }
		if (_isInteger(token)) { return token; }
		}
	return null;
	}
	
/** 
--------------------------------------------------------------------------------
getDateFromFormat(date_string, format_string)
  
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
--------------------------------------------------------------------------------
*/
function getDateFromFormat(date_string,format_string) {
	date_string=date_string+"";
	format_string=format_string+"";
	var i_date_string=0;
	var i_format_string=0;
	var c="";
	var token="";
	var token2="";
	var x,y;
	var now=new Date();
	var year=now.getYear();
	var month=now.getMonth()+1;
	var date=1;
	var hh=now.getHours();
	var mm=now.getMinutes();
	var ss=now.getSeconds();
	var ampm="";
	
	while (i_format_string < format_string.length) {
		// Get next token from format_string 
		c=format_string.charAt(i_format_string);

        // Escaped text (in single quotes)
		if(c == "'") {
		   i_format_string++; 

		   // Double quotes found? Then increment i_format_string to go on to 
		   // the next character and increment i_date_string as every double 
		   // quotes is a single quote in date_string.
		   if(format_string.charAt(i_format_string) == "'"){
		       i_format_string++;
		       i_date_string++;     
		       continue;
		   }
	
		   // Increment (go on in parsing process)i_format_string in case of 
		   // escaped text as such text does not need to be interpreted in any 
		   //way. Count the characters in the escaped text to increment 
		   // i_date_string so that the parsing pointer in the format_string 
		   // (i_format_string) and in date_string (i_date_string) point to the 
		   // same piece of information
           charsInEscapedText = 0;
           for(;format_string.charAt(i_format_string) != "'" && (i_format_string < format_string.length);
                i_format_string++, charsInEscapedText++);
           i_format_string++;
           i_date_string += charsInEscapedText;
		   continue; 
		}
		
		token="";
		while ((format_string.charAt(i_format_string)==c) && (i_format_string < format_string.length)) {
			token += format_string.charAt(i_format_string++);
			}

		// Extract contents of value based on format token
		if (token=="yyyyy" || token=="yyyy" || token=="yyy" || token=="yy" || token=="y") {
			if (token=="yyyyy") { x=4;y=4; }
			if (token=="yyyy") { x=4;y=4; }
			if (token=="yyy")  { x=4;y=4; }   
			if (token=="yy")   { x=2;y=2; }
			if (token=="y")    { x=2;y=4; }
			year=_getInt(date_string,i_date_string,x,y);
			if (year==null) { return 0; }
			i_date_string += year.length;
			if (year.length==2) {
				if (year > 70) { year=1900+(year-0); }
				else { year=2000+(year-0); }
				}
			}
		else if (token=="MMM"){	
			month=0;
			for (var i=0; i<aCalendar_MonthsAbrv.length; i++) {
				var month_name=aCalendar_MonthsAbrv[i];
				if (date_string.substring(i_date_string,i_date_string+month_name.length).toLowerCase()==month_name.toLowerCase()) {
						month=i+1;
						i_date_string += month_name.length;
						break;
				}
			}
			if ((month < 1)||(month>12)){return 0;}
		}
		else if (token=="MMMM" || token == "MMMMM"){	
			month=0;
			for (var i=0; i<aCalendar_Months.length; i++) {
				var month_name=aCalendar_Months[i];
				if (date_string.substring(i_date_string,i_date_string+month_name.length).toLowerCase()==month_name.toLowerCase()) {
						month=i+1;
						i_date_string += month_name.length;
						break;
				}
			}
			if ((month < 1)||(month>12)){return 0;}
		}
		else if (token=="E" | token=="EE" | token=="EEE"){
			for (var i=0; i< aCalendar_DaysOfWeekAbrv.length; i++) {
				var day_name=aCalendar_DaysOfWeekAbrv[i];
				if (date_string.substring(i_date_string,i_date_string+day_name.length).toLowerCase()==day_name.toLowerCase()) {
					i_date_string += day_name.length;
					break;
					}
				}
		}
		else if (token=="EEEE" | token=="EEEEE"){
			for (var i=0; i<aCalendar_DaysOfWeek.length; i++) {
				var day_name=aCalendar_DaysOfWeek[i];
				if (date_string.substring(i_date_string,i_date_string+day_name.length).toLowerCase()==day_name.toLowerCase()) {
					i_date_string += day_name.length;
					break;
					}
				}
		}
		
		else if (token=="MM"||token=="M") {
			month=_getInt(date_string,i_date_string,1,2);
			if(month==null||(month<1)||(month>12)){return 0;}
			i_date_string+=month.length;}
		else if (token=="dd"||token=="d") {
            date=_getInt(date_string,i_date_string,1,2);
			if(date==null||(date<1)||(date>31)){return 0;}
			i_date_string+=date.length;}
		else if (token=="hh"||token=="h") {
			hh=_getInt(date_string,i_date_string,token.length,2);
			if(hh==null||(hh<1)||(hh>12)){return 0;}
			i_date_string+=hh.length;}
		else if (token=="HH"||token=="H") {
			hh=_getInt(date_string,i_date_string,token.length,2);
			if(hh==null||(hh<0)||(hh>23)){return 0;}
			i_date_string+=hh.length;}
		else if (token=="KK"||token=="K") {
			hh=_getInt(date_string,i_date_string,token.length,2);
			if(hh==null||(hh<0)||(hh>11)){return 0;}
			i_date_string+=hh.length;}
		else if (token=="kk"||token=="k") {
			hh=_getInt(date_string,i_date_string,token.length,2);
			if(hh==null||(hh<1)||(hh>24)){return 0;}
			i_date_string+=hh.length;hh--;}
		else if (token=="mm"||token=="m") {
			mm=_getInt(date_string,i_date_string,token.length,2);
			if(mm==null||(mm<0)||(mm>59)){return 0;}
			i_date_string+=mm.length;}
		else if (token=="ss"||token=="s") {
			ss=_getInt(date_string,i_date_string,token.length,2);
			if(ss==null||(ss<0)||(ss>59)){return 0;}
			i_date_string+=ss.length;}
		else if (token=="a") {
			if (date_string.substring(i_date_string,i_date_string+2).toLowerCase()=="am") {ampm="AM";}
			else if (date_string.substring(i_date_string,i_date_string+2).toLowerCase()=="pm") {ampm="PM";}
			else {return 0;}
			i_date_string+=2;}
		else {
			if (date_string.substring(i_date_string,i_date_string+token.length)!=token) {return 0;}
			else {i_date_string+=token.length;}
			}
		} // while loop

	// If there are any trailing characters left in date_string, it doesn't match
	if (i_date_string != date_string.length) { return 0; }
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
	var newdate=new Date(year,month-1,date,hh,mm,ss);
	return newdate.getTime();
	}