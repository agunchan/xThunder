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
    COM_PATH:           "chrome://xthunder/content/xThunder.exe",
    CMD_MAX_LENTH:      2000,
    DTA_NOT_FOUND:      -2,
    COM_NOT_FOUND:      -3,
    EXE_NOT_FOUND:      -4,


    CallAgent: function(agentName, totalTask, referrer, urls, cookies, descs, cids, exePath, args) {
        var result = 0;
        var nativeArgs = [];
        if (!args) {
            args = [];
        }
        if (agentName == "DTA") {
            result = this.DTADownload(totalTask, referrer, urls, descs, args[0] || false);
        } else if (this.detectOS() != "WINNT" || agentName.indexOf("custom") != -1) {
            if (!exePath) {
                exePath = this.getExecutablePath(agentName, args);
            }
            
            if (/(wget|curl|aria2c)(\.exe)$/i.test(exePath)) {
                if (/wget/i.test(exePath) && totalTask > 1) {
                    // Be smart to use input file
                    args[args.length-1] = args[args.length-1].replace(/\[URL\]/ig, "--input-file=[UFILE]");
                }
                result = this.runScript(totalTask, referrer, urls, cookies, descs, exePath, args);
            } else {
                if (args.length >= 1) {
                    nativeArgs[0] = this.replaceHolder(args[args.length-1], referrer, urls, cookies, descs);
                }
                result = this.runNative(exePath, nativeArgs);
            }
        } else if (this.detectOS() == "WINNT") {
            result = this.COMDownload(agentName, totalTask, referrer, urls, cookies, descs, cids, args) 
        }
        return result;
    },
    
    detectOS : function() {
        // "WINNT" on Windows Vista, XP, 2000, and NT systems; "Linux" on GNU/Linux; and "Darwin" on Mac OS X. 
        // Returns UpperCase string 
        if (!this.osString) {
            this.osString = Cc["@mozilla.org/xre/app-info;1"].getService(Ci.nsIXULRuntime).OS.toUpperCase();
        }
        
        return this.osString;
    },
    
    getExecutablePath : function(agentName, args) {
        var path;
        if (agentName == "Thunder") {
            path = this.detectOS() == "DARWIN" ? "/Applications/Thunder.app/Contents/MacOS/Thunder"
                                               : "/usr/bin/wine-thunder";
            args.push("[URL]");
        } else if (agentName == "curl") {
            path = "/usr/local/bin/curl";
            args.push("-L -O -b [COOKIE] -e [REFERER] [URL]");
        } else {
            path = "usr/bin/" + agentName;
            args.push("[URL]");
        }

        return path;
    },
    
    getChromeFile : function (chromePath) {
        var url;
        var ios = Cc["@mozilla.org/network/io-service;1"].getService(Ci["nsIIOService"]);
        var uri = ios.newURI(chromePath, "UTF-8", null);
        var cr = Cc["@mozilla.org/chrome/chrome-registry;1"].getService(Ci["nsIChromeRegistry"]);
        url = cr.convertChromeURL(uri).spec;
        if (!/^file:/.test(url)) {
            url = "file://" + url;
        }
        var ph = Cc["@mozilla.org/network/protocol;1?name=file"].createInstance(Ci.nsIFileProtocolHandler);
        return ph.getFileFromURLSpec(url);
    },
    
    getJobString : function(totalTask, referrer, urls, cookies, descs, cids) {
        var jobLines = [];
        for (var j = 0; j < totalTask; ++j) {
            jobLines.push(urls[j], descs[j], cookies[j], cids[j]);
        }
        var job = jobLines.join("\n");
        
        return totalTask + "\n" + referrer + "\n" + job + "\n"; 
    },
    
    createTempFile : function(data, ext, charset) {
        var file = Cc["@mozilla.org/file/directory_service;1"].getService(Ci.nsIProperties).
            get("TmpD", Ci.nsIFile);
        file.append("xThunder");
        if (!file.exists()) {
            file.create(Ci.nsIFile.DIRECTORY_TYPE, 0700);
        }
        file.append("xThunder" + Date.now() + (ext || ".xtd"));
        file.createUnique(Ci.nsIFile.NORMAL_FILE_TYPE, 0700);
        
        var foStream = Cc["@mozilla.org/network/file-output-stream;1"].createInstance(Ci.nsIFileOutputStream);
        foStream.init(file, 0x02 | 0x08 | 0x20, 0700, 0);
        var converter = Cc["@mozilla.org/intl/converter-output-stream;1"].createInstance(Ci.nsIConverterOutputStream);
        converter.init(foStream, charset || "UTF-8", 0, "?".charCodeAt(0));
        converter.writeString(data);
        converter.close();
        
        return file.path;
    },
        
    replaceHolder : function(arg, referrer, urls, cookies, descs, escape) {  
        if (arg.match(/\[CBURL\]/i)) {
            // URL from clipboard
            var gClipboardHelper = Cc["@mozilla.org/widget/clipboardhelper;1"].getService(Ci.nsIClipboardHelper);
            gClipboardHelper.copyString(urls[0]);
            arg = arg.replace(/\[CBURL\]/ig, "");
        } 

        if (arg.match(/\[UFILE\]/i)) {
            // URL from files
            var urlFilePath = this.createTempFile(urls.join("\n"));
            arg = arg.replace(/\[UFILE\]/ig, escape ? this.escapePath(urlFilePath) : urlFilePath);
        }
        
        var url = urls[0];
        var ref = referrer || urls[0];
        var cook = cookies[0] || 0;
        var desc = descs[0] || 0;

        arg = arg.replace(/\[URL\]/ig, escape ? this.escapePath(url) : url).
                replace(/\[REFERER\]/ig, escape ? this.escapePath(ref) : ref).
                replace(/\[COOKIE\]/ig, escape ? this.escapePath(cook) : cook).
                replace(/\[COMMENT\]/ig, escape ? this.escapePath(desc) : desc);
                   
        return arg;
    },
    
    escapePath : function (path) {
        return path ? ( this.detectOS() == "WINNT" ? "\"" + path + "\"" : path.replace(/([\\\*\?\[\]\$&<>\|\(\)\{\};"'`])/g,"\\$1").replace(/\s/g,"\\ ") )
                    : path;
    },
    
    runScript : function(totalTask, referrer, urls, cookies, descs, exePath, args) {
        var downDir = this.escapePath(args[0]);
        var programArg = this.replaceHolder(args[args.length-1], referrer, urls, cookies, descs, true);
        if (this.detectOS() == "WINNT") {
            var batEncoding = args[1];
            var batText = "@echo off\r\n" + 
                "title xThunder\r\n" + 
                "if not exist " + downDir + " md " + downDir + "\r\n" + 
                "cd /d " + downDir + "\r\n" + 
                this.escapePath(exePath) + " " + programArg + "\r\n";
            
            this.runNative(this.createTempFile(batText, ".bat", batEncoding), []);
        } else if (this.detectOS() == "LINUX") {
            var shellEncoding = "UTF-8";
            var shellText = '#!/bin/sh\n' + 
                'if [ "$1" = "" ]; then\n' +
                '  if [ "$COLORTERM" = "gnome-terminal" ] && which gnome-terminal >/dev/null 2>&1; then\n' +
                '    gnome-terminal -t xThunder -x /bin/sh "$0" term && exit\n' + 
                '  fi\n' + 
                '  if which xterm >/dev/null 2>&1; then\n' +
                '    xterm -T xThunder -e /bin/sh "$0" term && exit\n' + 
                '  fi\n' +
                'fi\n' +
                'if [ ! -d ' + downDir + ' ]; then\n' + 
                '  mkdir -p ' + downDir + '\n' + 
                'fi\n' +
                'cd ' + downDir + '\n' + 
                this.escapePath(exePath) + " " + programArg + "\n";
                
            this.runNative(this.createTempFile(shellText, ".sh", shellEncoding), []);
        }
    },
    
    runNative: function(exePath, args) {
        var exeFile = Cc["@mozilla.org/file/local;1"].createInstance(Ci.nsILocalFile);
        exeFile.initWithPath(exePath);
        if (exeFile.exists()) {
            var proc = Cc["@mozilla.org/process/util;1"].createInstance(Ci.nsIProcess);
            proc.init(exeFile);
//            var cs = Cc["@mozilla.org/consoleservice;1"].getService(Ci.nsIConsoleService);
//            cs.logStringMessage("Running " + exePath + " " + args.join(" "));
            proc["runw" in proc ? "runw" : "run"](false, args, args.length);
            return proc.exitValue;
        } else {
            return this.EXE_NOT_FOUND;
        }
    },
    
    COMDownload : function(agentName, totalTask, referrer, urls, cookies, descs, cids, args) {
        // Common Object Model download in WINNT
        if (!this.COMExeFile) {
            this.COMExeFile = this.getChromeFile(this.COM_PATH);
        }

        if (!this.COMExeFile || !this.COMExeFile.exists()) {
            return this.COM_NOT_FOUND;
        }

        var proc = Cc["@mozilla.org/process/util;1"].createInstance(Ci.nsIProcess);
        var hasRunW = "runw" in proc;
        proc.init(this.COMExeFile);

        args.push("-a", agentName);
        if (totalTask == 1 && hasRunW && this.COMExeFile.path.length + urls[0].length + referrer.length + 
            descs[0].length + cookies[0].length + cids[0].length < this.CMD_MAX_LENTH) {
            // Empty string arguments ignored, command-line string limitation of Win2000 is 2047(XP 8191)
            args.push("-d", urls[0], referrer || " ", descs[0] || " ", cookies[0] || " ", cids[0] || " ");
        } else {
            // Before Firefox 4 wstring can only be passed by file
            args.push("-f", this.createTempFile(this.getJobString(totalTask, referrer, urls, cookies, descs, cids)));
        }
        return proc[hasRunW ? "runw" : "run"](false, args, args.length);
    },

    DTADownload : function(totalTask, refer, urls, descs, oneClick) {
        var wm = Cc["@mozilla.org/appshell/window-mediator;1"].getService(Ci.nsIWindowMediator);
        var mainWindow = wm.getMostRecentWindow("navigator:browser");
        if (!this.DTA) {
            if (mainWindow.DTA) {
                // DTA 2.0.x
                this.DTA = mainWindow.DTA;
            } else {
                // DTA 3.0+
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
                // Use dta dialog to set download directory if oneClick failed
                if (oneClick)
                    DTA.saveSingleLink(mainWindow, false, urls[0], refer, descs[0]);
                else
                    throw e;
            }
        } else if(totalTask > 1 && DTA.saveLinkArray) {
            var anchors = [], images = [];
            var wrapURL = function(url, cs) {return new DTA.URL(DTA.IOService.newURI(url, cs, null));}
            for (var j = 0; j < totalTask; ++j) {
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