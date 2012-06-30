// var server = 'http://linkback.herokuapp.com';
var server = 'http://localhost:1666';
var homeUrl = "http://hyperphor.com/webhack/greasemonkey/blurb.html";
var homeSiteUrl = "http://linkback.herokuapp.com";
var seomozUrl = "http://seomoz.org";
var seomozIconUrl = homeSiteUrl +  "/linkscape.png";
// var homeIconUrl = "http://hyperphor.com/hyperphor-tiny.png";

var openclose;
var pageUrl;

function doPopup() {
    pageUrl = document.location.href;
    if (!blockUrl(pageUrl)) {
	doQuery(pageUrl);
    }
}

function makeQueryUrl(pageUrl) {
    return server + '/linkback-srv?page=' + encodeURIComponent(pageUrl);
}

function makeMoreUrl(pageUrl) {
    return server + '/linkback.html?page=' + encodeURIComponent(pageUrl);
}

function blockUrl(pageUrl) {
    return !(pageUrl.substring(0, 4) == "http");
}

function showResults(results) {
    if (results.length > 0) {
	makeWindow();
	for (var i=0; i<results.length; i++) {
	    var result = results[i];
	    insertLink(result.url, result.title);
	}
	if (results.length > 0) {
	    insertEndMatter(pageUrl, divStyled, results);
	}
    }
}

function doQuery(pageUrl) {
    var xhr = new XMLHttpRequest();
    xhr.open("GET", makeQueryUrl(pageUrl), true);
    xhr.onreadystatechange = function() {
	if (xhr.readyState == 4) {
	    if (xhr.status = 200) {
		// WARNING! Might be evaluating an evil script!
		var results = eval("(" + xhr.responseText + ")");
		showResults(results);
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

	addStyleLink(chrome.extension.getURL("reset.css"));
	addStyleLink(chrome.extension.getURL("linkback.css"));

	var body = document.getElementsByTagName('body')[0];
	var div = document.createElement('div');
	div.setAttribute('id', 'LinkBack');
	div.setAttribute('class', 'linkback');

//	var title = document.createElement('div');   
//	title.setAttribute('class', 'linkbacktitle');
//	insertText(title, 'Linkback');
//	div.appendChild(title);

	divStyled=document.createElement('div');
	divStyled.setAttribute('class','linkbackinner');
	
	div.appendChild(divStyled);

	openclose = insertOpenClose();
	opencloseUpdate();
//	title.appendChild(openclose);

	body.appendChild(div);
	
	//	title.drag = new Drag(title, div);

	var ul = document.createElement('ul');
	divStyled.appendChild(ul);
	linkWindow = ul;
    }
    return linkWindow;
}

function insertOpenClose() {
    var opener  = document.createElement('div');
    opener.setAttribute('style', 'position: absolute; right: 4px; top: 4px; cursor: pointer; background-color: #6699CC; border: 1px; border-style: solid; border-color: gray; text-align: center; width: 14px; height: 14px; font-size:9pt');
    opener.addEventListener('click', openCloseHandler, true);
    return opener;
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

function insertEndMatter(pageUrl, container, results) {
    var div = document.createElement('div');
    div.setAttribute('class','linkbackfooter');
    container.appendChild(div);
    if (results.length >= 20) {	// limit imposed by server
	insertLinkAny(div, makeMoreUrl(pageUrl), "More");
    	insertText(div, ' ');
    }
    insertLinkAny(div, homeUrl, "Linkback");
    insertText(div, ' ');
//    insertImgLink(div, homeIconUrl,homeSiteUrl);
//    insertText(div, ' ');
    insertImgLink(div, seomozIconUrl, seomozUrl);
    
    // additional opener -- not quite the right thing but better than nothing for now.
    var opener = insertOpenClose();
    opener.setAttribute('style', 'display:inline; position: absolute; right: 4px;  cursor: pointer; background-color: #6699CC; border: 1px; border-style: solid; border-color: gray; text-align: center; width: 14px; height: 14px; font-size:9pt');
    div.appendChild(opener);

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
    var container = makeWindow();
    insertText(container, 'Error: ' + code + ': ' + msg);
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


function addStyleLink(href) {
    var head, link;
    head = document.getElementsByTagName('head')[0];
    if (!head) { return; }
    link = document.createElement('link');
    link.type = 'text/css';
    link.rel = 'stylesheet';
    link.href = href;
    head.appendChild(link);

}

doPopup();

