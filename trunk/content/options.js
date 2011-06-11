var xThunderOption = {
    pros : ["thunder", "flashget", "qqdl", "fs2you", "ed2k", "magnet", "115", "udown"],
    agents: ["Thunder", "ToolbarThunder", "QQDownload", "BuiltIn"],
    oriStatusIcon : false,

    loadPrefs : function() {
        //Get supported protocals and file extensions
        var rem = xThunderPref.getValue("remember");
        document.getElementById("remember").checked = rem;
        document.getElementById("supportExt").disabled = !rem;
        var supPros = xThunderPref.getValue("supportClick").split(",");
        for (var i=0; i<supPros.length-1; ++i) {
            document.getElementById(supPros[i]).checked = true;
        }

        //Get agents and status icon
        this.getAgents();
        this.oriStatusIcon = xThunderPref.getValue("showStatusIcon");
    },

    getAgents : function() {
        var stringBundle = document.getElementById("xThunderAgentStrings");
        var nodeAgentRows = document.getElementById("agentRows");
        var nodeRow;
        var nodeDefagentPopup = document.getElementById("defagentPopup");
        
        for (var i=0; i<this.agents.length; ++i) {
            createAgentCB({
                id : "agent" + this.agents[i],
                label : stringBundle.getString(this.agents[i]),
                oncommand : "xThunderOption.toolgeAgent(this);"
            }, i);
            createDefagentMI({
                id : "defagent" + this.agents[i],
                label : stringBundle.getString(this.agents[i]),
                value : this.agents[i],
                hidden : "true"
            });
        }

        var showAgents = xThunderPref.getValue("showAgents").split(",");
        for (var j=0; j<showAgents.length-1; ++j) {
            document.getElementById("agent" + showAgents[j]).checked = true;
            document.getElementById("defagent" + showAgents[j]).setAttribute('hidden',false);
        }
        document.getElementById("defagentList").value = xThunderPref.getValue("agentName");
        

        function createAgentCB(atrs, index){
            var cb = document.createElement("checkbox");
            for(var k in atrs)
                cb.setAttribute(k, atrs[k]);

            //two agent in one row
            if((index & 1) == 0) {
                nodeRow = document.createElement("row");
                nodeAgentRows.appendChild(nodeRow);
            }
            nodeRow.appendChild(cb);
        }

        function createDefagentMI(atrs){
            var mi = document.createElement("menuitem");
            for(var k in atrs)
                mi.setAttribute(k, atrs[k]);
            return nodeDefagentPopup.appendChild(mi);
        }
    },

    toolgeAgent : function(target) {
        document.getElementById('def'+target.id).setAttribute('hidden', !target.checked);
        var defAgentList = document.getElementById('defagentList');
        if (!document.getElementById("agent" + defAgentList.value).checked) {
            for (var j=0; j<this.agents.length; ++j) {
                if (document.getElementById("agent" + this.agents[j]).checked) {
                    defAgentList.value = this.agents[j];
                    return;
                }
            }
            document.getElementById('defagentList').value = this.agents[0];
        }
    },

    savePrefs : function() {
        //Set supported protocals and file extensions
        var supstr = "";
        for (var i=0; i<this.pros.length; ++i) {
            if (document.getElementById(this.pros[i]).checked) {
                supstr += (this.pros[i] + ",");
            }
        }
        xThunderPref.setValue("supportClick", supstr);
        xThunderPref.setValue("remember", document.getElementById("remember").checked ? 1 : 0);

        //Set agents and status icon
        this.setAgents();
        var statusIcon = xThunderPref.getValue("showStatusIcon");
        if (statusIcon != this.oriStatusIcon) {
            var wm = Components.classes["@mozilla.org/appshell/window-mediator;1"]
                            .getService(Components.interfaces.nsIWindowMediator);
            var e = wm.getEnumerator("navigator:browser");
            while(e.hasMoreElements()) {
                var mainWindow = e.getNext();
                if (mainWindow.xThunderMain) {
                    mainWindow.xThunderMain.setIconVisible(statusIcon);
                }
            }
        }
    },

    setAgents : function() {
        var defAgent = document.getElementById("defagentList").value;
        var agentstr = "";
        for (var j=0; j<this.agents.length; ++j) {
            if (document.getElementById("agent" + this.agents[j]).checked) {
                agentstr += (this.agents[j] + ",");
            }
        }
        if (agentstr == "") {
            agentstr = defAgent + ",";
        }
        
        xThunderPref.setValue("showAgents", agentstr);
        xThunderPref.setValue("agentName", defAgent);
    }
}