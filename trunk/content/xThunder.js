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
        if (this.urls.length != this.totalTask) {
            return false;
        }

        try {
            var result;
            if (this.agentName == "DTA") {
                result = this.dtaDownload();
            } else if (this.agentName == "BuiltIn") {
                result = 0;
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
                alert('Call ' + this.agentName + ' COM error, please check the registry or run as administrator!');
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
        catch(e) {
            //no op
        }

        return href;
    },
    canDownload : function(agentName, url) {
        return agentName == "Thunder" || agentName == "ToolbarThunder" || agentName == "QQDownload"
                || /^(ftp|https?):\/\//i.test(url);
    },
	addTask : function(url, des){
        if (url == null) {
            return; //for async method
        } else if (url == "" || url.indexOf("javascript:") != -1
            || !this.canDownload(this.agentName, url)){
            --this.totalTask;
            return;
        }

        this.urls.push(url);
        this.cookies.push(this.getCookie(url));
        this.descs.push(des ? des : this.getFileName(url));
	},

    dtaDownload : function() {
        var wm = Components.classes["@mozilla.org/appshell/window-mediator;1"]
                            .getService(Components.interfaces.nsIWindowMediator);
        var mainWindow = wm.getMostRecentWindow("navigator:browser");
        if (!this.DTA) {
            if (mainWindow.DTA) {
                this.DTA = mainWindow.DTA;
            } else {
                this.DTA = {};
                Components.utils.import("resource://dta/api.jsm", this.DTA);
            }
        }

        if (this.totalTask == 1 && this.DTA.saveSingleLink) {
            this.DTA.saveSingleLink(mainWindow, false, this.urls[0], this.referrer, this.descs[0]);
        } else if(this.totalTask > 1 && this.DTA.saveLinkArray) {
            var anchors = [], images = [];
            var wrapURL = function(url, cs) { return new this.DTA.URL(this.DTA.IOService.newURI(url, cs, null)); }
            for (var j=0; j<this.totalTask; ++j) {
                anchors.push( {
                    url: wrapURL(this.urls[j], "UTF-8"),
                    description: this.descs[j],
                    ultDescription: "",
                    referrer: this.referrer,
                    fileName: ""
                })
            }
            this.DTA.saveLinkArray(mainWindow, anchors, images);
        }

        return 0;
    }
};