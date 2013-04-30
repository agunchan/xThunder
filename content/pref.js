var xThunderPref = {
    pref : null,
    uriSupReg : /^(?:ftp|https?):/i,
    proSupReg : /^(?:thunder|flashget|qqdl|fs2you|ed2k|magnet):/i,
    invalidReg : /^(?:javascript|data|mailto):/i,
    pros : ["thunder", "flashget", "qqdl", "fs2you", "ed2k", "magnet", "udown", "115"],
    agents: ["Thunder", "QQDownload", "DTA", "IDM", "ThunderLite", "ToolbarThunder", "FlashGet3", "FlashGetMini", "BitComet", "FDM", "NetTransport", "Orbit", "UDown"],
    agentsNonsup : {"ed2k"     : ["DTA", "IDM", "FlashGetMini", "BitComet", "FDM", "Orbit", "UDown"],
                    "magnet"   : ["DTA", "IDM", "ThunderLite", "ToolbarThunder", "FlashGetMini", "FDM", "Orbit", "UDown"],
                    "flashget" : ["Thunder", "QQDownload", "DTA", "IDM", "ThunderLite", "ToolbarThunder", "BitComet", "FDM", "NetTransport", "Orbit", "UDown",
                                    "ThunderVOD", "ThunderOffLine", "QQDownloadOffLine", "ThunderVODOffLine"],
                     "qqdl"    : ["Thunder", "DTA", "IDM", "ThunderLite", "ToolbarThunder", "BitComet", "FDM", "NetTransport", "Orbit", "UDown",
                                    "ThunderVOD", "ThunderOffLine", "ThunderVODOffLine"]},
    agentsOffLine : {"Thunder" : "http://lixian.vip.xunlei.com/lixian_login.html?furl=[URL]",
                    "QQDownload": "http://lixian.qq.com/main.html?url=[URL]", 
                    "ThunderVOD": "http://dynamic.vod.lixian.xunlei.com/play?action=http_sec&go=check&location=home&furl=[URL]"},

    // Only show available agents in popup menu
    appendAgentList : function(menupop, idpre, func, isradio, addOffLine){
        var ownDoc = menupop.ownerDocument;
        while(menupop.firstChild) {
            menupop.removeChild(menupop.firstChild);
        }
        var stringBundle = document.getElementById("xThunderAgentStrings");
        var agentList = this.getEnabledAgentList(addOffLine);
        var cusAgentList = this.getUnicodeValue("agent.custom").split(",");
        var downOffLineSep = this.getValue("downOffLineSep");
        for (var i=0; i<agentList.length; ++i) {
            var agent = agentList[i];
            var mi = createMenuitem({
                id : idpre + agent,
                label : agent.indexOf("custom") != -1 ? cusAgentList[agent.split("custom")[1]] 
                                                      : stringBundle.getString(agent),
                value : agent,
                oncommand : func ? (func + "('" + agent + "')") : ""
            });
            if(isradio) {
                mi.setAttribute("name", "agent");
                mi.setAttribute("type", "radio");
                if (i==0)
                    mi.setAttribute("checked", true);
            }
            if(agent.indexOf("OffLine") != -1 && downOffLineSep) {
                if (menupop.childNodes.length > 1) {
                    menupop.insertBefore(ownDoc.createElement("menuseparator"), mi);
                }
                downOffLineSep = false;
            }
        }

        function createMenuitem(atrs) {
            var mi = ownDoc.createElement("menuitem");
            for(var k in atrs)
                mi.setAttribute(k, atrs[k]);
            return menupop.appendChild(mi);
        }
    },
    
    // Get enabled agents, e.g. [Thunder, DTA, ThunderOffLine]
    getEnabledAgentList : function(addOffLine) {
        var agentList = this.getFixedAgentList();
        var enableAgentList = [];
        var offLineAutoHide = this.getValue("downOffLineAutoHide");
        for (var i=0; i<agentList.length; ++i) {
            var agentItem = agentList[i].split("|");
            var agent = agentItem[0];
            var enabled = (agentItem.length == 1);
            if (addOffLine && (enabled || !offLineAutoHide)) {
                if (agent == "Thunder") {
                    agentList.push(agent + "OffLine");
                    if (this.getValue("vodOffLine")) {
                        agentList.push(agent + "VODOffLine");
                    }
                } else if (agent == "QQDownload") {
                    agentList.push(agent + "OffLine");
                }
            }
            
            if (enabled) {
                enableAgentList.push(agent);
            }
        }
        
        if (addOffLine && this.getValue("qqOffLineWeb") && enableAgentList.indexOf("QQDownloadOffLine") == -1) {
            enableAgentList.push("QQDownloadOffLine");
        }
        
        return enableAgentList;
    },

    // Get all agents, e.g. [Thunder, DTA, custom0, QQDownload|0, FlashGet3|0, ...]
    getFixedAgentList : function() {
        if (this.detectOS() != "WINNT") {
            return this.getUnixAgentList();
        }
        
        var showAgents = this.getValue("showAgents");
        var agentList = showAgents.split(",");
        var agentLen = agentList.length-1;
        var cusAgentLen = this.getUnicodeValue("agent.custom").split(",").length - 1;
        var agent;
        var i;        

        if (agentLen - cusAgentLen < this.agents.length) {
            // Add newly supported agents 
            for (i=0; i<this.agents.length; ++i) {
                if (agentList.indexOf(this.agents[i]) == -1 && agentList.indexOf(this.agents[i]+"|0") == -1) {
                    showAgents += (this.agents[i] + "|0,");
                }
            }
            for (i=0; i<cusAgentLen; ++i) {
                if (agentList.indexOf("custom"+i) == -1 && agentList.indexOf("custom"+i+"|0") == -1) {
                    showAgents += ("custom"+i+"|0,");
                }
            }
            this.setValue("showAgents", showAgents);
            agentList = showAgents.split(",");
        } else if(agentLen - cusAgentLen > this.agents.length) {
            // Delete no longer supported agents
            for (i=0; i<agentLen; ++i) {
                agent = agentList[i].split("|")[0];
                if (agent.indexOf("custom") == -1 && this.agents.indexOf(agent) == -1) {
                    showAgents = showAgents.replace(agentList[i] + ",", "");
                }
            }
            this.setValue("showAgents", showAgents);
            agentList = showAgents.split(",");
        }
        
        agentList.pop();    // Last element is an empty string
        return agentList;
    },
    
    getUnixAgentList : function() {
        var showAgentsPref = "showAgents" + this.detectOS();
        var oldUnixAgents = this.getValue(showAgentsPref);
        var unixAgents = oldUnixAgents;
        var agent;
        var i;
        if (!unixAgents) {
            // get agents from previous agent list
            unixAgents = "";
            var agentList = this.getValue("showAgents").split(",");
            agentList.pop();
            for (i=0; i<agentList.length; ++i) {
                agent = agentList[i].split("|")[0];
                if (agent == "Thunder" || agent == "DTA") {
                    unixAgents += (agentList[i] + ",");
                } else if (agent.indexOf("custom") != -1) {
                    var exePath = this.getUnicodeValue("agent." + agent + ".exe");
                    if (exePath.charAt(0) == "/") {
                        unixAgents += (agentList[i] + ",");
                    }
                }
            }
        }
        
        var builtInAgents = this.detectOS() == "Darwin" ?  ["Thunder", "DTA", "curl","aria2"] : 
            ["Thunder", "DTA", "wget", "transmission", "curl", "aria2", "mldonkeyOffLine", "utorrentOffLine"];
        
        // Add newly supported agents 
        for (i=0; i<builtInAgents.length; ++i) {
            if (unixAgents.indexOf(builtInAgents[i]) == -1) {
                unixAgents += (builtInAgents[i] + "|0,");
            }
        }
        // Delete no longer supported agents
        var unixAgentsList = unixAgents.split(",");
        unixAgentsList.pop();
        for (i=0; i<unixAgentsList.length; ) {
            agent = unixAgentsList[i].split("|")[0];
            if (agent.indexOf("custom") == -1 && builtInAgents.indexOf(agent) == -1) {
                unixAgents = unixAgents.replace(unixAgentsList[i] + ",", "");
                unixAgentsList.splice(i, 1);
            } else {
                ++i;
            }
        }
        
        if (unixAgents != oldUnixAgents) {
            this.setValue(showAgentsPref, unixAgents);
        }

        return unixAgentsList;
    },
        
    // Set string of all agents, e.g. Thunder,DTA,wget|0,...
    setAgentsListStr : function(showAgents) {
        var showAgentsPref = "showAgents" + (this.detectOS() == "WINNT" ? "" : this.detectOS());
        this.setValue(showAgentsPref, showAgents);
    },
	
    getDefaultAgent : function() {
        var showAgentsPref = "showAgents" + (this.detectOS() == "WINNT" ? "" : this.detectOS());
        var showAgents = this.getValue(showAgentsPref);
        return showAgents.split(",")[0];
    },
    
    setDefaultAgent : function(defAgent) {
        var showAgentsPref = "showAgents" + (this.detectOS() == "WINNT" ? "" : this.detectOS());
        var showAgents = this.getValue(showAgentsPref);
        if (defAgent != showAgents.split(",")[0]) {
            // Default agent must be first
            showAgents = defAgent + "," + showAgents.replace(","+defAgent+"|0,", ",").replace(","+defAgent+",", ",");
            this.setValue(showAgentsPref, showAgents);
        }    
    },
    
    getAgentByClick : function(event, addOffLine) {
        if(event && event.button != 0) {
            var agentList = this.getEnabledAgentList(addOffLine);
            if (event.button == 1 && agentList.length >= 3) {
                // Middle click to use third agent
                return agentList[2];
            } else if (event.button == 2 && agentList.length >= 2) {
                // Right click to use second agent
                return agentList[1];
            }
        }

        // Use default agent otherwise
        return this.getDefaultAgent();
    },
    
    // Get sequenced support agents, e.g. [Thunder, DTA, QQDownload, FlashGet3, ...]
    getCandidateAgents : function(agentName) {
        var agentList = this.getEnabledAgentList(true);
        for (var i=agentList.length-1; i>=0; --i) {
            if (agentList[i] == agentName || agentList[i].indexOf("custom") != -1) {
                agentList.splice(i, 1);
            }
        }
        
        return agentList;
    },
    
    getUnsupAgents : function(trimmedUrl) {
        if (this.detectOS() != "WINNT") {
            return [];
        }
        
        if(!trimmedUrl) {
            return this.agents;
        } 
        var urlPro = trimmedUrl.split(":")[0].toLowerCase();
        for (var pro in this.agentsNonsup) {
            if (urlPro == pro) {
                return this.agentsNonsup[pro];
            }
        }
        return [];
    },
    
    isSupURL : function(url) {
        url = url.replace(/^\s+/g, "");
        return this.uriSupReg.test(url) || this.proSupReg.test(url);
    },

    isExtSupURL : function(trimmedUrl, supExt) {
        if (supExt == "") {
            return false;
        } else if(!supExt) {
            supExt = this.getValue("supportExt");
        }
        var download = false;
        if (this.uriSupReg.test(trimmedUrl)) {
            var subUrls = trimmedUrl.split("?");
            var names = subUrls[0].split("#")[0].split("/");
            var fileName = names[names.length-1].replace(/%2E/g, ".");
            var matches = fileName.match(/(\.\w+)$/i);
            if (matches && supExt.indexOf(matches[1] + ";") != -1) {
                download = true;
            } else if (subUrls.length > 1 && matches && /\.(?:jsp|php)/i.test(matches[1])) {
                // The parameter of jsp|php url may contain supporting ext
                var subParams = subUrls[1].split("&");
                for (var j=0; j<subParams.length; ++j) {
                    matches = subParams[j].match(/(\.\w+)$/i);
                    if (matches && supExt.indexOf(matches[1] + ";") != -1) {
                        download = true;
                        break;
                    }
                }
            }
        }

        return download;
    },

    getBranch : function() {
        if (this.pref == null) {
            this.pref = Components.classes["@mozilla.org/preferences-service;1"].
                getService(Components.interfaces.nsIPrefService).getBranch("extensions.xthunder.");
        }
        return this.pref;
    },

    getValue: function(prefName, defaultValue) {
        var prefType=this.getBranch().getPrefType(prefName);

        switch (prefType) {
            case this.pref.PREF_STRING:return this.pref.getCharPref(prefName);
            case this.pref.PREF_BOOL:return this.pref.getBoolPref(prefName);
            case this.pref.PREF_INT:return this.pref.getIntPref(prefName);
            default:return defaultValue || 0;
        }
    },

    setValue: function(prefName, value) {
        var prefType = typeof(value);
        if (prefType != typeof(this.getValue(prefName))) {
            this.pref.deleteBranch(prefName);
        }

        switch (prefType) {
        case "string":
            this.pref.setCharPref(prefName, value);
            break;
        case "boolean":
            this.pref.setBoolPref(prefName, value);
            break;
        case "number":
            if (value % 1 != 0) {
                throw new Error("Cannot set preference to non integer");
            } else {
                this.pref.setIntPref(prefName, Math.floor(value));
            }
            break;
        default:
            throw new Error("Cannot set preference with datatype: " + prefType);
        }
    },
        
    getUnicodeValue : function(prefName) {
        return this.getBranch().getComplexValue(prefName, Components.interfaces.nsISupportsString).data;
    },
    
    setUnicodeValue : function(prefName, value) {
        var str = Components.classes["@mozilla.org/supports-string;1"].createInstance(Components.interfaces.nsISupportsString);
        str.data = value;
        this.getBranch().setComplexValue(prefName, Components.interfaces.nsISupportsString, str);
    },
    
    detectOS : function() {
        // "WINNT" on Windows Vista, XP, 2000, and NT systems; "Linux" on GNU/Linux; and "Darwin" on Mac OS X. 
        if (!this.osString) {
            this.osString = Components.classes["@mozilla.org/xre/app-info;1"].getService(Components.interfaces.nsIXULRuntime).OS;
        }
        
        return this.osString;
    }
}
