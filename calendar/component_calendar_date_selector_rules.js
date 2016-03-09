// component_calendar_rules.js

/* DaysInWeekRule class. -------------------------------------------------------
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
function DaysInWeekRule(sDays){
   // Day of week
   this.days = sDays;
}

/* Method includes(iYear, iMonth, iDay)

   Returns true if the date represented by the values passed as arguments occurs 
   during one of the days of the week specified in member variable days. 
   Otherwise this method returs false.
*/
DaysInWeekRule.prototype.includes = function(iYear, iMonth, iDay){
   // Create a Date object from argument passed
   var oDate = new Date(iYear, iMonth, iDay);
   
   // parse the days and place it in an array
   var aDays = this.days.split(",");
   var result = false;
   
   // If we find that the day in oDate is one of the days in array aDays, then
   // return true
   for(var i in aDays){
       var iDay = aDays[i];
       if(oDate.getDay() == iDay){
          result = true;
          break;
       }
   }
   
   return result;   
}

/** DateRangeRule class. --------------------------------------------------------
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

function DateRangeRule(vArg1, iArg2, iArg3, vArg4, iArg5, iArg6){
   /* Properties of this class:
       this.startDate and
       this.endDate
   */
                       
   if(arguments.length == 6){                       
       // First three arguments form the lower limit date range. 
      this.startDate = new Date(vArg1, iArg2-1, iArg3);
   
      // Last three arguments form the upper limit date range. 
      this.endDate = new Date(vArg4, iArg5-1, iArg6);
   
   }else{
      /* User should have provided an open limit date:
             *, endYear, endMonth, endDay    or
             startYear, startMonth, startDay, *
      */
      
      if(vArg1 == "*"){
          // Open lower date range limit
          this.startDate = vArg1;
          
          // Next three arguments form the upper limit date range. 
          this.endDate = new Date(iArg2, iArg3-1, vArg4);
      }else if(vArg4 == "*"){
              // First three arguments form the lower limit date range. 
              this.startDate = new Date(vArg1, iArg2-1, iArg3);
      
             // Open upper date range limit
             this.endDate = vArg4;
      }
   } 
}

/* Method includes(iYear, iMonth, iDay)

   Returns true if the date represented by the values passed as arguments occurs 
   during the date range -including the lower and upper limits- defined by 
   member variables startDate and endDate. Otherwise this method returns false.
*/
DateRangeRule.prototype.includes = function(iYear, iMonth, iDay){
   // Create a Date object from argument passed
   var oDate = new Date(iYear, iMonth, iDay);
   // Compare dates
   
   var bResult;
   
   if(this.startDate == "*"){
       // Open lower date range limit [infinite - endDate]
       // Is date provided less than or equal to upper date range limit?
       bResult = (oDate <= this.endDate);
   }else if(this.endDate == "*"){
       // Open upper date range limit [startDate - infinite]
       // Is date provided greater than or equal to lower date range limit?
       bResult = (oDate >= this.startDate);
   }else{
       // Using closed date range limits [startDate - endDate]
       bResult = (this.startDate <= oDate && this.endDate >= oDate);    
   }
   
   return bResult;
}

/**
   Method toString()
   
   Returns the string representation of the date range defined by the 
   DateRangeRule class. 
*/
DateRangeRule.prototype.toString= function(){
   // We are not using Date.toStrig() method as it is verbose.
   var sToStr;
   if(this.startDate == "*") {
       sToStr = "[* - " + this.endDate.getMonth() + "/" + this.endDate.getDate() 
               + "/" + this.endDate.getYear() + "]\n";         
   
   }else if(this.endDate == "*"){
       sToStr =  "[" + this.startDate.getMonth() + "/" + this.startDate.getDate() 
                + "/" + this.startDate.getYear() + " - *]\n";         
   }else{
       sToStr = "[" + this.startDate.getMonth() + "/" + this.startDate.getDate() 
               + "/" + this.startDate.getYear() + " - [" + 
               this.endDate.getMonth() + "/" + this.endDate.getDate() + "/" + 
               this.endDate.getYear() + "]\n";         
    }
    
   return sToStr;
}

/* RuleSetBase class. --------------------------------------------------------
   Base class with common functionality to handle a set of rule objects.
*/
function RulesSetBase(){
   // Collection of rule objects
   this.rules = new Array();
}

/** 
   Method addRule(oRule)
   
   Adds the object passed as an argument to the set of rules contained by this
   object.
*/
RulesSetBase.prototype.addRule = function(oRule){
    this.rules = this.rules.concat(oRule);
}

