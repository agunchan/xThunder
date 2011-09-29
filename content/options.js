var xThunderOptions = {
    oriStatusIcon : false,
    oriClickAdded : false,
    agentListBox : null,
    

    loadPrefs : function() {
        //Get supported protocals and file extensions
        var rem = xThunderPref.getValue("remember");
        document.getElementById("remember").checked = rem;
        for (var i=0; i<xThunderPref.pros.length; ++i) {
            document.getElementById(xThunderPref.pros[i]).checked = false;
        }
        var supstr = xThunderPref.getValue("supportClick");
        var supPros = supstr.split(",");
        for (var j=0; j<supPros.length-1; ++j) {
            document.getElementById(supPros[j]).checked = true;
        }

        //Get interface
        document.getElementById("downSubMenu").disabled = !xThunderPref.getValue("downInCxtMenu");
        document.getElementById("downAllHotKey").disabled = !xThunderPref.getValue("downAllInCxtMenu");
        document.getElementById("downListInSaveFile").disabled = !xThunderPref.getValue("downInSaveFile");
        document.getElementById("downOffLineAnyway").disabled = !xThunderPref.getValue("downOffLineInCxtMenu");
        
        //Get agents, click added and status icon
        this.getAgents();
        this.oriStatusIcon = xThunderPref.getValue("showStatusIcon");
        this.oriClickAdded = (supstr != "" || rem && xThunderPref.getValue("supportExt") != "");
    },

    savePrefs : function() {
        try {
            //Writes all changes in pre pane to preferences
            document.getElementById("prepaneMain").writePreferences();

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
        } catch(ex) {
            // no op
        }
    },
    
    restoreDefPrefs : function() {
        try {
            var prefNames = xThunderPref.getBranch().getChildList( "", {} );
            for each (var aPrefName in prefNames) {
                if (xThunderPref.pref.prefHasUserValue(aPrefName))
                    xThunderPref.pref.clearUserPref(aPrefName);
            }

            this.loadPrefs();
        } catch (ex) {
            // no op
        }
    },

    getAgents : function() {
        //create agent list
        var agentListBox = this.agentListBox = document.getElementById("agentListBox");
        while(agentListBox.lastChild) {
            agentListBox.removeChild(agentListBox.lastChild);
        }
        var stringBundle = document.getElementById("xThunderAgentStrings");
        var agentList = xThunderPref.getFixedAgentList();
        for (var i=0; i<agentList.length; ++i) {
            var agentItem = agentList[i].split("|");
            var agent = agentItem[0];
            createListitem({
                label : stringBundle.getString(agent),
                value : agent,
                type  : "checkbox",
                checked : agentItem.length == 1
            });
        }

        function createListitem(atrs){
            var li = document.createElement("listitem");
            for(var k in atrs)
                li.setAttribute(k, atrs[k]);
            return agentListBox.appendChild(li);
        }
    },

    setAgents : function() {
        var listitems = this.agentListBox.childNodes;
        var defAgent;
        var enableAgents = "";
        var disableAgents = "";
        for (var i=0; i<listitems.length; ++i) {
            if (listitems[i].checked) {
                if (!defAgent)
                    defAgent = listitems[i].value;
                enableAgents += listitems[i].value + ",";
            } else {
                disableAgents += listitems[i].value + "|0,";
            }
        }
        if (!defAgent) {
            //select first agent when all agents are disabled
            defAgent = listitems[0].value;
            enableAgents = defAgent + ",";
            disableAgents = disableAgents.replace(defAgent + "|0,", "");
        }
//        if (enableAgents == defAgent + ",") {
//            //close submenu and dropdown if there is only one agent
//            xThunderPref.setValue("downSubMenu", false);
//            xThunderPref.setValue("downListInSaveFile", false);
//        }

        xThunderPref.setValue("agentName", defAgent);
        xThunderPref.setValue("showAgents", enableAgents + disableAgents);
    },

    agentListSelect : function() {
        var moveUpButton = document.getElementById("moveUpButton");
        var moveDownButton = document.getElementById("moveDownButton");

        if(this.agentListBox.selectedIndex == 0) {
            moveUpButton.setAttribute("disabled", "true");
            moveDownButton.setAttribute("disabled", "false");
        } else if(this.agentListBox.selectedIndex == this.agentListBox.itemCount-1) {
            moveUpButton.setAttribute("disabled", "false");
            moveDownButton.setAttribute("disabled", "true");
        } else {
            moveUpButton.setAttribute("disabled", "false");
            moveDownButton.setAttribute("disabled", "false");
        }
    },

    moveCurAgent : function(offset) {
        var curIndex = this.agentListBox.selectedIndex;
        var oldItem = this.agentListBox.removeItemAt(curIndex);
        var newItem = this.agentListBox.insertItemAt(curIndex+offset, oldItem.getAttribute("label"), oldItem.getAttribute("value") );
        newItem.setAttribute("type", oldItem.getAttribute("type"));
        newItem.setAttribute("checked", oldItem.getAttribute("checked"));
        this.agentListBox.selectedIndex = curIndex+offset;
        this.agentListBox.focus();
    }
}