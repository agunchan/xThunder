var xThunder = {
	strSplitter: "#@$@#",
	g_thunderComponent: null,
	
	callThunder: function(url, referrer){
        xThunder.batchThunder(xThunder.constructString(url), referrer, 1);
	},
    batchThunder: function(strUrls, referrer, linkCount){
        //String Format: referrer + "#@$@#" + linkCount +
        //               linkCount * (url + + "#@$@#" + name + "#@$@#" + cookie + "#@$@#")
        strUrls = referrer.concat(xThunder.strSplitter, linkCount,
                                xThunder.strSplitter, strUrls)
        try
        {
            if (xThunder.g_thunderComponent == null)
            {
                xThunder.g_thunderComponent = Components.classes["@thunder.com/thundercomponent;1"].createInstance()
                                                    .QueryInterface(Components.interfaces.IThunderComponent);
            }
            var n = xThunder.g_thunderComponent.CallThunder(strUrls, "1", 0, linkCount > 1);
            return n == 1;
        }
        catch(err)
        {
            return false;
        }
	},
	getCookie: function(href){
		var uri=Components.classes["@mozilla.org/network/standard-url;1"].createInstance(Components.interfaces.nsIURI);
		uri.spec = href;
		var strCookie = Components.classes["@mozilla.org/cookieService;1"]
				.getService(Components.interfaces.nsICookieService)
				.getCookieString(uri, null);
		if (strCookie == null)
		{
			strCookie = "null";
		}
		return strCookie;
	},
	constructString: function(url) {
		return url.concat(xThunder.strSplitter, "",
                        xThunder.strSplitter, xThunder.getCookie(url), xThunder.strSplitter);
	}
}