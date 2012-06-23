// Version 0.9
//
// ==UserScript==
// @name          LinkBack
// @namespace     http://hyperphor.com
// @description   For any page, show some of the pages that point to it.
// @include       *
// @exclude       *.google.*
// @exclude       *.yahoo.*

// ==/UserScript==
// Based on Peninsula Library lookup
// Version 0.1 - First release
// 0.2 - better CSS, still highly imperfect
// 0.3 - close box
// 0.4 - only show in top frame -- was showing up in every stupid ad
// 0.5 - shorten outer pane so it doesn't block clicks when scroller is up
// 0.6 - entities show up unescaped, yay
// 0.7 - block non-http: urls for security
//       rearrange url parameters to fix >10 entry problems.
//       eliminate some CSS leakthrough problems
// 0.8 - Yahoo discontinued Site Explorer API, swith to seomoz.org
// 0.9 - Use relay
//    

function debug(aMsg) {
    // uncomment for debugging messages
    // GM_log(aMsg);
}

function addGlobalStyle(css) {
    var head, style;
    head = document.getElementsByTagName('head')[0];
    if (!head) { return; }
    style = document.createElement('style');
    style.type = 'text/css';
    style.innerHTML = css;
    head.appendChild(style);
}

addGlobalStyle(
'.linkback {  position: absolute; width: 300px;  height: 10px;  right: 0;  top: 0;  z-index:1999; font: normal normal normal 10pt arial}' +
'.linkbacktitle {  background:#333399; cursor:move; color:white; padding: 2px; font-weight: bold}' +
'.linkbackinner {  border:1px solid #06060a;  background:#efefff;  text-align: left;  opacity:0.85; }' +
'.linkbackinner ul { list-style-type: disc ; margin-left: 1px; padding-left: 15px}' +
'.linkbackinner li { margin-top: 1px; margin-bottom: 1px; margin-left: 1px; color: gray;  }' +
'.linkbackinner a { font: normal normal normal 10pt arial; text-decoration: none   }' +
'.linkbackinner a:link {  color: #0000DD;   }' +
'.linkbackinner a:visited {  color: #AF00AF;  }' +
'.linkbackinner a:hover {  background-color: #f4dc8d;}');


function getElementText(node) {
    return node.firstChild.nodeValue;
}

