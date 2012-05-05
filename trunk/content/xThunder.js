var xThunder = {
    ARG_DEF_STR : "",
    xThunderComponent: null,
    agentName : "",
    referrer : "",
    urls : [],
    cookies : [],
    descs : [],
    cids : [],
    totalTask : 0,
    offLine : false,
    filerExtStr : "",
    
    // referrer : referrer page[required]
    // url : array of url or single url[required]
    // agentName[optional]
    // offLine[optional]
    apiDownUrl : function(referrer, url, agentName, offLine) {
        var isUrlArray = Object.prototype.toString.call(url) === '[object Array]';
        var totalTask = isUrlArray ? url.length : 1;
        this.init(referrer, totalTask, agentName, offLine);
        if (isUrlArray) {
            for (var i in url) {
                this.addTask(url[i]);
            }
        } else {
            this.addTask(url);
        }
        this.callAgent();
    },

    init : function(referrer, totalTask, agentName, offLine) {
        this.referrer = referrer || this.ARG_DEF_STR;
        this.urls = [];
        this.cookies = [];
        this.descs = [];
        this.cids = [];
        this.totalTask = totalTask;
        if (agentName) {
            var agent = agentName.replace("OffLine", "");
            this.agentName = agent;
            this.offLine = (agent != agentName) || offLine || false;
        } else {
            this.agentName = xThunderPref.getValue("agentName");
            this.offLine = false;
        }
        this.filerExtStr = (totalTask > 1 && xThunderPref.getValue("filterExt")) 
            ? xThunderPref.getValue("supportExt") : "";
    },
    
    addTask : function(url, des) {
        if (url == "" || xThunderPref.invalidReg.test(url)) {
            // Invalid url
            url = this.referrer;
        }
        
        // Nonsupport or filtered url
        var agentsNonsup = xThunderPref.getAgentsNonsupURL(url);
        if (agentsNonsup.indexOf(this.agentName) != -1 || 
            agentsNonsup.length == 0 && this.filerExtStr && !xThunderPref.isExtSupURL(url, this.filerExtStr)) {
            --this.totalTask;
            return;
        }

        this.urls.push(url);
        this.cookies.push(this.getCookie(url));
        if (this.totalTask == 1) {
            des = this.ARG_DEF_STR;
        } else if (!des) {
            des = this.getFileName(url);
        } else {
            des = des.replace(/^\s+|\s+$|[\r\n]+/g,"");
        }
        this.descs.push(des);
        this.cids.push(this.getCid(url));
    },
    
    callAgent : function() {
        if (this.urls.length != this.totalTask || this.totalTask <= 0) {
            return false;
        }

        try {
            var browser;
            var offLineAgents = ["QQDownload", "Thunder", "ThunderVOD"];
            var offIdx = offLineAgents.indexOf(this.agentName);
            if ( (offIdx == 0 && xThunderPref.getValue("qqOffLineWeb") || offIdx > 0) && 
                this.offLine && this.totalTask == 1 && (browser = this.getGBrowser())) {
                // OffLine download in web page
                var offUrls = ["http://lixian.qq.com/", "http://lixian.vip.xunlei.com/", "http://dynamic.vod.lixian.xunlei.com/"];
                var params = ["main.html?url=", "lixian_login.html?furl=", "play?action=http_sec&go=check&location=home&furl="];
                if (offIdx == 2 && !xThunderPref.getValue("vodMember")) {
                    browser.loadOneTab("http://vod.oabt.org/index.php?xunlei", null, "utf-8", this.getVodPostData(this.urls[0]), false); 
                } else {
                    browser.selectedTab = browser.addTab(this.urls[0].indexOf(offUrls[offIdx]) != -1 
                        ? this.urls[0] : offUrls[offIdx] + params[offIdx] + this.urls[0]);  
                }  
            } else {
                // Normal download
                var result,exePath,args;
                if (this.xThunderComponent == null) {
                    this.xThunderComponent = Components.classes["@fxthunder.com/component;1"].getService().wrappedJSObject;
                }

                args = [];
                if (this.agentName == "DTA") {
                    exePath = null;
                    args.push(xThunderPref.getValue("dtaOneClick"));
                } else if (this.agentName.indexOf("custom") != -1) {
                    exePath = xThunderPref.getUnicodeValue("agent." + this.agentName + ".exe");
                    args.push(xThunderPref.getUnicodeValue("downloadDir") || this.getDownDir());
                    args.push(xThunderPref.getValue("batEncoding"));
                    args.push(xThunderPref.getUnicodeValue("agent." + this.agentName + ".args"));
                } else {
                    exePath = null;
                    args.push("-s", xThunderPref.getValue("sleepSecond"));
                }

                result = this.xThunderComponent.CallAgent(this.agentName, this.totalTask, this.referrer, this.urls, this.cookies, this.descs, this.cids, exePath, args);       
                switch(result) {
                    case this.xThunderComponent.COM_NOT_FOUND:
                        alert("xThunder.exe missing, please check if xThunder was unpacked!");
                        break;
                    case this.xThunderComponent.DTA_NOT_FOUND:
                        alert("Call DTA error, please check if DTA was properly installed!");
                        break;
                    case this.xThunderComponent.EXE_NOT_FOUND:
                        alert(exePath + " missing, please check if it was properly installed!");
                        break;
                }

                // Clear array to free memory
                this.urls.length = this.cookies.length = this.descs.length = this.cids.length = this.totalTask = 0;
            }
        } catch(ex) {
            alert(ex);
            return false;
        } 
        
        return true;
    },
    
    getDownDir : function() {
        var downloadDir;
        var fp = Components.classes["@mozilla.org/filepicker;1"].createInstance(Components.interfaces.nsIFilePicker);
        var wm = Components.classes["@mozilla.org/appshell/window-mediator;1"].getService(Components.interfaces.nsIWindowMediator);
        var mainWindow = wm.getMostRecentWindow(null);
        fp.init(mainWindow, "xThunder - Select download directory", Components.interfaces.nsIFilePicker.modeGetFolder);

        if (fp.show() == Components.interfaces.nsIFilePicker.returnOK) {
            downloadDir = fp.file.path;
        } else {
            var file = Components.classes["@mozilla.org/file/directory_service;1"].getService(Components.interfaces.nsIProperties).
                get("Home", Ci.nsIFile);
            file.append("Downloads");
            downloadDir = file.path;
        }
        
        xThunderPref.setUnicodeValue("downloadDir", downloadDir);
        return downloadDir;
    },
    
    getGBrowser : function() {
        if (typeof gBrowser != "undefined") {
            return gBrowser;
        } else {
            var wm = Components.classes["@mozilla.org/appshell/window-mediator;1"].
                getService(Components.interfaces.nsIWindowMediator);
            var mainWindow = wm.getMostRecentWindow("navigator:browser");
            return mainWindow ? mainWindow.gBrowser : null;
        }
    },
    
    getCookie : function(href){
        var strCookie;
        
        try {
            if (/^https?:\/\//i.test(href)) {
                var uri = Components.classes["@mozilla.org/network/standard-url;1"].createInstance(Components.interfaces.nsIURI);
                uri.spec = href;
                strCookie = Components.classes["@mozilla.org/cookieService;1"].getService(Components.interfaces.nsICookieService).
                    getCookieString(uri, null);
            }
        } catch(ex) {}
		
        if (!strCookie) {
            strCookie = this.ARG_DEF_STR;
        }
        return strCookie;
    },
    
    getFileName : function(href) {
        var fileName = "index.html";
        try {
            var matches;
            if (xThunderPref.uriSupReg.test(href)) {
                var names = href.split("?")[0].split("#")[0].split("/");
                fileName = names[names.length-1];
                if (fileName != "") {
                    fileName = decodeURIComponent(fileName);
                }
            } else if(matches = href.match(/^ed2k:\/\/\|file\|(.*?)\|\d/)) {
                fileName = decodeURIComponent(matches[1]);
            } else {
                fileName = href.split(":")[0];
            }
        }
        catch(ex) {}

        return fileName;
    },
    
    getCid : function(href) {
        var cid = this.ARG_DEF_STR;
        if (this.agentName == "QQDownload") {
            cid = this.offLine ? "10600" : "0";
        } else if (this.agentName.indexOf("Thunder") != -1) {
            var matches;
            if (matches = href.match(/^http:\/\/(?:thunder\.ffdy\.cc|www\.7369\.com|bt\.2tu\.cc)\/([0-9A-F]+)\//)) {
                cid = matches[1];
            } else if(matches = href.match(/^http:\/\/ggxxxzzz.com.*\?cid=(.*)/)) {
                cid = matches[1];
            }
        }

        return cid;
    },
    
    getVodPostData : function(href) {
        var dataString = "url=" + encodeURIComponent(href) + 
            "&title=" + encodeURIComponent(this.getFileName(href));
        var stringStream = Components.classes["@mozilla.org/io/string-input-stream;1"].
            createInstance(Components.interfaces.nsIStringInputStream);
        stringStream.data = dataString;
        var postData = Components.classes["@mozilla.org/network/mime-input-stream;1"].
            createInstance(Components.interfaces.nsIMIMEInputStream);
        postData.addHeader("Content-Type", "application/x-www-form-urlencoded");
        postData.addContentLength = true;
        postData.setData(stringStream);
        return postData;
    }
};