/** 
   Method removeRule(oRule)
   
   Removes the object passed as an argument from the set of rules contained by 
   this object.
*/
RulesSetBase.prototype.removeRule = function(oRule){
   for(var i in this.rules){
       var oRuleInArray = this.rules[i];
       if(oRule == oRuleInArray){
          // Remove rule starting at index i from array of rules
          this.rules.splice(i, 1);
       }
   }
}

/* Union class. -------------------------------------------------------
   Class used to define a set of rules which participate in a union operation. 
   The result of constructing a Union object is a union rule that defines a set 
   that encompasses all the dates defined by all rules in the Union object. 
   Please refer to method includes below for more information.
*/
function Union(){
    // Inherit array of rules (rules) from RulesSetBase
    RulesSetBase.call(this);
}

// Inherit addRule and removeRule methods from RulesSetBase
Union.prototype = new RulesSetBase();

/**
   Method includes refers to actual function (method) that provides the 
   intended functionality
*/
Union.prototype.includes = satisfiesAnyRule;

/**
   Method satisfiesAnyRule(iYear, iMonth, iDay)
   
   Core method for classes that contain rules that participate in a union 
   operation. 
   Returns true if the date provided as an argument meets any of the rules 
   contained in this object's rules arrray. This method returns false if no
   rule in this object's rules array is satisfied with the date supplied. 
*/
function satisfiesAnyRule(iYear, iMonth, iDay){
    var bResult = false;
    
    for (var i in this.rules){
        var oRule = this.rules[i];
        if(oRule.includes(iYear, iMonth, iDay)){
            bResult = true;
            break;
        }
    }
    
    return bResult;
}

/* Intersection class. -------------------------------------------------------
   Class used to define a set of rules which participate in an intersection 
   operation. The result of constructing an Intersection object is an 
   Intersection rule that defines a set of dates which are members of all the 
   date sets (rule sets) in the Intersection object.
   Please refer to method includes below for more information.   
*/
function Intersection(){
    // Inherit array of rules (rules) from RulesSetBase
    RulesSetBase.call(this);
}

// Inherit addRule and removeRule methods from RulesSetBase
Intersection.prototype = new RulesSetBase();

/**
   Method includes(iYear, iMonth, iDay)
   
   Core method for classes that contain rules that participate in an 
   Intersection operation. 
   
   Returns true if the date provided as an argument meets *all* the rules 
   contained in this object's rules arrray. Otherwise, this method returns false.
*/
Intersection.prototype.includes = function(iYear, iMonth, iDay){
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

/** Difference class. -----------------------------------------------------------
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
function Difference(oMinuendRule, oSubtrahendRule){
    this.rule1 = oMinuendRule;
    this.rule2 = oSubtrahendRule;
}

/**
   Method includes(iYear, iMonth, iDay)
   
   Returns true if the date passed as an argument is included in the dates set 
   defined by the rule1 member variable and it is *not* included in the dates
   set defined by the rule2 member variable.
*/
Difference.prototype.includes = function(iYear, iMonth, iDay){
    var bResult = (this.rule1.includes(iYear, iMonth, iDay) && 
                  ! this.rule2.includes(iYear, iMonth, iDay));
    return bResult;
}


/* CalendarRules class. --------------------------------------------------------
   Class that contains all the rules that are used to determine if a date 
   (provided to the includes method) is enabled or disabled for selection using
   a calendar date selector (JavaScript) component. 
*/
function CalendarRules(){
    // Inherit array of rules (rules) from RulesSetBase
    RulesSetBase.call(this);
    
    // Boolean property that indicates if the the rules in this object are for
    // enabling or for disabling dates.
    this.forEnablingDates = false;
}

// Inherit the method addRule and removeRule from RulesSetBase
CalendarRules.prototype = new RulesSetBase();

/**
   Method includes refers to actual function (method) that provides the 
   intended functionality
*/
CalendarRules.prototype.includes = satisfiesAnyRule;

/**
   Method setForEnablingDates(bForEnablingDates)
   
   Sets member variable forEnablingDates to the boolean value passed as an 
   argument. 
*/
CalendarRules.prototype.setForEnablingDates = function(bForEnablingDates){
    this.forEnablingDates = bForEnablingDates;
}

/**
   Method isSetForEnablingDates()
   
   Returns the boolean value stored in member variable forEnablingDates. More
   precisely, this method returns true if the rules contained by an instance of 
   this class are used for enabling dates. This method returns false if the 
   rules contained by an instance of this class are used for disabling dates.
*/
CalendarRules.prototype.isSetForEnablingDates = function(){
    return this.forEnablingDates;
}