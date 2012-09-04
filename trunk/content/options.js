var xThunderOptions = {
    oriStatusIcon : false,
    oriClickAdded : false,
    agentListBox : null,
    

    loadPrefs : function() {
        // Get supported protocals and file extensions
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

        // Get interface
        document.getElementById("downSubMenu").disabled = !xThunderPref.getValue("downInCxtMenu");
        
        // Get agents, click added and status icon
        this.getAgents();
        this.oriStatusIcon = xThunderPref.getValue("showStatusIcon");
        this.oriClickAdded = (supstr != "" || rem && xThunderPref.getValue("supportExt") != "");
    },

    savePrefs : function() {
        try {
            // Writes all changes in pre pane to preferences
            document.getElementById("prepaneMain").writePreferences();

            // Set supported protocals and file extensions
            var supstr = "";
            for (var i=0; i<xThunderPref.pros.length; ++i) {
                if (document.getElementById(xThunderPref.pros[i]).checked) {
                    supstr += (xThunderPref.pros[i] + ",");
                }
            }
            xThunderPref.setValue("supportClick", supstr);
            var rem = document.getElementById("remember").checked ? 1 : 0;
            xThunderPref.setValue("remember", rem);

            // Set agents, click added and status icon
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
        } catch(ex) {}
    },
    
    restoreDefPrefs : function() {   
        try {
            var promptService = Components.classes["@mozilla.org/embedcomp/prompt-service;1"].
                getService(Components.interfaces.nsIPromptService);
            var message = document.getElementById("xThunderAgentStrings").getString("ConfirmRestore");                    
            if (!promptService.confirm(window, "xThunder", message)) {
                return;
            }
            var prefNames = xThunderPref.getBranch().getChildList( "", {} );
            for (var key in prefNames) {
                if (xThunderPref.pref.prefHasUserValue(prefNames[key]))
                    xThunderPref.pref.clearUserPref(prefNames[key]);
            }

            this.loadPrefs();
        } catch (ex) {}
    },

    getAgents : function() {   
        // Create agent list
        var agentListBox = this.agentListBox = document.getElementById("agentListBox");
        while(agentListBox.lastChild) {
            agentListBox.removeChild(agentListBox.lastChild);
        }
        var stringBundle = document.getElementById("xThunderAgentStrings");
        var agentList = xThunderPref.getFixedAgentList();
        var cusAgentList = xThunderPref.getUnicodeValue("agent.custom").split(",");
        for (var i=0; i<agentList.length; ++i) {
            var agentItem = agentList[i].split("|");
            var agent = agentItem[0];
            createListItem({
                label : agent.indexOf("custom") != -1 ? cusAgentList[agent.split("custom")[1]] 
                                                      : stringBundle.getString(agent),
                value : agent,
                type  : "checkbox",
                checked : agentItem.length == 1
            });
        }        
        if (cusAgentList.length > 1) {
            // Work around BUG 250123 - listitem.value == undefined if listitem never visible
            var visibleIndex = this.agentListBox.itemCount - 1;
            var visibleRows = this.agentListBox.getNumberOfVisibleRows();
            while(visibleIndex >= visibleRows) {
                this.agentListBox.ensureIndexIsVisible(visibleIndex);
                visibleIndex -= visibleRows;
            }
            this.agentListBox.scrollToIndex(0);
        }
        this.agentListSelect();
        
        function createListItem(atrs) {
            var li = document.createElement("listitem");
            for(var k in atrs)
                li.setAttribute(k, atrs[k]);
            return agentListBox.appendChild(li);    
        }
    },

    setAgents : function() {
        var listitems = this.agentListBox.childNodes;
        var enableAgents = "";
        var disableAgents = "";
        for (var i=0; i<listitems.length; ++i) {
            var agentValue = listitems[i].value;
            if (typeof agentValue == "undefined") {
                alert("BUG 250123: agentItem " + i + " undefined");
                return;
            }
            if (listitems[i].checked) {
                enableAgents += agentValue + ",";
            } else {
                disableAgents += agentValue + "|0,";
            }
        }
        if (!enableAgents) {
            // Select first agent when all agents are disabled
            enableAgents = listitems[0].value + ",";
            disableAgents = disableAgents.replace(listitems[0].value + "|0,", "");
        }

        xThunderPref.setAgentsListStr(enableAgents + disableAgents);
    },

    agentListSelect : function() {
        var moveUpButton = document.getElementById("moveUpButton");
        var moveDownButton = document.getElementById("moveDownButton");
        var editButton = document.getElementById("editButton");
        var removeButton = document.getElementById("removeButton");
        
        if (this.agentListBox.selectedIndex < 0) {
            moveUpButton.setAttribute("disabled", "true");
            moveDownButton.setAttribute("disabled", "true");
            editButton.setAttribute("hidden", "true");
            removeButton.setAttribute("hidden", "true");
        } else {
            if (this.agentListBox.selectedIndex == 0) {
                moveUpButton.setAttribute("disabled", "true");
                moveDownButton.setAttribute("disabled", "false");
            } else if (this.agentListBox.selectedIndex == this.agentListBox.itemCount-1) {
                moveUpButton.setAttribute("disabled", "false");
                moveDownButton.setAttribute("disabled", "true");
            } else {
                moveUpButton.setAttribute("disabled", "false");
                moveDownButton.setAttribute("disabled", "false");
            }

            var isCustomAgent = this.agentListBox.selectedItem.value.indexOf("custom") != -1;
            editButton.setAttribute("hidden", !isCustomAgent);
            removeButton.setAttribute("hidden", !isCustomAgent);
        }
    },

    moveSelAgent : function(offset) {
        var selIndex = this.agentListBox.selectedIndex;
        if (selIndex < 0)
            return;
        var selAgentItem = this.agentListBox.selectedItem;
        var targetIndex = selIndex + offset;
        var targetItem = this.agentListBox.getItemAtIndex(targetIndex);
        var tempLabel = selAgentItem.label;
        var tempValue = selAgentItem.value;
        var tempChecked = selAgentItem.checked;
        selAgentItem.label = targetItem.label;
        selAgentItem.value = targetItem.value;
        selAgentItem.checked = targetItem.checked;
        targetItem.label = tempLabel;
        targetItem.value = tempValue;
        targetItem.checked = tempChecked;
        this.agentListBox.selectedIndex = targetIndex;
        this.agentListBox.ensureIndexIsVisible(targetIndex);
        this.agentListBox.focus();
    },
    
    editCustAgent : function() {
        var selAgentItem = this.agentListBox.selectedItem;
        document.getElementById("agentName").value = selAgentItem.label;
        document.getElementById("agentExe").value = xThunderPref.getUnicodeValue("agent." + selAgentItem.value + ".exe");
        document.getElementById("agentArgs").value = xThunderPref.getUnicodeValue("agent." + selAgentItem.value + ".args");
        this.showCustAgent(true);
        this.editingAgentItem = selAgentItem;
    },
    
    removeCustAgent : function() {
        var selIndex = this.agentListBox.selectedIndex;
        var selAgentItem = this.agentListBox.removeItemAt(selIndex);
        var nextItem = this.agentListBox.getItemAtIndex(selIndex == this.agentListBox.itemCount ? selIndex-1 : selIndex);
        this.agentListBox.ensureElementIsVisible(nextItem); // Work around BUG 250123 
        this.agentListBox.selectedItem = nextItem;
        this.agentListBox.focus();
        var cusAgentStr = xThunderPref.getUnicodeValue("agent.custom");
        var cusAgentList = cusAgentStr.split(",");
        var cusAgentIdx = selAgentItem.getAttribute("value").split("custom")[1];
        var lastAgentIdx = cusAgentList.length - 2;
        
        // Swap with last agent
        if (cusAgentIdx != lastAgentIdx) {
            cusAgentList[cusAgentIdx] = cusAgentList[lastAgentIdx];
            xThunderPref.setUnicodeValue("agent.custom"+cusAgentIdx+".exe", xThunderPref.getUnicodeValue("agent.custom"+lastAgentIdx+".exe"));
            xThunderPref.setUnicodeValue("agent.custom"+cusAgentIdx+".args", xThunderPref.getUnicodeValue("agent.custom"+lastAgentIdx+".args"));
            var listitems = this.agentListBox.childNodes;
            for (var i=0; i<listitems.length; ++i) {
                if (listitems[i].value == "custom"+lastAgentIdx) {
                    listitems[i].value =  "custom"+cusAgentIdx;
                    break;
                }
            }
        }
        // Remove last agent
        cusAgentList.splice(lastAgentIdx, 1);
        xThunderPref.setUnicodeValue("agent.custom", cusAgentList.join(","));
        xThunderPref.pref.clearUserPref("agent.custom"+lastAgentIdx+".exe");
        xThunderPref.pref.clearUserPref("agent.custom"+lastAgentIdx+".args");
        this.setAgents();
    },
        
    customizeAgent : function() {
        var txtAgentName = document.getElementById("agentName");
        var txtAgentExe = document.getElementById("agentExe");
        var txtAgentArgs = document.getElementById("agentArgs");
        if (!txtAgentName.value) {
            txtAgentName.focus();
            return false;
        }
        if (!txtAgentExe.value) {
            this.locateExe();
            return false;
        }
        
        var cusAgentStr = xThunderPref.getUnicodeValue("agent.custom");
        var cusAgentIdx = 0;
        if (this.editingAgentItem) {
            cusAgentIdx = this.editingAgentItem.value.split("custom")[1];
            // Set agentListItem
            this.editingAgentItem.label = txtAgentName.value;
            this.agentListBox.focus();
            // Set pref
            var cusAgentList = cusAgentStr.split(",");
            cusAgentList[cusAgentIdx] = txtAgentName.value;
            xThunderPref.setUnicodeValue("agent.custom", cusAgentList.join(","));
            xThunderPref.setUnicodeValue("agent.custom" + cusAgentIdx + ".exe", txtAgentExe.value);
            xThunderPref.setUnicodeValue("agent.custom" + cusAgentIdx + ".args", txtAgentArgs.value);
        } else {
            cusAgentIdx = cusAgentStr.split(",").length - 1;
            // Add to agentListBox
            var listitems = this.agentListBox.childNodes;
            var i;
            for (i=listitems.length-1; i>=0; --i) {
                if (listitems[i].checked) {
                    break;
                }
            }
            var newItem = this.agentListBox.insertItemAt(i+1, txtAgentName.value, "custom"+cusAgentIdx);
            newItem.setAttribute("type", "checkbox");
            newItem.setAttribute("checked", true);
            this.agentListBox.ensureElementIsVisible(newItem); // Work around BUG 250123 
            this.agentListBox.selectedItem = newItem;
            this.agentListBox.focus();
            // Add pref
            xThunderPref.setUnicodeValue("agent.custom", cusAgentStr + txtAgentName.value + ",");
            xThunderPref.setUnicodeValue("agent.custom" + cusAgentIdx + ".exe", txtAgentExe.value);
            xThunderPref.setUnicodeValue("agent.custom" + cusAgentIdx + ".args", txtAgentArgs.value);
            this.setAgents();
        }
        
        this.showCustAgent(false);
        return true;
    },
    
    ignoreCustAgent : function() {
        this.showCustAgent(false);
        this.agentListBox.focus();
        this.agentListSelect();
    },
    
    showCustAgent : function(visible) {
        this.editingAgentItem = null;
        document.getElementById("editButton").setAttribute("hidden", visible);
        document.getElementById("removeButton").setAttribute("hidden", visible);
        document.getElementById("newButton").setAttribute("hidden", visible);
        document.getElementById("tipGroup").setAttribute("hidden", visible);
        document.getElementById("newAgentGroup").setAttribute("hidden", !visible);
        if (visible) {
            document.getElementById("agentName").focus();
        }
        else {
            document.getElementById("agentName").value = "";
            document.getElementById("agentExe").value = "";
            document.getElementById("agentArgs").value = "";
        }
    },
    
    locateExe : function() {
        var fp = Components.classes["@mozilla.org/filepicker;1"].createInstance(Components.interfaces.nsIFilePicker);
        var wm = Components.classes["@mozilla.org/appshell/window-mediator;1"].getService(Components.interfaces.nsIWindowMediator);
        var mainWindow = wm.getMostRecentWindow(null);
        fp.init(mainWindow, "xThunder - Customize downloader", Components.interfaces.nsIFilePicker.modeOpen);
        fp.appendFilters(Components.interfaces.nsIFilePicker.filterApps);
        fp.appendFilters(Components.interfaces.nsIFilePicker.filterAll);

        if (fp.show() == Components.interfaces.nsIFilePicker.returnOK) {
            document.getElementById("agentExe").value = fp.file.path;
            var args = document.getElementById("agentArgs");
            if (args.value == "")
                args.value = "[URL]";
        }
    },
    
    insertAgentPH : function(phName) {
        var txtArgs = document.getElementById("agentArgs");
        var selStart = txtArgs.selectionStart;
        var selEnd = txtArgs.selectionEnd;
        txtArgs.value = txtArgs.value.substring(0,selStart) + phName + txtArgs.value.substring(selEnd);
        txtArgs.selectionStart = txtArgs.selectionEnd = selStart + phName.length;
        txtArgs.focus();
    }
}