addClickSupport();

//////////////////////////////////////////////////////////////
//	Event handler,require xThunder.js
////////////////////////////////////////////////////////////
function OnThunderContextMenu(event)
{
    var downloadItem = document.getElementById("ThunderDownload");

    if (gContextMenu.onLink)
    {
    	downloadItem.setAttribute("hidden", -1 != gContextMenu.link.toString().indexOf("javascript:"));
    }
    else if (gContextMenu.onImage)
    {
        downloadItem.setAttribute("hidden", false);
    }
    else
    {
        var selText = document.commandDispatcher.focusedWindow.getSelection().toString();
        downloadItem.setAttribute("hidden", ! /(ftp|https?|thunder|flashget|qqdl|fs2you|ed2k|magnet):/i.test(selText));
    }
}

function OnThunderDownload(event)
{
    var htmlDocument = document.commandDispatcher.focusedWindow.document;
	var referrer = htmlDocument.URL;

    var url;
    if (gContextMenu.onLink)
    {
        // Get current link URL
        url = getDecodedNode(gContextMenu.target, htmlDocument);
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
        if (/(ftp|https?|thunder|flashget|qqdl|fs2you|ed2k|magnet):/i.test(url))
        {
            url = getDecodedUrl(url);
        }
        else
        {
            return;
        }
    }

	xThunder.callThunder(url, referrer);
}

function OnThunderDownloadAll(event)
{
	// Get current page URL
    var htmlDocument = document.commandDispatcher.focusedWindow.document;
	var referrer = htmlDocument.URL;
    var url;
	
	// Get all links and all image count
	var links = htmlDocument.links;
	var images = htmlDocument.images;
	var linkCount = links.length;
	var imageCount = images.length;
    var allCount = linkCount + imageCount;
	var thunderStr = "";
	
	for (var i=0; i<linkCount; i++)
	{
		if (-1 != links[i].href.indexOf("javascript:"))
		{
            --allCount;
			continue;
		}

        url = getDecodedNode(links[i], htmlDocument);
		thunderStr = thunderStr.concat(xThunder.constructString(url));
	}
	
	for (i=0; i<imageCount; i++)
	{
		url = images[i].src;
		thunderStr = thunderStr.concat(xThunder.constructString(url));
	}
	xThunder.batchThunder(thunderStr, referrer, allCount);
}