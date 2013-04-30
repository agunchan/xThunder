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
        if (!agentName) {
            agentName = xThunderPref.getDefaultAgent();
        } 
        var agent = agentName.replace("OffLine", "");
        this.agentName = agent;
        this.offLine = (agent != agentName) || offLine || false;
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
        this.cids.push(this.getCid(url, this.agentName, this.offLine));
    },
    
    callAgent : function() {   
        var result = 0;
        
        if (this.urls.length == this.totalTask && this.totalTask > 0 ) {
            try {
                var exePath,args;
                if (this.xThunderComponent == null) {
                    this.xThunderComponent = Components.classes["@fxthunder.com/component;1"].getService().wrappedJSObject;
                }

                args = [];
                if (this.offLine && (this.agentName != "QQDownload" || xThunderPref.getValue("qqOffLineWeb"))) { 
                    this.agentName = this.agentName.concat("OffLine");
                    exePath = this.getRequestUrl(this.agentName, this.urls[0], args);
                } else if (this.agentName == "DTA") {
                    args.push(xThunderPref.getValue("dtaOneClick"));
                    exePath = null;
                } else if (this.xThunderComponent.detectOS() == "WINNT" && this.agentName.indexOf("custom") == -1) {
                    args.push("-s", xThunderPref.getValue("sleepSecond"));
                    exePath = null;
                } else {
                    args.push(xThunderPref.getUnicodeValue("downloadDir") || this.getDownDir());
                    args.push(xThunderPref.getValue("batEncoding"));

                    if (this.agentName.indexOf("custom") != -1) {
                        args.push(xThunderPref.getUnicodeValue("agent." + this.agentName + ".args"));
                        exePath = xThunderPref.getUnicodeValue("agent." + this.agentName + ".exe");
                    } else {
                        exePath = this.xThunderComponent.getExecutablePath(this.agentName, args);
                    }
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
    
    callCandidate : function() {
        var result = 0;
        
        for (var i in this.candidate.agents) {
            var offLine = this.candidate.agents[i].indexOf("OffLine") != -1;
            var agent = this.candidate.agents[i].replace("OffLine", "");
            var exePath = null;
            var args = [];
            var canUrls = this.candidate.urlArrays[i];
            var canCookies = [];
            var canDecs = [];
            var canCids = [];
            if (canUrls.length > 0) {
                if (this.xThunderComponent == null) {
                    this.xThunderComponent = Components.classes["@fxthunder.com/component;1"].getService().wrappedJSObject;
                }

                if (offLine && (agent != "QQDownload" || xThunderPref.getValue("qqOffLineWeb"))) { 
                    agent = this.candidate.agents[i];   //agent name ends with 'OffLine''
                    exePath = this.getRequestUrl(agent, canUrls[0], args);
                } else {
                    args.push("-silent");
                    exePath = null;
                    for (var j in canUrls) {
                        canCookies.push(this.ARG_DEF_STR);
                        canDecs.push(this.getFileName(canUrls[j]));
                        canCids.push(this.getCid(canUrls[j], agent, offLine));
                    }
                }
                
                result += this.xThunderComponent.CallAgent(agent, canUrls.length, this.referrer, canUrls, canCookies, canDecs, canCids, exePath, args);
                
                this.candidate.taskCount -= canUrls.length;
                this.candidate.urlArrays[i].length = 0; // Clear array to free memory
            }
        }
        
        return result;
    },
    
    getRequestUrl : function(agent, url, args) {
        agent = agent.replace("OffLine", "");
        var reqUrl = xThunderPref.agentsOffLine[agent];
        if (reqUrl) {
            //open built-in offline agent in a new tab
            args.push("--in-background", false);
        } else {
            reqUrl = xThunderPref.getValue("agent." + agent);
            args.push("--in-background", xThunderPref.getValue("agent.requestInBackground", false));
            args.push("--method", "GET");
            args.push("--data", "");
            var user = xThunderPref.getValue("agent." + agent + ".user", "");
            var password = "";
            if (user) {
                password = this.getLoginPassword(agent, user, reqUrl) || this.promptPassword(agent, user);
            }
            args.push("--user", user);
            args.push("--password", password);
            args.push("--callback", this.reqCallBack);
        }
        if (/\[EURL\]/.test(reqUrl)) {
            reqUrl = reqUrl.replace(/\[EURL\]/, encodeURIComponent(url));
        } else {
            reqUrl = reqUrl.replace(/\[URL\]/, url);
        }
        return reqUrl;
    },
    
    getLoginPassword : function(agent, user, reqUrl) {
        var matches;
        if (matches = reqUrl.match(/^https?:\/\/\w+?(:\d+)?\//)) {
            // Find users for the given parameters
            var hostName = matches[0];
            var loginManager = Components.classes["@mozilla.org/login-manager;1"].getService(Components.interfaces.nsILoginManager);
            var logins = loginManager.findLogins({}, hostName, null, agent);
            // Find user from returned array of nsILoginInfo objects
            for (var i = 0; i < logins.length; i++) {
                if (logins[i].username == user) {
                    return logins[i].password;
                }
            }
        }
        
        return "";
    },
    
    promptPassword : function(agent, user) {
        var authUsername = {value: user};
        var authPassword = {value: ""};
        var checkbox = {value: true};
        var title = "xThunder Prompt";
        var stringBundleService = Components.classes["@mozilla.org/intl/stringbundle;1"].getService(Components.interfaces.nsIStringBundleService);
        var textLabel = stringBundleService.createBundle("chrome://global/locale/commonDialogs.properties").formatStringFromName("EnterUserPasswordFor", [agent], 1);
        var checkLabel = stringBundleService.createBundle("chrome://passwordmgr/locale/passwordmgr.properties").GetStringFromName("rememberPassword");
        var prompts = Components.classes["@mozilla.org/embedcomp/prompt-service;1"].getService(Components.interfaces.nsIPromptService);
        var ok = prompts.promptUsernameAndPassword(null, title, textLabel, authUsername, authPassword, checkLabel, checkbox);
        if (ok) {
            xThunderPref.setValue("agent." + agent + ".user", authUsername.value);
            return authPassword.value;
        } else {
            return "";
        }
    },

    reqCallBack : function(agent, url, reqStatus, user, password) {
        agent = agent.replace("OffLine", "");
        var reqUrl = xThunderPref.agentsOffLine[agent] || xThunderPref.getValue("agent." + agent);
        var succeed = (reqStatus == 200);
        if (password) {
            var hostName = reqUrl.match(/^https?:\/\/\w+?(:\d+)?\//)[0];
            var newLogin = Components.classes["@mozilla.org/login-manager/loginInfo;1"].createInstance(Components.interfaces.nsILoginInfo);
            newLogin.init(hostName, null, agent, user, password, "", "");
            var loginManager = Components.classes["@mozilla.org/login-manager;1"].getService(Components.interfaces.nsILoginManager);
            var logins = loginManager.findLogins({}, hostName, null, agent);
            var hasLogin = false;
            for (var i = 0; i < logins.length; i++) {
                if (logins[i].username == user) {
                    //Invalid credentials
                    if (reqStatus == 401 || logins[i].password != password) {
                        loginManager.removeLogin(logins[i]);
                    } 
                    else {
                        hasLogin = true;
                    }
                    break;
                }
            }
            if (succeed && !hasLogin) {
                loginManager.addLogin(newLogin);
            }
        }
        var title = succeed ? "Succeed" : "Failed";
        var text = agent + " adds " + url.substring(0, url.indexOf(":")) + " link ";
        var serverUrl = reqUrl.substring(0, reqUrl.lastIndexOf("/") + 1);
        var alertsService = Components.classes["@mozilla.org/alerts-service;1"].getService(Components.interfaces.nsIAlertsService);
        alertsService.showAlertNotification("chrome://xthunder/skin/icon.png", title, text, true, serverUrl, xThunder, "xThunder Prompt");
    },
    
    observe: function(aSubject, aTopic, aData) {
        switch (aTopic) {
            case "alertclickcallback":
                // Open the webui in the top window
                var args = [];
                args.push("--in-background", false);
                this.xThunderComponent.CallAgent("OffLine", 1, "", [aData], [], [], [], aData, args);
                break;
        }
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
    
    getCid : function(href, agentName, offLine) {
        var cid = this.ARG_DEF_STR;
        if (agentName == "QQDownload") {
            cid = offLine ? "10600" : "0";
        } else if (agentName.indexOf("Thunder") != -1) {
            var matches;
            if (matches = href.match(/^http:\/\/(?:thunder\.ffdy\.cc|www\.7369\.com|bt\.2tu\.cc)\/([0-9A-F]+)\//)) {
                cid = matches[1];
            } else if(matches = href.match(/^http:\/\/ggxxxzzz.com.*\?cid=(.*)/)) {
                cid = matches[1];
            }
        }

        return cid;
    }
};