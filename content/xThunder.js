var xThunder = {
	xthunderComponent: null,
    xthunerExePath : "chrome://xthunder/content/xThunder.exe",
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
            if (this.xthunderComponent == null) {
                this.xthunderComponent = Components.classes["@lshai.com/xthundercomponent;1"].getService().wrappedJSObject;
            }
            
            var result;
            if (this.agentName == "DTA") {
                result = this.xthunderComponent.CallAgent(this.agentName, this.totalTask, this.referrer, this.urls, this.cookies, this.descs);
            } else {
                result = this.xthunderComponent.CallAgent(this.agentName, this.totalTask, this.referrer, this.urls, this.cookies, this.descs, this.xthunerExePath, this.createJobFile());
            }

            switch(result) {
                case this.xthunderComponent.EXE_NOT_FOUND:
                    alert('xThunder.exe missing, please check if xThunder was properly installed!');
                    break;
                case this.xthunderComponent.DTA_NOT_FOUND:
                    alert('DTA called error, please check if it was properly installed!');
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
        var foStream = Components.classes["@mozilla.org/network/file-output-stream;1"].
                       createInstance(Components.interfaces.nsIFileOutputStream);
        foStream.init(file, 0x02 | 0x08 | 0x20, 0700, 0);
        var converter = Components.classes["@mozilla.org/intl/converter-output-stream;1"].
                        createInstance(Components.interfaces.nsIConverterOutputStream);
        converter.init(foStream, "UTF-8", 0, 0);
        converter.writeString(data);
        converter.close(); // this closes foStream

        var args = [];
        args.push("-a", this.agentName);
        args.push("-n", this.totalTask);
        args.push("-p", file.path);
        return args;
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
        catch(ex) {}

        return href;
    },
	addTask : function(url, des){
        if (url == null) {
            return; //for async method
        } else if (url == "" 
            || (/^(javascript|data):/i.test(url))
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
	}
};