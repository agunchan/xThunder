var xThunder = {
	thunderComponent: null,
    referrer : "",
    urls : [],
    cookies : [],
    totalTask : 0,

    init : function(referrer, totalTask){
        this.referrer = referrer;
        this.urls = [];
        this.cookies = [];
        this.totalTask = totalTask;
    },
	callThunder: function(url, referrer){
        this.init(referrer, 1);
        this.addTask(url);
        this.callAgent();
	},
    callAgent: function(){
        if (this.urls.length != this.totalTask) {
            return false;
        }

        try {
            if (this.thunderComponent == null) {
                this.thunderComponent = Components.classes["@thunder.com/thundercomponent;1"].createInstance()
                                                    .QueryInterface(Components.interfaces.IThunderComponent);
            }

            var agentName = xThunderPref.getValue("agentName", "Thunder");
            var n = this.thunderComponent.CallAgent(agentName,this.totalTask, this.referrer, this.urls, this.cookies);
            if (n >= 0) {
                return true;
            } else {
                alert('Call ' + agentName + ' COM error, please check the registry or run as administrator!');
            }
        } catch(ex) {
            alert(ex);
        } 
        
        return false;
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
            return; //for async method
        } else if (url == "" || url.indexOf("javascript:") != -1){
            --this.totalTask;
            return;
        }

        this.urls.push(url);
        this.cookies.push(this.getCookie(url));
	}
}