(

  function() {

 // some important parameters
      var nResults = 12;	// not presently used...

  var Drag = function(){ this.init.apply( this, arguments ); };

  Drag.fixE = function( e ) {
    if( typeof e == 'undefined' ) e = window.event;
    if( typeof e.layerX == 'undefined' ) e.layerX = e.offsetX;
    if( typeof e.layerY == 'undefined' ) e.layerY = e.offsetY;
    return e;
  };

  Drag.prototype.init = function( handle, dragdiv ) {
    this.div = dragdiv || handle;
    this.handle = handle;

    if( isNaN(parseInt(this.div.style.left)) ) this.div.style.left  = this.div.offsetLeft + 'px';
    if( isNaN(parseInt(this.div.style.top)) ) this.div.style.top = this.div.offsetTop + 'px';
    this.onDragStart = function(){};
    this.onDragEnd = function(){};
    this.onDrag = function(){};
    this.onClick = function(){};
    this.mouseDown = addEventHandler(this.handle, 'mousedown', this.start, this);
  };

  Drag.prototype.start = function(e) {

    e = Drag.fixE(e);

    this.started = new Date();
    var y = this.startY = parseInt(this.div.style.top);
    var x = this.startX = parseInt(this.div.style.left);
    this.onDragStart(x, y);
    this.lastMouseX = e.clientX;
    this.lastMouseY = e.clientY;
    this.documentMove = addEventHandler(document, 'mousemove', this.drag, this);
    this.documentStop = addEventHandler(document, 'mouseup', this.end, this);
    if (e.preventDefault) e.preventDefault();
    return false;
  };

  Drag.prototype.drag = function( e ) {
    e = Drag.fixE(e);
    var ey = e.clientY;
    var ex = e.clientX;
    var y = parseInt(this.div.style.top);
    var x = parseInt(this.div.style.left);
    var nx = ex + x - this.lastMouseX;
    var ny = ey + y - this.lastMouseY;
    this.div.style.left = nx + 'px';
    this.div.style.top  = ny + 'px';
    this.lastMouseX = ex;
    this.lastMouseY = ey;
    this.onDrag(nx, ny);
    if (e.preventDefault) {
      e.preventDefault();
    }
    return false;
  };

  Drag.prototype.end = function() {
    removeEventHandler( document, 'mousemove', this.documentMove );
    removeEventHandler( document, 'mouseup', this.documentStop );
    var time = (new Date()) - this.started;
    var x = parseInt(this.div.style.left),  dx = x - this.startX;
    var y = parseInt(this.div.style.top), dy = y - this.startY;
    this.onDragEnd( x, y, dx, dy, time );
    if ((dx*dx + dy*dy) < (4*4) && time < 1e3) {
	this.onClick( x, y, dx, dy, time );
    }
  };

  function removeEventHandler( target, eventName, eventHandler ) {
      if (target.addEventListener) {
	  target.removeEventListener( eventName, eventHandler, true );
      } else if (target.attachEvent) {
	  target.detachEvent( 'on' + eventName, eventHandler );
    }
  }

  function addEventHandler( target, eventName, eventHandler, scope ) {
    var f = scope ? function(){ eventHandler.apply( scope, arguments ); } : eventHandler;
    if (target.addEventListener) {
	target.addEventListener( eventName, f, true );
    } else if (target.attachEvent) {
	target.attachEvent( 'on' + eventName, f );
    }
    return f;
  }


  function makeQueryUrl(pageUrl) {
      return 'http://linkback.herokuapp.com/linkback-srv?page='
	  + encodeURI(pageUrl);
  }
 
  function blockUrl(pageUrl) {
      return !(pageUrl.substring(0, 5) == "http:");
  }

      // +++=
  function makeMoreUrl(pageUrl) {
      return 'http://search.yahoo.com/search?p='
	  + encodeURI("link:" + pageUrl);
  }

      // +++ GM_getValue not supported by chrome, sigh.  
      var open = true; // GM_getValue('LinkBackOpen', true);
  var openCloseHandler = function() {
      open = !open;
      GM_setValue('LinkBackOpen', open);
      opencloseUpdate();
      if (open && !loaded) {
	  doLookup();
      }
  }

  var divStyled;
  var linkWindow = null;
  var openclose;

  opencloseUpdate = function() {
      if (open) {
	  openclose.innerHTML = '-';
	  divStyled.style.visibility = "visible";
      }
      else {
	  openclose.innerHTML = '+';	  
	  divStyled.style.visibility = "hidden";
      }
  }

  onTop = function() {
      return (top == window);
  }

  makeWindow = function() {
      if (linkWindow == null) {

	  var body = document.getElementsByTagName('body')[0];
	  var div = document.createElement('div');
	  div.setAttribute('id', 'LinkBack');
	  div.setAttribute('class', 'linkback');
	  var title = document.createElement('div');   
	  title.setAttribute('class', 'linkbacktitle');
	  insertText(title, 'Linkback');
	  div.appendChild(title);

	  divStyled=document.createElement('div');
	  divStyled.setAttribute('class','linkbackinner');
	  
	  div.appendChild(divStyled);

	  openclose = document.createElement('div');
	  openclose.setAttribute('style', 'position: absolute; right: 4px; top: 4px; cursor: pointer; background-color: #6699CC; border: 1px; border-style: solid; border-color: gray; text-align: center; width: 14px; height: 14px; font-size:9pt');
	  openclose.addEventListener('click', openCloseHandler, true);
	  opencloseUpdate();
	  title.appendChild(openclose);

	  body.appendChild(div);
	  
	  title.drag = new Drag(title, div);

	  var ul = document.createElement('ul');
	  divStyled.appendChild(ul);
	  linkWindow = ul;
      }
      return linkWindow;
  }


    insertLink = function(url, title) {

	var container = makeWindow();
	var li = document.createElement('li');
	container.appendChild(li);
	insertLinkAny(li, url, title);
    }

    insertLinkAny = function(container, url, title) {
	var link = document.createElement('a');
	link.setAttribute('href', url);
	insertText(link, title);
	container.appendChild(link);
    }

    insertImgLink = function(container, imgUrl, linkUrl) {
	var link = document.createElement('a');	
	link.setAttribute('href', linkUrl);
	var img = document.createElement('img');
	img.setAttribute('src', imgUrl);
	img.setAttribute('border', '0');
	img.setAttribute('style', 'vertical-align: middle');
	link.appendChild(img);
	container.appendChild(link);
    }
    

    var homeUrl = "http://hyperphor.com/webhack/greasemonkey/blurb.html";
      var homeSiteUrl = "http://linkback.herokuapp.com";
    var seomozUrl = "http://seomoz.org";
    var seomozIconUrl = homeSiteUrl +  "/linkscape.png";
    var homeIconUrl = "http://hyperphor.com/hyperphor-tiny.png";

    insertEndMatter = function(pageUrl, container) {
	var div = document.createElement('div');
	div.setAttribute('style', 'font-size: 9pt; text-align: center; margin-bottom: 1pt');
	container.appendChild(div);
// out of service
//	insertLinkAny(div, makeMoreUrl(pageUrl), "More");
//	insertText(div, ' ');
	insertLinkAny(div, homeUrl, "About");
	insertText(div, ' ');
	insertImgLink(div, homeIconUrl,homeSiteUrl);
	insertText(div, ' ');
	insertImgLink(div, seomozIconUrl, seomozUrl);
    }

    insertError = function(code, msg) {
	insertText('Error: ' + code + ': ' + msg);
    }

    insertText = function(container, text) {
	var node = document.createTextNode(unescapeHTML(text));
	container.appendChild(node);
    }

    // borrowed from Prototype
    unescapeHTML = function(text) {
	var div = document.createElement('div');
	div.innerHTML = text;
	return div.childNodes[0] ? div.childNodes[0].nodeValue : '';
    }

    var loaded = false;
    doLookup = function () {

	var pageUrl = document.location.href;
	if (!blockUrl(pageUrl)) {
	    debug('query url: ' + makeQueryUrl(pageUrl));

	    GM_xmlhttpRequest ({
		method : 'GET', 
		    url : makeQueryUrl(pageUrl),
		    onload : function(response) {
		    if (response.status = 200) {
			var results = eval("(" + response.responseText + ")");
			for (var i=0; i<results.length; i++) {
			    var result = results[i];
			    insertLink(result.url, result.title);
			}
	      
			if (results.length > 0) {
			    insertEndMatter(pageUrl, divStyled);
			}
		    }
		    else {
			insertError(response.status, response.statusText);
		    }
		    loaded = true;
		}
	    });
	}
    }

    if (onTop()) {
	makeWindow();
	if (open) {
	    doLookup();
	}
    }

}
 )();


