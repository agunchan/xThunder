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
    candidate : {agents : [], urlArrays : [], taskCount : 0},
    
    // referrer : referrer page[required]
    // url : array of url or single url[required]
    // agentName : agent name[optional]
    // offLine: whether use offline download[optional]
    // RETURN - whether download successfully
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
        return this.callAgent();
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
            this.agentName = xThunderPref.getDefaultAgent();
            this.offLine = false;
        }
        this.filerExtStr = (this.totalTask > 1 && xThunderPref.getValue("filterExt")) 
            ? xThunderPref.getValue("supportExt") : "";
        this.candidate.agents = xThunderPref.getValue("useCandidate") 
            ? xThunderPref.getCandidateAgents(this.agentName) : [];
        for (var i in this.candidate.agents) {
            this.candidate.urlArrays[i] = [];
        }
        this.candidate.taskCount = 0;
    },
    
    addTask : function(url, des) {
        if (url == "" || xThunderPref.invalidReg.test(url)) {
            // Invalid url
            url = this.referrer;
        }
        
        // Nonsupport or filtered url
        if (this.filerExtStr && xThunderPref.uriSupReg.test(url) && !xThunderPref.isExtSupURL(url, this.filerExtStr)) {
            --this.totalTask;
            return;     
        }
        var agentsNonsup = xThunderPref.getUnsupAgents(url);
        if (agentsNonsup.indexOf(this.agentName) != -1) {
            // Use candidate agent to download
            if (this.candidate.agents.length > 0) {
                for (var i in this.candidate.agents) {
                    if (agentsNonsup.indexOf(this.candidate.agents[i]) == -1) {
                        this.candidate.urlArrays[i].push(url);
                        ++this.candidate.taskCount;
                        break;
                    }
                }
            }
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
        var result = 0;
        
        if (this.urls.length == this.totalTask && this.totalTask > 0 ) {
            try {
                if (this.offLine && (this.agentName != "QQDownload" || xThunderPref.getValue("qqOffLineWeb"))) {
                    result = this.callOffLine(this.agentName, this.urls[0]);
                } else {
                    // Normal download
                    var exePath,args;
                    if (this.xThunderComponent == null) {
                        this.xThunderComponent = Components.classes["@fxthunder.com/component;1"].getService().wrappedJSObject;
                    }
                    
                    args = [];
                    if (this.agentName == "DTA") {
                        args.push(xThunderPref.getValue("dtaOneClick"));
                        exePath = null;
                    } else if (this.xThunderComponent.detectOS() != "WINNT" || this.agentName.indexOf("custom") != -1) {
                        args.push(xThunderPref.getUnicodeValue("downloadDir") || this.getDownDir());
                        args.push(xThunderPref.getValue("batEncoding"));
                        if (this.agentName.indexOf("custom") == -1) {
                            exePath = this.xThunderComponent.getExecutablePath(this.agentName, args);
                        } else {
                            args.push(xThunderPref.getUnicodeValue("agent." + this.agentName + ".args"));
                            exePath = xThunderPref.getUnicodeValue("agent." + this.agentName + ".exe");
                        }
                    } else {
                        args.push("-s", xThunderPref.getValue("sleepSecond"));
                        exePath = null;
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
                result = -1;
            } 
        } else if (this.candidate.taskCount <= 0) {
            result = -1;
        }

        if (this.candidate.taskCount > 0) {
            result += this.callCandidate();
        } 

        return result == 0;
    },
    
    callOffLine : function(agentName, url) {
        var result = 0;
        
        var browser = this.getGBrowser();
        var offLineAgents = ["QQDownload", "Thunder", "ThunderVOD"];
        var offIdx = offLineAgents.indexOf(agentName);
        if (browser) {
            var offUrls = ["http://lixian.qq.com/", "http://lixian.vip.xunlei.com/", "http://dynamic.vod.lixian.xunlei.com/"];
            var params = ["main.html?url=", "lixian_login.html?furl=", "play?action=http_sec&go=check&location=home&furl="];
            if (offIdx == 2 && !xThunderPref.getValue("vodMember")) {
                browser.loadOneTab("http://vod.oabt.org/index.php?xunlei", null, "utf-8", this.getVodPostData(url), false); 
            } else {
                browser.selectedTab = browser.addTab(url.indexOf(offUrls[offIdx]) != -1 ? url : offUrls[offIdx] + params[offIdx] + url);  
            }  
        } else {
            result = -1;
        }
        
        return result;
    },
    
    callCandidate : function() {
        var result = 0;
        
        for (var i in this.candidate.agents) {
            var agent = this.candidate.agents[i].replace("OffLine", "");
            var canUrls = this.candidate.urlArrays[i];
            if (canUrls.length > 0) {
                if (agent != this.candidate.agents[i] && (agent != "QQDownload" || xThunderPref.getValue("qqOffLineWeb"))) {
                    result += this.callOffLine(agent, canUrls[0]);
                } else {   
                    if (this.xThunderComponent == null) {
                        this.xThunderComponent = Components.classes["@fxthunder.com/component;1"].getService().wrappedJSObject;
                    }
                    var canCookies = [];
                    var canDecs = [];
                    var canCids = [];
                    var args = [];
                    args.push("-silent");
                    for (var j in canUrls) {
                        canCookies.push(this.ARG_DEF_STR);
                        canDecs.push(this.getFileName(canUrls[j]));
                        canCids.push(this.getCid(canUrls[j]));
                    }
                    result += this.xThunderComponent.CallAgent(agent, canUrls.length, 
                        this.referrer, canUrls, canCookies, canDecs, canCids, null, args); 
                }
                
                this.candidate.taskCount -= canUrls.length;
                canUrls.length = 0;
            }
        }
        
        return result;
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
        } catch(ex) {}

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