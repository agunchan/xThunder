var xThunderPref = {
    pref : null,
    uriSupReg : /^(?:ftp|https?):/i,
    proSupReg : /^(?:thunder|flashget|qqdl|fs2you|ed2k|magnet):/i,
    invalidReg : /^(?:javascript|data|mailto):/i,
    pros : ["thunder", "flashget", "qqdl", "fs2you", "ed2k", "magnet", "udown", "115"],
    agents: ["Thunder", "QQDownload", "DTA", "IDM", "ThunderLite", "ToolbarThunder", "FlashGet3", "FlashGetMini", "BitComet", "FDM", "NetTransport", "Orbit", "UDown"],
    agentsNonsup : {"ed2k"   : ["DTA", "IDM", "FlashGetMini", "BitComet", "FDM", "Orbit", "UDown"],
                    "magnet" : ["DTA", "IDM", "ThunderLite", "ToolbarThunder", "FlashGetMini", "FDM", "Orbit", "UDown"],
                    "flashget" : ["Thunder", "QQDownload", "DTA", "IDM", "ThunderLite", "ToolbarThunder", "BitComet", "FDM", "NetTransport", "Orbit", "UDown",
                                    "ThunderVOD", "ThunderOffLine", "QQDownloadOffLine", "ThunderVODOffLine"]},    

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
                menupop.insertBefore(ownDoc.createElement("menuseparator"), mi);
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
        for (var i=0; i<agentList.length; ++i) {
            var agentItem = agentList[i].split("|");
            var agent = agentItem[0];
            if (addOffLine && (!this.getValue("downOffLineAutoHide") || agentItem.length == 1)) {
                if (agent == "Thunder") {
                    agentList.push(agent + "OffLine");
                    if (this.getValue("vodOffLine")) {
                        agentList.push(agent + "VODOffLine");
                    }
                } else if (agent == "QQDownload") {
                    agentList.push(agent + "OffLine");
                }
            }
            
            if (agentItem.length == 1) {
                enableAgentList.push(agent);
            }
        }
        return enableAgentList;
    },

    // Get all agents, e.g. [Thunder, DTA, custom0, QQDownload|0, FlashGet3|0, ...]
    getFixedAgentList : function() {
        var showAgents = this.getValue("showAgents");
        var defAgent = this.getValue("agentName");
        var agentList = showAgents.split(",");
        var agentLen = agentList.length-1;
        var cusAgentList = this.getValue("agent.custom").split(",");
        cusAgentList.pop();  // Last element is an empty string

        if (agentLen < this.agents.length + cusAgentList.length) {
            // For v1.0.2 before user config
            for (var i=0; i<this.agents.length; ++i) {
                if (agentList.indexOf(this.agents[i]) == -1 && agentList.indexOf(this.agents[i]+"|0") == -1) {
                    showAgents = showAgents + this.agents[i] + "|0,";
                }
            }
            this.setValue("showAgents", showAgents);
            agentList = showAgents.split(",");
        } else if(agentLen > this.agents.length  + cusAgentList.length) {
            // For v1.1.1 after user config
            for (var j=0; j<agentLen; ++j) {
                if (this.agents.indexOf(agentList[j].split("|")[0]) == -1) {
                    showAgents = showAgents.replace(agentList[j] + ",", "");
                }
            }
            this.setValue("showAgents", showAgents);
            agentList = showAgents.split(",");
        }
        
        if (defAgent != agentList[0]) {
            // Default agent must be first
            showAgents = defAgent + "," + showAgents.replace(","+defAgent+"|0,", ",").replace(","+defAgent+",", ",");
            this.setValue("showAgents", showAgents);
            agentList = showAgents.split(",");
        }
        
        agentList.pop();    // Last element is an empty string
        return agentList;
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
        return this.getValue("agentName");
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
    
    getAgentsNonsupURL : function(trimmedUrl) {
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
        this.getBranch();
        return this.pref.getComplexValue(prefName, Components.interfaces.nsISupportsString).data;
    },
    
    setUnicodeValue : function(prefName, value) {
        this.getBranch();
        var str = Components.classes["@mozilla.org/supports-string;1"].createInstance(Components.interfaces.nsISupportsString);
        str.data = value;
        this.pref.setComplexValue(prefName, Components.interfaces.nsISupportsString, str);
    }
}
