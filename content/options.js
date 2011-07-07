var xThunderOptions = {
    oriStatusIcon : false,
    oriClickAdded : false,
    agentIdPre : "agent",

    loadPrefs : function() {
        //Get supported protocals and file extensions
        var rem = xThunderPref.getValue("remember");
        document.getElementById("remember").checked = rem;
        document.getElementById("supportExt").disabled = !rem;
        document.getElementById('downSubMenu').disabled = !xThunderPref.getValue("downInCxtMenu");
        document.getElementById('downAllHotKey').disabled = !xThunderPref.getValue("downAllInCxtMenu");
        var supstr = xThunderPref.getValue("supportClick");
        var supPros = supstr.split(",");
        for (var i=0; i<supPros.length-1; ++i) {
            document.getElementById(supPros[i]).checked = true;
        }

        //Get agents, click added and status icon
        this.getAgents();
        this.oriStatusIcon = xThunderPref.getValue("showStatusIcon");
        this.oriClickAdded = (supstr != "" || rem && xThunderPref.getValue("supportExt") != "");
    },

    savePrefs : function() {
        //Set supported protocals and file extensions
        var supstr = "";
        for (var i=0; i<xThunderPref.pros.length; ++i) {
            if (document.getElementById(xThunderPref.pros[i]).checked) {
                supstr += (xThunderPref.pros[i] + ",");
            }
        }
        xThunderPref.setValue("supportClick", supstr);
        var rem = document.getElementById("remember").checked ? 1 : 0;
        xThunderPref.setValue("remember", rem);

        //Set agents, click added and status icon
        this.setAgents();
        var clickAdd = (supstr != "" || rem && xThunderPref.getValue("supportExt") != "");
        var statusIcon = xThunderPref.getValue("showStatusIcon");
        var isToAddClick = (!this.oriClickAdded && clickAdd);
        var isToSetIcon = (statusIcon != this.oriStatusIcon);
        if (isToAddClick || isToSetIcon) {
            var wm = Components.classes["@mozilla.org/appshell/window-mediator;1"]
                            .getService(Components.interfaces.nsIWindowMediator);
            var e = wm.getEnumerator("navigator:browser");
            while(e.hasMoreElements()) {
                var mainWindow = e.getNext();
                if (mainWindow.xThunderMain) {
                    if (isToAddClick)
                        mainWindow.xThunderMain.addClickSupport();
                    if (isToSetIcon)
                        mainWindow.xThunderMain.setIconVisible(statusIcon);
                }
            }
        }
    },

    getAgents : function() {
        //create default agent list
        xThunderPref.appendAgentList(document.getElementById("defagentPopup"), "defagent");
        document.getElementById("defagentList").value = xThunderPref.getValue("agentName");

        //create all agents checkbox
        var showAgents = xThunderPref.getValue("showAgents").split(",");
        var stringBundle = document.getElementById("xThunderAgentStrings");
        var nodeAgentRows = document.getElementById("agentRows");
        var nodeRow;

        for (var i=0; i<xThunderPref.agents.length; ++i) {
            var agentName = xThunderPref.agents[i];
            createAgentCB({
                id : this.agentIdPre + agentName,
                label : stringBundle.getString(agentName),
                oncommand : "xThunderOptions.toolgeAgent(this);"
            }, i, agentName);
        }

        function createAgentCB(atrs, index, agentName){
            var cb = document.createElement("checkbox");    
            cb.setAttribute("checked", xThunderPref.inArray(agentName, showAgents));
            for(var k in atrs)
                cb.setAttribute(k, atrs[k]);

            //two agent in one row
            if((index & 1) == 0) {
                nodeRow = document.createElement("row");
                nodeAgentRows.appendChild(nodeRow);
            }
            nodeRow.appendChild(cb);
        }
    },

    toolgeAgent : function(target) {
        document.getElementById('def'+target.id).setAttribute('hidden', !target.checked);
        var defAgentList = document.getElementById('defagentList');
        //default agent be uncheck, choose first available agent
        if (!document.getElementById(this.agentIdPre + defAgentList.value).checked) {
            for (var j=0; j<xThunderPref.agents.length; ++j) {
                if (document.getElementById(this.agentIdPre + xThunderPref.agents[j]).checked) {
                    defAgentList.value = xThunderPref.agents[j];
                    return;
                }
            }
            //all agent be uncheck, choose first agent
            document.getElementById('defagentList').value = xThunderPref.agents[0];
        }
    },

    setAgents : function() {
        var defAgent = document.getElementById("defagentList").value;
        var showAgentStr = "";
        for (var j=0; j<xThunderPref.agents.length; ++j) {
            if (document.getElementById(this.agentIdPre + xThunderPref.agents[j]).checked) {
                showAgentStr += (xThunderPref.agents[j] + ",");
            }
        }
        if (showAgentStr == "") {
            showAgentStr = defAgent + ",";
        }
        
        xThunderPref.setValue("showAgents", showAgentStr);
        xThunderPref.setValue("agentName", defAgent);
    }
}