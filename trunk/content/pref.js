var xThunderPref = {
    pref : null,
    pros : ["thunder", "flashget", "qqdl", "fs2you", "ed2k", "magnet", "115", "udown"],
    agents: ["Thunder", "ToolbarThunder", "QQDownload", "FlashGet3", "BitComet", "IDM", "DTA", "BuiltIn"],
    agentsNonsup : { "ed2k"   : ["BitComet", "IDM", "DTA", "BuiltIn"],
                     "magnet" : ["ToolbarThunder", "IDM", "DTA", "BuiltIn"],
                     "flashgetx" : ["Thunder", "ToolbarThunder", "QQDownload", "BitComet", "IDM", "DTA", "BuiltIn"] },

    //show only available agents in list
    appendAgentList : function(menupop, idpre, func, isradio){
        var ownDoc = menupop.ownerDocument;
        var defAgentName = this.getValue("agentName");
        if (!ownDoc.getElementById(idpre + defAgentName)) {
            //create menu item
            var stringBundle = ownDoc.getElementById("xThunderAgentStrings");
            for (var i=0; i<this.agents.length; ++i) {
                menuitem({
                    id : idpre + this.agents[i],
                    label : stringBundle.getString(this.agents[i]),
                    value : this.agents[i],
                    oncommand : func ? (func + "('" + this.agents[i] + "')") : ""
                });
            }
        }

        //show customized agents
        var showAgents = this.getValue("showAgents").split(",");
        for (var j=0; j<this.agents.length; ++j) {
            var mi = ownDoc.getElementById(idpre + this.agents[j]);
            mi.setAttribute('hidden', !this.inArray(this.agents[j], showAgents));
            mi.className = "";
        }

        //check default agent
        if (isradio) {
            ownDoc.getElementById(idpre + defAgentName).setAttribute("checked", true);
        }

        function menuitem(atrs){
            var mi = ownDoc.createElement("menuitem");
            for(var k in atrs)
                mi.setAttribute(k, atrs[k]);
            if(isradio) {
                mi.setAttribute("name", "agent");
                mi.setAttribute("type", "radio");
            }
            return menupop.appendChild(mi);
        }
    },

    inArray : function(agentName, agentsArray) {
        for (var i = 0; i < agentsArray.length; ++i)
            if (agentName == agentsArray[i])
                return true;
        return false;
    },

    isAgentNonsupURL : function(agentName, url) {
        return this.inArray(agentName, this.getAgentsNonsupURL(url));
    },

    getAgentsNonsupURL : function(trimmedUrl) {
        for (var pro in this.agentsNonsup) {
            if (trimmedUrl.indexOf(pro + ":") == 0) {
                return this.agentsNonsup[pro];
            }
        }
        return [];
    },

    getBranch : function()
    {
        if (this.pref == null)
        {
            this.pref = Components.classes["@mozilla.org/preferences-service;1"].
                            getService(Components.interfaces.nsIPrefService).
                            getBranch('extensions.xthunder.');
        }
        return this.pref;
    },

    getValue: function(prefName, defaultValue)
    {
        var prefType=this.getBranch().getPrefType(prefName);

        switch (prefType)
        {
            case this.pref.PREF_STRING: return this.pref.getCharPref(prefName);
            case this.pref.PREF_BOOL: return this.pref.getBoolPref(prefName);
            case this.pref.PREF_INT: return this.pref.getIntPref(prefName);
            default: return defaultValue || 0;
        }
    },

    setValue: function(prefName, value)
    {
        var prefType=typeof(value);
        if (prefType != typeof(this.getValue(prefName)))
        {
            this.pref.deleteBranch(prefName);
        }

        switch (prefType)
        {
        case "string":
            this.pref.setCharPref(prefName, value);
            break;
        case "boolean":
            this.pref.setBoolPref(prefName, value);
            break;
        case "number":
            if (value % 1 != 0)
            {
                throw new Error("Cannot set preference to non integral number");
            }
            else
            {
                this.pref.setIntPref(prefName, Math.floor(value));
            }
            break;
        default:
            throw new Error("Cannot set preference with datatype: " + prefType);
        }
    }
}
