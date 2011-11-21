Components.utils.import("resource://gre/modules/XPCOMUtils.jsm"); 
const Cc = Components.classes;
const Ci = Components.interfaces;

function xThunderComponent() {
    this.wrappedJSObject = this;
}
 
xThunderComponent.prototype = {
    classID:            Components.ID("{77683972-8cb9-4f92-a962-aea5b6f1e2a1}"),
    contractID:         "@fxthunder.com/component;1",
    QueryInterface:     XPCOMUtils.generateQI(),
    DTA:                null,
    COM_PATH :          "chrome://xthunder/content/xThunder.exe",
    COMExeFile:         null,
    DTA_NOT_FOUND:      -2,
    COM_NOT_FOUND:      -3,
    EXE_NOT_FOUND:      -4,


    callAgent: function(agentName, totalTask, referrer, urls, cookies, descs, cids, exePath, args) {
        var result;
        if (agentName == "DTA") {
            result = this.DTADownload(totalTask, referrer, urls, descs, args[0]);
        } else if(agentName.indexOf("custom") != -1) {
            result = this.RunCustom(totalTask, referrer, urls, cookies, descs, exePath, args);
        } else {
            result = this.COMDownload(totalTask, referrer, urls, cookies, descs, cids, args);
        }
        return result;
    },
    
    getChromeFile : function (chromePath) {
        var url;
        var ios = Cc["@mozilla.org/network/io-service;1"].getService(Ci["nsIIOService"]);
        var uri = ios.newURI(chromePath, "UTF-8", null);
        var cr = Cc["@mozilla.org/chrome/chrome-registry;1"].getService(Ci["nsIChromeRegistry"]);
        url = cr.convertChromeURL(uri).spec;
        if (!/^file:/.test(url))
            url = "file://"+url;
        var ph = Cc["@mozilla.org/network/protocol;1?name=file"].createInstance(Ci.nsIFileProtocolHandler);
        return ph.getFileFromURLSpec(url);
    },
    
    createJobFile : function(totalTask, referrer, urls, cookies, descs, cids) {
        var file = Cc["@mozilla.org/file/directory_service;1"].getService(Ci.nsIProperties)
                .get("TmpD", Ci.nsIFile);
        file.append("xThunder");
        if (!file.exists()) {
            file.create(Ci.nsIFile.DIRECTORY_TYPE, 0700);
        }
        file.append("xThunder" + Date.now() + ".xtd");
        file.createUnique(Ci.nsIFile.NORMAL_FILE_TYPE, 0700);
        
        var jobLines = [];
        for (var j = 0; j < totalTask; ++j) {
            jobLines.push(urls[j], descs[j], cookies[j], cids[j]);
        }
        var job = jobLines.join("\n");
        
        var data = totalTask + "\n" + referrer + "\n" + job + "\n"; 
        var foStream = Cc["@mozilla.org/network/file-output-stream;1"].createInstance(Ci.nsIFileOutputStream);
        foStream.init(file, 0x02 | 0x08 | 0x20, 0700, 0);
        var converter = Cc["@mozilla.org/intl/converter-output-stream;1"].createInstance(Ci.nsIConverterOutputStream);
        converter.init(foStream, "UTF-8", 0, 0);
        converter.writeString(data);
        converter.close();
        
        return file.path;
    },
    
    RunCustom: function(totalTask, referrer, urls, cookies, descs, exePath, args) {
        var exeFile = Cc["@mozilla.org/file/local;1"].createInstance(Ci.nsILocalFile);
        exeFile.initWithPath(exePath);
        if (exeFile.exists()) {
            args[args.length-1] = args[args.length-1].replace(/\[REFERER\]/ig, referrer)
                                    .replace(/\[URL\]/ig, urls[0])
                                    .replace(/\[COOKIE\]/ig, cookies[0])
                                    .replace(/\[COMMENT\]/ig, descs[0]);
            //var cs = Components.classes["@mozilla.org/consoleservice;1"].getService(Components.interfaces.nsIConsoleService);
            //cs.logStringMessage(args[args.length-1]);
            var proc = Cc["@mozilla.org/process/util;1"].createInstance(Ci.nsIProcess);
            proc.init(exeFile);
            proc["runw" in proc ? "runw" : "run"](false, args, args.length);
            return proc.exitValue;
        } else {
            return this.EXE_NOT_FOUND;
        }
    },
    
    COMDownload : function(totalTask, referrer, urls, cookies, descs, cids, args) {
        //COM download
        if (!this.COMExeFile) {
            this.COMExeFile = this.getChromeFile(this.COM_PATH);
        }

        if (!this.COMExeFile || !this.COMExeFile.exists()) {
            return this.COM_NOT_FOUND;
        }

        var proc = Cc["@mozilla.org/process/util;1"].createInstance(Ci.nsIProcess);
        var hasRunW = "runw" in proc;
        proc.init(this.COMExeFile);

        if (totalTask == 1 && hasRunW) {
            //empty string arguments ignored
            args.push("-d", urls[0], referrer || " ", descs[0] || " ", cookies[0] || " ", cids[0] === "" ? " " : cids[0]);
        } else {
            //before Firefox 4 wstring can only be passed by file
            args.push("-f", this.createJobFile(totalTask, referrer, urls, cookies, descs, cids));
        }
        return proc[hasRunW ? "runw" : "run"](false, args, args.length);
    },

    DTADownload : function(totalTask, refer, urls, descs, oneClick) {
        var wm = Cc["@mozilla.org/appshell/window-mediator;1"].getService(Ci.nsIWindowMediator);
        var mainWindow = wm.getMostRecentWindow("navigator:browser");
        if (!this.DTA) {
            if (mainWindow.DTA) {
                //dta 2.0.x
                this.DTA = mainWindow.DTA;
            } else {
                //dta 3.0+
                try {
                    this.DTA = {};
                    Components.utils.import("resource://dta/api.jsm", this.DTA);
                } catch (ex) {
                    this.DTA = null;
                }
            }
        }

        if (!this.DTA) {
            return this.DTA_NOT_FOUND;
        }

        var DTA = this.DTA;
        if (totalTask == 1 && DTA.saveSingleLink) {
            try {
                DTA.saveSingleLink(mainWindow, oneClick, urls[0], refer, descs[0]);
            } catch(e) {
                //use dta dialog to set download directory if oneClick failed
                if (oneClick)
                    DTA.saveSingleLink(mainWindow, false, urls[0], refer, descs[0]);
                else
                    throw e;
            }
        } else if(totalTask > 1 && DTA.saveLinkArray) {
            var anchors = [], images = [];
            var wrapURL = function(url, cs) {return new DTA.URL(DTA.IOService.newURI(url, cs, null));}
            for (var j=0; j<totalTask; ++j) {
                anchors.push({
                    url: wrapURL(urls[j], "UTF-8"),
                    description: descs[j],
                    ultDescription: "",
                    referrer: refer,
                    fileName: ""
                })
            }
            DTA.saveLinkArray(mainWindow, anchors, images);
        }

        return 0;
    }
};

if (XPCOMUtils.generateNSGetFactory)
    var NSGetFactory = XPCOMUtils.generateNSGetFactory([xThunderComponent]);
else
    var NSGetModule = XPCOMUtils.generateNSGetModule([xThunderComponent]);