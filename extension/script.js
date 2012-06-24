// var server = 'http://linkback.herokuapp.com';
var server = 'http://localhost:1666';
var homeUrl = "http://hyperphor.com/webhack/greasemonkey/blurb.html";
var homeSiteUrl = "http://linkback.herokuapp.com";
var seomozUrl = "http://seomoz.org";
var seomozIconUrl = homeSiteUrl +  "/linkscape.png";
var homeIconUrl = "http://hyperphor.com/hyperphor-tiny.png";

function doPopup() {
    var pageUrl = document.location.href;
    if (!blockUrl(pageUrl)) {
	makeWindow();
	doQuery(pageUrl);
    }
}

function makeQueryUrl(pageUrl) {
    return server + '/linkback-srv?page=' + encodeURI(pageUrl);
}

function blockUrl(pageUrl) {
    return !(pageUrl.substring(0, 4) == "http");
}

function doQuery(pageUrl) {
    var xhr = new XMLHttpRequest();
    xhr.open("GET", makeQueryUrl(pageUrl), true);
    xhr.onreadystatechange = function() {
	if (xhr.readyState == 4) {
	    if (xhr.status = 200) {
		// WARNING! Might be evaluating an evil script!
		var results = eval("(" + xhr.responseText + ")");
		for (var i=0; i<results.length; i++) {
		    var result = results[i];
		    insertLink(result.url, result.title);
		}
		if (results.length > 0) {
		    insertEndMatter(pageUrl, divStyled);
		}
	    }
	    else {
		insertError(xhr.status, xhr.statusText);
	    }
	    loaded = true;
	}
    };
    xhr.send();

}

var linkWindow;

function  makeWindow() {
    if (linkWindow == null) {

	addGlobalStyle(
	    '.linkback {  position: fixed; width: 300px; right: 0px; bottom: 0px; z-index:1999; font: normal normal normal 10pt arial}' +
		'.linkbacktitle {  background:#333399; cursor:move; color:white; padding: 2px; font-weight: bold}' +
		'.linkbackinner {  border:1px solid #06060a;  background:#efefff;  text-align: left;  opacity:0.85; }' +
		'.linkbackinner ul { list-style-type: disc ; margin-left: 1px; padding-left: 15px}' +
		'.linkbackinner li { margin-top: 1px; margin-bottom: 1px; margin-left: 1px; color: gray;  }' +
		'.linkbackinner a { font: normal normal normal 10pt arial; text-decoration: none   }' +
		'.linkbackinner a:link {  color: #0000DD;   }' +
		'.linkbackinner a:visited {  color: #AF00AF;  }' +
		'.linkbackinner a:hover {  background-color: #f4dc8d;}');


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
	
	//	title.drag = new Drag(title, div);

	var ul = document.createElement('ul');
	divStyled.appendChild(ul);
	linkWindow = ul;




    }
    return linkWindow;
}

function insertLink(url, title) {
    var container = makeWindow();
    var li = document.createElement('li');
    container.appendChild(li);
    insertLinkAny(li, url, title);
}

function insertLinkAny(container, url, title) {
    var link = document.createElement('a');
    link.setAttribute('href', url);
    insertText(link, title);
    container.appendChild(link);
}

function insertEndMatter(pageUrl, container) {
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


function insertText(container, text) {
    var node = document.createTextNode(unescapeHTML(text));
    container.appendChild(node);
}

// borrowed from Prototype
function unescapeHTML(text) {
    var div = document.createElement('div');
    div.innerHTML = text;
    return div.childNodes[0] ? div.childNodes[0].nodeValue : '';
}

function insertError(code, msg) {
    insertText('Error: ' + code + ': ' + msg);
}


function insertImgLink(container, imgUrl, linkUrl) {
    var link = document.createElement('a');	
    link.setAttribute('href', linkUrl);
    var img = document.createElement('img');
    img.setAttribute('src', imgUrl);
    img.setAttribute('border', '0');
    img.setAttribute('style', 'vertical-align: middle');
    link.appendChild(img);
    container.appendChild(link);
}

var open;

function openCloseHandler() {
    open = !open;
    //      GM_setValue('LinkBackOpen', open);
    opencloseUpdate();
    if (open && !loaded) {
	doLookup();
    }
}

function opencloseUpdate() {
    if (open) {
	openclose.innerHTML = '-';
	divStyled.style.display = null; // note: setting to inline here does not work because it propagates downward to where it doesn't belong...css pkm
    }
    else {
	openclose.innerHTML = '+';	  
	divStyled.style.display = "none";
    }
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


doPopup();

