///////////////////////////////////////////////////////////////////
//	Event handler,require xThunder.js,prefs.js,decode.js
///////////////////////////////////////////////////////////////////


addClickSupport();

function addClickSupport(ev) {
    if (xThunderPref.getValue("supportClick") != "" ||
        xThunderPref.getValue("supportExt") != "" && xThunderPref.getValue("remember")) {

        var win = window.gBrowser || window;
        win.addEventListener("click", function(ev) {
            if (ev.button != 0 || ev.shiftKey) {
                return true;
            }

            if (ev.altKey && xThunderPref.getValue("altNoMonitor")) {
                return true;
            }

            var remExt = xThunderPref.getValue("remember");
            if (ev.ctrlKey && xThunderPref.getValue("ctrlNoMonitor"))
            {
                //remember value is 0:never down, 1: auto down, -1: no down this time
                if (remExt == 1) {
                    xThunderPref.setValue('remember', -1);
                }
                return true;
            } else {
                if (remExt == -1) {
                    xThunderPref.setValue('remember', 1);
                }
            }

            var link = ev.target;
            if (!link.href && !xThunderDownReg.test(link.name)) {
                link = link.parentNode;
                if (!link || !link.href)
                    return true;
            }

            var url = link.href || link.name;
            var referrer = link.ownerDocument.URL;
            var download = false;

            //click support for associated file
            var supExt = xThunderPref.getValue("supportExt");
            if (remExt && supExt != "") {
                var subUrls = url.split("?");
                var matches = subUrls[0].match(/(?:ftp|https?):\/\/.*(\.\w+)/i);
                if (matches) {
                    if (supExt.indexOf(matches[1] + ";") != -1) {
                        url = subUrls[0];
                        download = true;
                    } else if (matches[1].indexOf("htm") == -1 && subUrls.length > 1){
                        var subParams = subUrls[1].split("&");
                        for (var j=0; j<subParams.length; ++j) {
                            matches = subParams[j].match(/.*(\.\w+)/i);
                            if (matches && supExt.indexOf(matches[1] + ";") != -1) {
                                //url is link.href or link.name
                                download = true;
                                break;
                            }
                        }
                    }
                }
            }

            //click support for protocals
            var supstr = xThunderPref.getValue("supportClick");
            if (!download && supstr != "") {
                var protocals = supstr.split(",");
                var contextmenu;
                for (var i=0; i<protocals.length-1; ++i) {
                    if (protocals[i] == "thunder" &&
                            (url.indexOf("thunder:") == 0 ||
                            link.getAttribute("thunderhref") ||
                            (contextmenu = link.getAttribute("oncontextmenu")) && contextmenu.indexOf("ThunderNetwork_SetHref") != -1)
                     || protocals[i] == "flashget" &&
                            (url.indexOf("flashget:") == 0 ||
                            link.getAttribute("fg") ||
                            (contextmenu = link.getAttribute("oncontextmenu")) && contextmenu.indexOf("Flashget_SetHref") != -1)
                     || protocals[i] == "qqdl" &&
                            (url.indexOf("qqdl:") == 0 ||
                            link.getAttribute("qhref"))
                     || protocals[i] == "ed2k" && url.indexOf("ed2k:") == 0
                     || protocals[i] == "magnet" && url.indexOf("magnet:") == 0
                     || protocals[i] == "fs2you" && url.indexOf("fs2you:") == 0
                     || protocals[i] == "115" && url.indexOf("http://u.115.com/file/") == 0
                     || protocals[i] == "udown" &&
                            link.id == "udown" && (contextmenu = link.getAttribute("onclick")) && contextmenu.indexOf("AddDownTask") != -1
                    ) {
                        url = getDecodedNode(link);
                        download = true;
                        break;
                    }
                }
            }

            //download url by thunder
            if (download) {
                xThunder.callThunder(url, referrer);
                ev.preventDefault();
                ev.stopPropagation();
                return false;
            } else {
                return true;
            }
        }, true);
    }
}

function OnThunderContextMenu(event)
{
    var downloadItem = document.getElementById("ThunderDownload");
    var downloadAllItem = document.getElementById("ThunderDownloadAll");
    var sepItem = document.getElementById("ThunderDownloadUp");

    if (!xThunderPref.getValue("downInCxtMenu")) {
        //Hide downlad in context menu
        downloadItem.setAttribute("hidden", true);
    } else {
        //Show download in context menu
        if (gContextMenu.onLink)
        {
            var link = gContextMenu.target;
            downloadItem.setAttribute("hidden", -1 != gContextMenu.link.toString().indexOf("javascript:")
                && !(link.id == "udown" && (link = link.getAttribute("onclick")) && link.indexOf("AddDownTask") != -1));
        }
        else if (gContextMenu.onImage)
        {
            downloadItem.setAttribute("hidden", false);
        }
        else
        {
            var selText = document.commandDispatcher.focusedWindow.getSelection().toString();
            downloadItem.setAttribute("hidden", !xThunderDownReg.test(selText));
        }
    }

    downloadAllItem.setAttribute("hidden", !xThunderPref.getValue("downAllInCxtMenu"));
    sepItem.setAttribute("hidden", downloadItem.getAttribute("hidden") == "true" && downloadAllItem.getAttribute("hidden") == "true");
}

function OnThunderDownload(event)
{
    var htmlDocument = document.commandDispatcher.focusedWindow.document;
    var url;
    
    if (gContextMenu.onLink)
    {
        // Get current link URL
        url = getDecodedNode(gContextMenu.target);
    }
    else if (gContextMenu.onImage)
    {
        // Get current image url
        url = gContextMenu.target.src;
    }
    else
    {
        // Get selected url
        url = document.commandDispatcher.focusedWindow.getSelection().toString();
        if (xThunderDownReg.test(url))
        {
            url = getDecodedUrl(url);
        }
        else
        {
            return;
        }
    }

    xThunder.callThunder(url, htmlDocument.URL);
}

function OnThunderDownloadAll(event)
{
	// Get current page URL
    var htmlDocument = document.commandDispatcher.focusedWindow.document;
    var url;
	
	// Get all links and all image count
	var links = htmlDocument.links;
	var images = htmlDocument.images;
	var linkCount = links.length;
	var imageCount = images.length;

    xThunder.init(htmlDocument.URL, linkCount+imageCount);

	for (var i=0; i<linkCount; ++i)
	{
        url = getDecodedNode(links[i]);
        xThunder.addTask(url);
	}
	
	for (var j=0; j<imageCount; ++j)
	{
		url = images[j].src;
		xThunder.addTask(url);
	}

	xThunder.callAgent();
}