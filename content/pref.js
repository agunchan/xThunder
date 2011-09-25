var xThunderPref = {
    pref : null,
    uriSupReg : /^(?:ftp|https?):/i,
    proSupReg : /^(thunder|flashget|qqdl|fs2you|ed2k|magnet):/i,
    pros : ["thunder", "flashget", "qqdl", "fs2you", "ed2k", "magnet", "115", "udown"],
    agents: ["Thunder", "ToolbarThunder", "QQDownload", "FlashGet3", "BitComet", "IDM", "DTA", "FlashGetMini", "ThunderLite", "Orbit", "FDM"],
    agentsNonsup : {"ed2k"   : ["BitComet", "IDM", "DTA", "FlashGetMini", "ThunderLite", "Orbit", "FDM"],
                    "magnet" : ["ToolbarThunder", "IDM", "DTA", "FlashGetMini", "ThunderLite", "Orbit", "FDM"],
                    "flashget" : ["Thunder", "ToolbarThunder", "QQDownload", "BitComet", "IDM", "DTA", "ThunderLite", "Orbit", "FDM"]},

    //show only available agents in list
    appendAgentList : function(menupop, idpre, func, isradio, addOffLine){
        var ownDoc = menupop.ownerDocument;
        while(menupop.firstChild) {
            menupop.removeChild(menupop.firstChild);
        }
        var stringBundle = document.getElementById("xThunderAgentStrings");
        var agentList = this.getEnabledAgentList(addOffLine);
        var downOffLineSep = this.getValue("downOffLineSep");
        for (var i=0; i<agentList.length; ++i) {
            var agent = agentList[i];
            var mi = createMenuitem({
                id : idpre + agent,
                label : stringBundle.getString(agent),
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

        function createMenuitem(atrs){
            var mi = ownDoc.createElement("menuitem");
            for(var k in atrs)
                mi.setAttribute(k, atrs[k]);
            return menupop.appendChild(mi);
        }
    },
    
    getEnabledAgentList : function(addOffLine) {
        var agentList = this.getFixedAgentList();
        var enableAgentList = [];
        for (var i=0; i<agentList.length; ++i) {
            var agentItem = agentList[i].split("|");
            var agent = agentItem[0];
            if (addOffLine && agent == "Thunder" && (!this.getValue("downOffLineAutoHide") || agentItem.length == 1)
                || addOffLine && agent == "QQDownload" && agentItem.length == 1) {
                //add Thunder anyway, but only QQDownload is available
                agentList.push(agent + "OffLine");
            }
            if (agentItem.length == 1) {
                enableAgentList.push(agent);
            }
        }
        return enableAgentList;
    },
    
    getFixedAgentList : function() {
        var showAgents = this.getValue("showAgents");
        var agentList = showAgents.split(",");
        if (agentList.length-1 < this.agents.length) {
            // for v1.0.2 before user config
            for (var i=0; i<this.agents.length; ++i) {
                if (!this.inArray(this.agents[i], agentList) && !this.inArray(this.agents[i]+"|0", agentList)) {
                    showAgents = showAgents + this.agents[i] + "|0,";
                }
            }
            this.setValue("showAgents", showAgents);
            agentList = showAgents.split(",");
        }
        var defAgent = this.getValue("agentName");
        if (defAgent != agentList[0]) {
            // default agent must be first
            showAgents = defAgent + "," + showAgents.replace(","+defAgent+"|0,", ",").replace(","+defAgent+",", ",");
            this.setValue("showAgents", showAgents);
            agentList = showAgents.split(",");
        }
        //last element is an empty string
        agentList.pop();
        return agentList;
    },

    inArray : function(agentName, agentsArray) {
        for (var i = 0; i < agentsArray.length; ++i)
            if (agentName == agentsArray[i])
                return true;
        return false;
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
            var fileName = names[names.length-1];
            var matches = fileName.match(/(\.\w+)$/i);
            if (matches && supExt.indexOf(matches[1] + ";") != -1) {
                download = true;
            } else if (subUrls.length > 1 && matches && /\.(jsp|php)/i.test(matches[1])) {
                //the parameter of jsp|php url may contain supporting ext
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
                            getService(Components.interfaces.nsIPrefService).
                            getBranch("extensions.xthunder.");
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
        var prefType=typeof(value);
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
            }
            else {
                this.pref.setIntPref(prefName, Math.floor(value));
            }
            break;
        default:
            throw new Error("Cannot set preference with datatype: " + prefType);
        }
    }
}
