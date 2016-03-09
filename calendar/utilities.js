//Javascript file

var isIE = (navigator.appName.indexOf("Microsoft") != -1) ? true : false;

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
/*
FUNCTION NAME: addResizeEvent
-----------------------------------------------------------------------
adds a function to the resize event while preserving any previously added functions.

Parameter Definitions
====================
func: the function to add to the on load event
*/
function addResizeEvent(func) {
	addEventFunction(func, window, "resize");
}
/*
FUNCTION NAME: getElementsByClass
-----------------------------------------------------------------------
returns an array of elements with the class name.  Allows for double classing
ex: class="class1 classTarget"

Parameter Definitions
====================
theClass: the name of the class
tagName : name the of the tag ex: "INPUT"
rootElement: the DOM Element to look under
*/
function getElementsByClass(theClass, tagName, rootElement) {
	var gotCollection = new Array();
	var gotAll = new Array();
	if (!tagName || tagName =="" || typeof tagName == "undefined") tagName = "*";
	if (!rootElement || rootElement =="" || typeof rootElement == "undefined") rootElement = document;
	gotAll = rootElement.getElementsByTagName(tagName);
    j=0;
    for (i=0; i<gotAll.length; i++) {
	   if ((gotAll[i].className==theClass)||(gotAll[i].className.search(" " + theClass)!=-1)||(gotAll[i].className.search(" " + theClass + " ")!=-1)||(gotAll[i].className.search(theClass + " ")!=-1)) {
			gotCollection[j]=gotAll[i];
			j++;
	   }
	}
    return gotCollection;
}


/*
FUNCTION NAME: hasClassName
-----------------------------------------------------------------------
looks at the node to see if node has the class in the class name

Parameter Definitions
====================
theClass	= the class 
theNode		= the node in question
*/
function hasClassName(theClass, theNode) {
	if (theNode && theNode.className) {
		return ((theNode.className==theClass)||(theNode.className.search(" " + theClass)!=-1)||(theNode.className.search(" " + theClass + " ")!=-1)||(theNode.className.search(theClass + " ")!=-1)); 
	} else {
		return false;
	}
}

/*
FUNCTION NAME: getParentByClass
-----------------------------------------------------------------------
returns the parent of the node with that class name

Parameter Definitions
====================
theClass	= the class 
theNode		= the node in question
*/
function getParentByClass(theClass, theNode) {
	var theParent = theNode.parentNode;
	//find the container
	
	while (theParent && !hasClassName(theClass,theParent)){
		theParent = theParent.parentNode;
	}
	//if found
	if (theParent && hasClassName(theClass,theParent)) {
		return theParent;
	} else { //if not found
		return null;
	}
}


/*
FUNCTION NAME: arrayContains
-----------------------------------------------------------------------
utility function to see if an array contains a value

Parameter Definitions
====================
theArray = the array to search
theValue = the value to search for
*/	
function arrayContains(theArray, theValue) {
	for(var i = 0; i < theArray.length; i++){
		if (theArray[i]==theValue){
			return true;
		}
	}
	return false;
}

/*
FUNCTION NAME: getElementCoordinates
-----------------------------------------------------------------------
returns the x and y position of the element in an object


Parameter Definitions
====================
theElement: the element to get the coordinates of

*/	
function getElementCoordinates(theElement) {
	var elementXpos = 0;
	var elementYpos = 0;
	for ( e = theElement; e; e = e.offsetParent) {
		elementXpos += e.offsetLeft;
		elementYpos += e.offsetTop;
	}
	//correct for the overflowing elements
	for ( e = theElement.parentNode; e && e != document.body; e = e.parentNode) {
		if (e.scrollTop) elementYpos -= e.scrollTop;
		if (e.scrollLeft) elementXpos -= e.scrollLeft;
	}
	var elementCoordinates = new Object;
	elementCoordinates.x = elementXpos;
	elementCoordinates.y = elementYpos;
	return elementCoordinates;
}

/*
FUNCTION NAME: getElementDimensions
-----------------------------------------------------------------------
returns the height and width of the element in an object

Parameter Definitions
====================
theElement: the element to get the coordinates of
*/	
function getElementDimensions(theElement) {
	var elementHeight = theElement.offsetHeight;
	//alert("h:" + elementHeight);
	var elementWidth = theElement.offsetWidth;
	//alert("w:" + elementWidth);
	var elementDimensions = new Object;
	elementDimensions.h = elementHeight;
	elementDimensions.w = elementWidth;
	return elementDimensions;
}

/*
FUNCTION NAME: getMouseCoords
-----------------------------------------------------------------------
returns the coordinates of the mouse

Parameter Definitions
====================
e : the event object
*/	
function getMouseCoords (e) {
	if (isIE) {
		var scrollTop = document.documentElement.scrollTop;
		var scrollLeft = document.documentElement.scrollLeft;
	} else {
		var scrollTop = window.pageYOffset;
		var scrollLeft = window.pageXOffset;
	}
	x = e.clientX + scrollLeft;
	y = e.clientY + scrollTop;
	var mouseCoords = new Object;
	mouseCoords.x = x;
	mouseCoords.y = y;
	return mouseCoords;
}

/*
FUNCTION NAME: replace class name
-----------------------------------------------------------------------
removes the old class name and adds the new one 

Parameter Definitions
====================
theArray = the array to search
theValue = the value to search for
*/	
function replaceClassName(oldClass, newClass, theElement) {
	if (theElement && theElement.className) {
		if (theElement.className.length > 0 && theElement.className != oldClass) {
			classes = theElement.className.split(" ");
			for (var i = 0; i < classes.length; i++) {
				if (stripWhitespace(classes[i]) == oldClass) {
					classes[i] = newClass;
				}
			}
				theElement.className = classes.join(" ");

		} else {
			theElement.className = newClass;
		} 
	}
}

function stripWhitespace(theString) {
	return theString.replace(/\sw/g, "");	
}
									 
							



