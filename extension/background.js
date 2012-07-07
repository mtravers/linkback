// good christ is this unnecessarily hairy.

chrome.extension.onMessage.addListener(
    function(request, sender, sendResponse) {
	console.log(sender.tab ?
                    "from a content script:" + sender.tab.url :
                    "from the extension");
	if (request.cmd == "isOpen")
	    sendResponse((localStorage.getItem('linkback_open') == "true"));
	else if (request.cmd == "setOpen") {
	    var nv = request.value;
	    localStorage.setItem('linkback_open', nv);
	    sendResponse("set");
	} else if (request.cmd == "switchOpen") {
	    var nv = !(localStorage.getItem('linkback_open') == "true");
	    localStorage.setItem('linkback_open', nv);
	    sendResponse(nv);
	}
    });
