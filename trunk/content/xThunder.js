var xThunder = {
    EXE_PATH : "chrome://xthunder/content/xThunder.exe",
    DEF_STR : "",
    xthunderComponent: null,
    agentName : "",
    referrer : "",
    urls : [],
    cookies : [],
    descs : [],
    cids : [],
    totalTask : 0,
    offLine : false,
    filerExtStr : "",

    init : function(referrer, totalTask, agentName, offLine){
        this.referrer = referrer;
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
            if (this.xthunderComponent == null) {
                this.xthunderComponent = Components.classes["@fxthunder.com/component;1"].getService().wrappedJSObject;
            }
            
            var result,browser,args;
             if ((this.agentName == "Thunder" || this.agentName=="QQDownload" && xThunderPref.getValue("qqOffLineWeb")) 
                 && this.offLine && this.totalTask == 1 && (browser = this.getGBrowser())) {
                var offUrls = ["http://lixian.vip.xunlei.com/", "http://lixian.qq.com/"];
                var params = ["lixian_login.html?furl=", "main.html?url="];
                var i = this.agentName == "Thunder" ? 0 : 1;
                browser.selectedTab = browser.addTab(this.urls[0].indexOf(offUrls[i]) != -1 
                                                   ? this.urls[0] : offUrls[i] + params[i] + this.urls[0]);
                result = true;
            } else if (this.agentName == "DTA") {
                args = xThunderPref.getValue("dtaOneClick");
                result = this.xthunderComponent.callAgent(this.agentName, this.totalTask, this.referrer, this.urls, this.cookies, this.descs, null, args);
            } else {
                args = this.createJobFile();
                result = this.xthunderComponent.callAgent(this.agentName, this.totalTask, this.referrer, this.urls, this.cookies, this.descs, this.EXE_PATH, args);
            }

            switch(result) {
                case this.xthunderComponent.EXE_NOT_FOUND:
                    alert("xThunder.exe missing, please check if xThunder was properly installed!");
                    break;
                case this.xthunderComponent.DTA_NOT_FOUND:
                    alert("DTA called error, please check if DTA was properly installed!");
                    break;
                default:
                    return true;
            }
        } catch(ex) {
            alert(ex);
        } 
        
        return false;
	},
    getGBrowser : function() {
        if (typeof gBrowser != "undefined") {
            return gBrowser;
        } else {
            var wm = Components.classes["@mozilla.org/appshell/window-mediator;1"]
                            .getService(Components.interfaces.nsIWindowMediator);
            var mainWindow = wm.getMostRecentWindow("navigator:browser");
            return mainWindow ? mainWindow.gBrowser : null;
        }
    },
    createJobFile : function() {
        var file = Components.classes["@mozilla.org/file/directory_service;1"]
                .getService(Components.interfaces.nsIProperties)
                .get("TmpD", Components.interfaces.nsIFile);
        file.append("xThunder");
        if (!file.exists()) {
            file.create(1, 0700);
        }
        file.append("xThunder" + Date.now() + ".xtd");
        file.createUnique(Components.interfaces.nsIFile.NORMAL_FILE_TYPE, 0700);
        
        var jobLines = [];
        for (var j = 0; j < this.totalTask; ++j) {
            jobLines.push(this.urls[j], this.cookies[j], this.descs[j], this.cids[j]);
        }
        var job = jobLines.join("\n");
        
        var data = xThunderPref.getValue("downDir") + "\n"
                + this.referrer + "\n" + job + "\n"; 
        var foStream = Components.classes["@mozilla.org/network/file-output-stream;1"]
                       .createInstance(Components.interfaces.nsIFileOutputStream);
        foStream.init(file, 0x02 | 0x08 | 0x20, 0700, 0);
        var converter = Components.classes["@mozilla.org/intl/converter-output-stream;1"]
                        .createInstance(Components.interfaces.nsIConverterOutputStream);
        converter.init(foStream, "UTF-8", 0, 0);
        converter.writeString(data);
        converter.close(); // this closes foStream

        var args = [];
        args.push("-a", this.agentName);
        args.push("-p", file.path);
        args.push("-n", this.totalTask);
        args.push("-s", xThunderPref.getValue("sleepSecond"));
        return args;
    },
	getCookie : function(href){
        var strCookie;

        try {
            if (/^https?:\/\//i.test(href)) {
                var uri = Components.classes["@mozilla.org/network/standard-url;1"].createInstance(Components.interfaces.nsIURI);
                uri.spec = href;
                strCookie = Components.classes["@mozilla.org/cookieService;1"].getService(Components.interfaces.nsICookieService)
                        .getCookieString(uri, null);
            }
        } catch(ex) {}
		
		if (!strCookie) {
			strCookie = this.DEF_STR;
		}
		return strCookie;
	},
    getFileName : function(href) {
        var fileName = "index.html";
        try {
            if (xThunderPref.uriSupReg.test(href)) {
                var names = href.split("?")[0].split("#")[0].split("/");
                fileName = names[names.length-1];
                if (fileName != "") 
                    fileName = decodeURIComponent(fileName);
            } else {
                fileName = href.split(":")[0];
            }
        }
        catch(ex) {}

        return fileName;
    },
    getCid : function(href) {
        var cid = this.DEF_STR;
        if (this.agentName == "QQDownload" && this.offLine) {
            cid = 10600;
        } else if (this.agentName.indexOf("Thunder") != -1) {
            var matches;
            if (matches = href.match(/^http:\/\/(?:thunder\.ffdy\.cc|www\.7369\.com|bt\.xunbo\.cc)\/([0-9A-F]+)\//)) {
                cid = matches[1];
            }
        }

        return cid;
    },
	addTask : function(url, des){
        if (url == null) {
            //115u async method
            return; 
        } else if (url == "" || (/^(javascript|data|mailto):/i.test(url))) {
            //invalid url
            --this.totalTask;
            return;
        } else {
            //nonsupport or filtered url
            var agentsNonsup = xThunderPref.getAgentsNonsupURL(url);
            if (xThunderPref.inArray(this.agentName, agentsNonsup)
                || agentsNonsup.length==0 && this.filerExtStr && !xThunderPref.isExtSupURL(url, this.filerExtStr)) {
                --this.totalTask;
                return;
            }
        }

        this.urls.push(url);
        this.cookies.push(this.getCookie(url));
        if (this.totalTask == 1) {
            des = this.DEF_STR;
        } else if (!des) {
            des = this.getFileName(url);
        } else {
            des = des.replace(/^\s+|\s+$|[\r\n]+/g,"");
        }
        this.descs.push(des);
        this.cids.push(this.getCid(url));
	}
};