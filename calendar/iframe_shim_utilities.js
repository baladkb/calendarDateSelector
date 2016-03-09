/*
FUNCTION NAME: createIFrameShim
-----------------------------------------------------------------------
constructor for an iframe ie shim

Parameter Definitions
====================
none
*/
function IFrameShim (id) {
	var iFrameShim = null;
	
	this.iFrameShim = document.createElement("IFRAME");
	//src needs to be set for project
	this.iFrameShim.setAttribute("src", sIframeShimUrl);
	this.iFrameShim.setAttribute("scrolling", "no");
	this.iFrameShim.setAttribute("frameborder", "0");
	this.iFrameShim.style.display = "none"
	document.body.appendChild(this.iFrameShim);

	// show iframe shim
	this.show = function(x, y, w, h, t, z) {	
		this.iFrameShim.style.left = x;
		this.iFrameShim.style.top = y;
		this.iFrameShim.style.width = w;
		this.iFrameShim.style.height = h;
		this.iFrameShim.style.filter = "alpha(opacity=" + t + ")";
		this.iFrameShim.style.opacity = t/100;
		this.iFrameShim.style.display = "block";	
		this.iFrameShim.style.position = "absolute";	
		this.iFrameShim.style.zindex = z;	
	}
	
	// hide iframe shim
	this.hide = function () {
		this.iFrameShim.style.display = "none";
	}
	// remove the node before destroying the shim 
	this.discard = function () {
		document.body.removeChild(this.iFrameShim);
		this.iFrameShim = null;
	}
}