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
        downloadItem.setAttribute("hidden", !xThunderDownReg.test(selText));
    }
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