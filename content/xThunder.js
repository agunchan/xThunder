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
                window.setTimeout(this.buitInDownload, 100, this.totalTask, this.referrer, this.urls, this.descs);
                result = 0;
            } else {
                if (this.xthunderComponent == null) {
                    this.xthunderComponent = Components.classes["@lshai.com/xthundercomponent;1"].createInstance()
                                                    .QueryInterface(Components.interfaces.IXThunderComponent);
                } 
                result = this.xthunderComponent.CallAgent(this.agentName, this.totalTask, this.referrer, this.urls, this.cookies, this.descs);
            }

            //BUG: it causes failure when calling FlashGet3 addAll first time, so try it again
            if (result < 0 && this.agentName == "FlashGet3") {
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
            var wrapURL = function(url, cs) {return new this.DTA.URL(this.DTA.IOService.newURI(url, cs, null));}
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

    buitInDownload : function(totalTask, refer, urls, descs) {
        var CC = Components.classes;
        var CI = Components.interfaces;

        var IOService = CC["@mozilla.org/network/io-service;1"].getService(CI.nsIIOService);

        var dType = CI.nsIDownloadManager.DOWNLOAD_TYPE_DOWNLOAD;
        var persistFlags = CI.nsIWebBrowserPersist.PERSIST_FLAGS_AUTODETECT_APPLY_CONVERSION |
            CI.nsIWebBrowserPersist.PERSIST_FLAGS_FROM_CACHE;
        var now = Date.now() * 1000;
        var dm = CC["@mozilla.org/download-manager;1"].getService(CI.nsIDownloadManager);

        var referrerURI = IOService.newURI(refer, "UTF-8", null);
        for(var j=0; j<totalTask; ++j) {
            var persist = CC["@mozilla.org/embedding/browser/nsWebBrowserPersist;1"].createInstance(CI.nsIWebBrowserPersist);
            var sourceURI = IOService.newURI(urls[j], "UTF-8", null);
            var file = CC["@mozilla.org/file/local;1"].createInstance(CI.nsILocalFile);
            file.initWithPath("E:\\download\\" + xThunder.getFileName(urls[j]));
            if (file.exists()) {
                //rename file
                while (true) {
                    if(!file.exists()) {
                        file.create(0, 0644);
                        break;
                    } else { // rename
                        var m = file.leafName.match(/(.*?)(?:\((\d+)\))?(\.[^\.]+$|$)/);
                        file.leafName = m[1] + "(" + ((m[2] && parseInt(m[2]) || 0) + 1) + ")" + m[3];
                    }
                }
            }
            var targetURI = IOService.newFileURI(file);
            persist.persistFlags = persistFlags;
            persist.progressListener = dm.addDownload(dType, sourceURI, targetURI, descs[j], null, now, null, persist);
            persist.saveURI(sourceURI, null, referrerURI, null, null, targetURI);
        }

        var dmui = CC["@mozilla.org/download-manager-ui;1"].getService(CI.nsIDownloadManagerUI);
        dmui.show();
        return 0;
    }
};