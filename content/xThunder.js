var xThunder = {
	xthunderComponent: null,
    DTA : null,
    agentName : null,
    referrer : "",
    urls : [],
    cookies : [],
    descs : [],
    totalTask : 0,

    init : function(referrer, totalTask, agent){
        this.referrer = referrer;
        this.urls = [];
        this.cookies = [];
        this.descs = [];
        this.totalTask = totalTask;
        this.agentName = agent || xThunderPref.getValue("agentName");
    },
	callThunder : function(url, referrer){
        this.init(referrer, 1);
        this.addTask(url);
        this.callAgent();
	},
    callAgent : function(){
        if (this.urls.length != this.totalTask || this.totalTask <= 0) {
            return false;
        }

        try {
            var result;
            if (this.agentName == "DTA") {
                result = this.dtaDownload(this.totalTask, this.referrer, this.urls, this.descs);
            } else if (this.agentName == "BuiltIn") {
                result = this.buitInDownload();
            } else {
                if (this.xthunderComponent == null) {
                    this.xthunderComponent = Components.classes["@lshai.com/xthundercomponent;1"].createInstance()
                                                    .QueryInterface(Components.interfaces.IXThunderComponent);
                }
                result = this.xthunderComponent.CallAgent(this.agentName, this.totalTask, this.referrer, this.urls, this.cookies, this.descs);
            }
            
            if (result >= 0) {
                return true;
            } else {
                alert('Call ' + this.agentName + ' error, please check if it was installed correctly!');
            }
        } catch(ex) {
            alert(ex);
        } 
        
        return false;
	},
	getCookie : function(href){
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
    getFileName : function(href) {
        try {
            var names = href.split("?")[0].split("/");
            href = names[names.length-1];
            if (href == "" || href == "#")
                href = "index.html";
            else
                href = decodeURIComponent(href);
        }
        catch(e) {}

        return href;
    },
	addTask : function(url, des){
        if (url == null) {
            return; //for async method
        } else if (url == "" 
            || url.indexOf("javascript:") == 0
            || url.indexOf("data:image") == 0
            || xThunderPref.isAgentNonsupURL(this.agentName, url)) {
            --this.totalTask;
            return;
        } 

        this.urls.push(url);
        this.cookies.push(this.getCookie(url));
        if (this.totalTask == 1) {
            des = "";
        } else if (!des) {
            des = this.getFileName(url);
        }
        this.descs.push(des);
	},

    dtaDownload : function(totalTask, refer, urls, descs) {
        var wm = Components.classes["@mozilla.org/appshell/window-mediator;1"]
                            .getService(Components.interfaces.nsIWindowMediator);
        var mainWindow = wm.getMostRecentWindow("navigator:browser");
        if (!this.DTA) {
            if (typeof DTA != "undefined") {
                this.DTA = DTA;
            } else if (mainWindow.DTA) {
                this.DTA = mainWindow.DTA;
            } 
        }

        if (!this.DTA) {
            return -1;
        }

        if (totalTask == 1 && this.DTA.saveSingleLink) {
            this.DTA.saveSingleLink(mainWindow, false, urls[0], refer, descs[0]);
        } else if(totalTask > 1 && this.DTA.saveLinkArray) {
            var anchors = [], images = [];
            var wrapURL = function(url, cs) { return new this.DTA.URL(this.DTA.IOService.newURI(url, cs, null)); }
            for (var j=0; j<totalTask; ++j) {
                anchors.push({
                    url: wrapURL(urls[j], "UTF-8"),
                    description: descs[j],
                    ultDescription: "",
                    referrer: refer,
                    fileName: ""
                })
            }
            this.DTA.saveLinkArray(mainWindow, anchors, images);
        }

        return 0;
    },

    buitInDownload : function() {
        return 0;
    }
};