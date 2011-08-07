var xThunder = {
	xthunderComponent: null,
    xthunderExePath : "chrome://xthunder/content/xThunder.exe",
    agentName : null,
    referrer : "",
    urls : [],
    cookies : [],
    descs : [],
    totalTask : 0,
    offLine : false,

    init : function(referrer, totalTask, agentName, offLine){
        this.referrer = referrer;
        this.urls = [];
        this.cookies = [];
        this.descs = [];
        this.totalTask = totalTask;
        this.agentName = agentName || xThunderPref.getValue("agentName");
        this.offLine = offLine || false;
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
                this.xthunderComponent = Components.classes["@lshai.com/xthundercomponent;1"].getService().wrappedJSObject;
            }
            
            var result;
            if (this.agentName == "DTA") {
                result = this.xthunderComponent.callAgent(this.agentName, this.totalTask, this.referrer, this.urls, this.cookies, this.descs);
            } else if (this.offLine && this.agentName == "Thunder" && this.totalTask == 1 && gBrowser) {
                //Thunder offline
                var thunderOffUrl = "http://lixian.vip.xunlei.com/";
                gBrowser.selectedTab = gBrowser.addTab(this.urls[0].indexOf(thunderOffUrl) != -1 
                                                        ? this.urls[0]
                                                        : thunderOffUrl + "lixian_login.html?furl=" + this.urls[0]);
                return true;
            } else {
                var args = this.createJobFile();

                if (this.offLine && this.agentName == "QQDownload" && this.totalTask == 1) {
                    //QQ offline
                    args.push("-e", 10600);
                }

                result = this.xthunderComponent.callAgent(this.agentName, this.totalTask, this.referrer, this.urls, this.cookies, this.descs, this.xthunderExePath, args);
            }

            switch(result) {
                case this.xthunderComponent.EXE_NOT_FOUND:
                    alert('xThunder.exe missing, please check if xThunder was properly installed!');
                    break;
                case this.xthunderComponent.DTA_NOT_FOUND:
                    alert('DTA called error, please check if DTA was properly installed!');
                    break;
                default:
                    return true;
            }
        } catch(ex) {
            alert(ex);
        } 
        
        return false;
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
            jobLines.push(this.urls[j], this.cookies[j], this.descs[j])
        }
        var job = jobLines.join("\n");
        
        var data = xThunderPref.getValue("downDir") + "\n"
                + this.referrer + "\n" + job; 
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
                strCookie = Components.classes["@mozilla.org/cookieService;1"]
                        .getService(Components.interfaces.nsICookieService)
                        .getCookieString(uri, null);
            }
        } catch(ex) {}
		
		if (!strCookie) {
			strCookie = " ";
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
        catch(ex) {}

        return href;
    },
	addTask : function(url, des, filerExtStr){
        if (url == null) {
            //115u async method
            return; 
        } else if (url == "" || (/^(javascript|data):/i.test(url))) {
            //invalid url
            --this.totalTask;
            return;
        } else {
            //nonsupport or filtered url
            var agentsNonsup = xThunderPref.getAgentsNonsupURL(url);
            if (xThunderPref.inArray(this.agentName, agentsNonsup)
                || filerExtStr && agentsNonsup.length==0 && !xThunderPref.isExtSupURL(url, filerExtStr)) {
                --this.totalTask;
                return;
            }
        }

        this.urls.push(url);
        this.cookies.push(this.getCookie(url));
        if (this.totalTask == 1) {
            des = " ";
        } else if (!des) {
            des = this.getFileName(url);
        }
        this.descs.push(des);
	}
};