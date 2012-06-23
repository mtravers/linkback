// var server = 'http://linkback.herokuapp.com';
var server = 'http://localhost:1666';

function makeQueryUrl(pageUrl) {
    return server + '/linkback.html?page=' + encodeURI(pageUrl);
}

function doNotify() {
    var pageUrl = document.location.href;
    if (pageUrl.search(server) == -1) { // don't recurse
	var center = window.webkitNotifications;
	if (center.checkPermission() != 0) {
	    alert("Please enable webkit notifications!");
	}
	center.createHTMLNotification(makeQueryUrl(pageUrl)).show();
    }
}

doNotify();

