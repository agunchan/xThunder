var xThunder = {
	strSplitter : "#@$@#",
	g_thunderComponent: null,
    referrer : "",
    strUrls : "",
    urlCount : 0,
    totalTask : 0,

    init : function(referrer, totalTask){
        this.referrer = referrer;
        this.strUrls = "";
        this.urlCount = 0;
        this.totalTask = totalTask;
    },
	callThunder: function(url, referrer){
        this.init(referrer, 1);
        this.addTask(url);
        this.callAgent();
	},
    callAgent: function(){
        if (this.urlCount != this.totalTask) {
            return false;
        }

        //String Format: referrer + "#@$@#" + urlCount + "#@$@#" +
        //               urlCount * (url + "#@$@#" + name + "#@$@#" + cookie + "#@$@#")
        var paramStr = this.referrer.concat(this.strSplitter, this.urlCount, this.strSplitter, this.strUrls)
        if (this.g_thunderComponent == null) {
            this.g_thunderComponent = Components.classes["@thunder.com/thundercomponent;1"].createInstance()
                                                .QueryInterface(Components.interfaces.IThunderComponent);
        }
        var n = this.g_thunderComponent.CallThunder(paramStr, "1", 0, this.urlCount > 1);
        return n == 1;
	},
	getCookie: function(href){
		var uri = Components.classes["@mozilla.org/network/standard-url;1"].createInstance(Components.interfaces.nsIURI);
		uri.spec = href;
		var strCookie = Components.classes["@mozilla.org/cookieService;1"]
				.getService(Components.interfaces.nsICookieService)
				.getCookieString(uri, null);
		if (strCookie == null) {
			strCookie = "null";
		}
		return strCookie;
	},
	addTask: function(url){
        if (url == null) {
            return; //for aync method
        } else if (url == "" || url.indexOf("javascript:") != -1){
            --this.totalTask;
            return;
        }

        ++this.urlCount;
        //BUG For ThunderComponent.dll, url max length is 1024
        this.strUrls = this.strUrls.concat(url.length <= 1024 ? url : url.substring(0, 1023),
            this.strSplitter, "", this.strSplitter, this.getCookie(url), this.strSplitter);
	}
}