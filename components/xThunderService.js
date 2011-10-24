Components.utils.import("resource://gre/modules/XPCOMUtils.jsm"); 

function xThunderComponent() {
    this.wrappedJSObject = this;
}
 
xThunderComponent.prototype = {
    classID:            Components.ID("{77683972-8cb9-4f92-a962-aea5b6f1e2a1}"),
    contractID:         "@fxthunder.com/component;1",
    QueryInterface:     XPCOMUtils.generateQI(),
    DTA:                null,
    COMExeFile:         null,
    DTA_NOT_FOUND:      -2,
    EXE_NOT_FOUND:      -3,

    //exeFile : string or nsILocalFile
    callAgent: function(agentName, totalTask, referrer, urls, cookies, descs, exePath, args) {
        var result;
        if (agentName == "DTA") {
            result = this.DTADownload(totalTask, referrer, urls, descs, args);
        } else {
            result = this.COMDownload(exePath, args, false);
        }
        return result;
    },

    runNative: function(exeFile, args, blocking) {
        var proc = Components.classes["@mozilla.org/process/util;1"]
                .createInstance(Components.interfaces.nsIProcess);
        proc.init(exeFile);
        proc["runw" in proc ? "runw" : "run"](blocking, args, args.length);
        return proc.exitValue;
    },
    
    getChromeFile : function (chromePath) {
        var url;
        var ios = Components.classes["@mozilla.org/network/io-service;1"].getService(Components.interfaces["nsIIOService"]);
        var uri = ios.newURI(chromePath, "UTF-8", null);
        var cr = Components.classes["@mozilla.org/chrome/chrome-registry;1"].getService(Components.interfaces["nsIChromeRegistry"]);
        url = cr.convertChromeURL(uri).spec;
        if (!/^file:/.test(url))
            url = "file://"+url;
        var ph = Components.classes["@mozilla.org/network/protocol;1?name=file"]
                        .createInstance(Components.interfaces.nsIFileProtocolHandler);
        return ph.getFileFromURLSpec(url);
    },

    COMDownload : function(exePath, args, blocking) {
        if (!this.COMExeFile && (/^chrome:/i.test(exePath))) {
            this.COMExeFile = this.getChromeFile(exePath);
        }

        if (!this.COMExeFile || !this.COMExeFile.exists()) {
            return this.EXE_NOT_FOUND;
        }

        return this.runNative(this.COMExeFile, args, blocking);
    },

    DTADownload : function(totalTask, refer, urls, descs, oneClick) {
        var wm = Components.classes["@mozilla.org/appshell/window-mediator;1"]
                            .getService(Components.interfaces.nsIWindowMediator);
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