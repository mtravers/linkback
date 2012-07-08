var server = 'http://linkback.herokuapp.com';
// var server = 'http://localhost:1666';
var homeSiteUrl = "http://linkback.herokuapp.com";
var seomozUrl = "http://seomoz.org";
var seomozIconUrl = homeSiteUrl +  "/linkscape.png";
// var homeIconUrl = "http://hyperphor.com/hyperphor-tiny.png";

var openclose;
var pageUrl;
var pane;			// contents pane
var savedResults;

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
	}
    };
    xhr.send();
}

function ifOpen(yes, no) {
    chrome.extension.sendMessage({cmd:"isOpen"}, function(response) {
	if (response) 
	    yes.call();
	else
	    no.call();
    });
}

function invertOpen() {
    chrome.extension.sendMessage({cmd:"switchOpen"}, function(response) {
    });
}

function setOpen(nv) {
    chrome.extension.sendMessage({cmd:"setOpen",value: nv}, function(response) {
    });
}
 

function showResults(results) {
    if (results != null && results.length > 0) {
	savedResults = results;
	ifOpen(function () { showResultsOpen(results); },
	       function () { showResultsClosed(results); });
    }
}

function showResultsOpen(results) {
    makeWindow();
    var ul = document.createElement('ul');
    ul.setAttribute('id', 'linkback_ul');
    pane.appendChild(ul);
    for (var i=0; i<results.length; i++) {
	var result = results[i];
	insertLink(result.url, result.title);
    }
    if (results.length > 0) {
	insertEndMatter(pageUrl, results);
    }
}


function openCloseHandler() {
    var open = invertOpen();
    pane.innerHTML = '';
    showResults(savedResults);
}

function  makeWindow() {
    if (pane == null) {

	addStyleLink(chrome.extension.getURL("reset.css"));
	addStyleLink(chrome.extension.getURL("linkback.css"));

	var body = document.getElementsByTagName('body')[0];
	var div = document.createElement('div');
	div.setAttribute('id', 'LinkBack');
	div.setAttribute('class', 'linkback');

	pane=document.createElement('div');
	pane.setAttribute('class','linkbackinner');
	
	div.appendChild(pane);
	body.appendChild(div);

    }
    return pane;
}

function insertOpenClose() {
    openclose  = document.createElement('div');
    openclose.setAttribute('class', 'linkbackopener');
    opencloseUpdate();
    openclose.addEventListener('click', openCloseHandler, true);
    return openclose;
}

function insertLink(url, title) {
    var container = document.getElementById('linkback_ul');
    var li = document.createElement('li');
    container.appendChild(li);
    insertLinkAny(li, url, title);
}

function insertLinkAny(container, url, title) {
    var link = document.createElement('a');
    link.setAttribute('href', url);
    insertText(link, title);
    container.appendChild(link);
    return link;
}

// need a graphic, but ok for now
// misnamed for it does not actually show results.
function showResultsClosed(results) {
    makeWindow();
    insertEndMatter(null, null);
}

// if results is null, this is a closed view
function insertEndMatter(pageUrl, results) {

    var div = document.createElement('div');
    div.setAttribute('class','linkbackfooter');
    pane.appendChild(div);

    if (results && results.length >= 20) {	// limit imposed by server
	var link = insertLinkAny(div, makeMoreUrl(pageUrl), "More");
	link.setAttribute('class','linkbackmore');
    }

    insertLinkAny(div, homeSiteUrl, "Linkback");
    insertText(div, ' ');
    if (results) {
	var img = insertImgLink(div, seomozIconUrl, seomozUrl);
	img.setAttribute('class','linkbackseo');    
    }
    
    // additional opener -- not quite the right thing but better than nothing for now.
    var opener = insertOpenClose();
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
    var container = document.getElementById('linkback_ul');
    insertText(container, 'Error: ' + code + ': ' + msg);
}

function insertImgLink(container, imgUrl, linkUrl) {
    var link = document.createElement('a');	
    if (linkUrl) link.setAttribute('href', linkUrl);
    var img = document.createElement('img');
    img.setAttribute('src', imgUrl);
    img.setAttribute('border', '0');
    img.setAttribute('style', 'vertical-align: middle');
    link.appendChild(img);
    container.appendChild(link);
    return link;
}

function insertImg(container, imgUrl) {
    var img = document.createElement('img');
    img.setAttribute('src', imgUrl);
    img.setAttribute('border', '0');
    img.setAttribute('style', 'vertical-align: middle');
    container.appendChild(img);
    return img;
}

function opencloseUpdate() {
    openclose.innerHTML = ''
    ifOpen(function () { insertImg(openclose, chrome.extension.getURL("down.png")); },
	   function () { insertImg(openclose, chrome.extension.getURL("up.png")); });
}

function addStyleLink(href) {
    var head, link;
    head = document.getElementsByTagName('head')[0];
    if (!head) { return; }
    link = document.createElement('link');
    link.type = 'text/css';
    link.rel = 'stylesheet';
    link.media = 'all';
    link.href = href;
    head.appendChild(link);
}

doPopup();

