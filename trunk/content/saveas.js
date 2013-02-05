////////////////////////////////////////////////////////////
//	Save as file dialog,require xThunder.js,pref.js
////////////////////////////////////////////////////////////
window.addEventListener("load", function() {
    function $() {
        if (arguments.length == 1) {
            return document.getElementById(arguments[0]);
        }
        var elements = [];
        for (var i = 0, e = arguments.length; i < e; ++i) {
            var id = arguments[i];
            var element = document.getElementById(id);
            if (element) {
                elements.push(element);
            }
        }
        return elements;
    }

    function forceNormal() {
        var basicBox = $("basicBox");
        var normalBox = $("normalBox");
        if(basicBox && (!basicBox.collapsed || (normalBox && normalBox.collapsed))) {
            ["open"].forEach(
                function(e) {
                    e = $(e);
                    e.parentNode.collapsed = true;
                    e.disabled = true;
                }
            );
            normalBox.collapsed = false;
            var nodes = normalBox.getElementsByTagName("separator");

            for (var i = 0; i < nodes.length; ++i) {
                nodes[i].collapsed = true;
            }

            basicBox.collapsed = true;
            normalBox.collapsed = false;

            // Work around BUG 371508
            try {
                window.sizeToContent();
            } catch (ex) {}	
        }
    }
        
    function copyUrl() {
        var gClipboardHelper = Components.classes["@mozilla.org/widget/clipboardhelper;1"].
                getService(Components.interfaces.nsIClipboardHelper);
        gClipboardHelper.copyString(dialog.mLauncher.source.spec);
    }

    function download(agentName) {
        var de = document.documentElement;
        var url = dialog.mLauncher.source.spec;
        var referrer;
        try {
            var openerDocument = top.opener && top.opener.content && top.opener.content.document || 
                dialog.mContext.QueryInterface(Components.interfaces.nsIInterfaceRequestor).
                    getInterface(Components.interfaces.nsIDOMWindow).document; 
   
            referrer = openerDocument.URL                            
        } catch(ex) {}
        if (!referrer || referrer == "about:blank") {
            referrer = "";
        }

        xThunder.apiDownUrl(referrer, url, agentName || $("xThunderAgentList").value);
        de.removeAttribute("ondialogaccept");
        de.removeAttribute("onblur");
        de.removeAttribute("onfocus");
        de.cancelDialog();
    }
    
    var radioExists = xThunderPref.getValue("downInSaveFile");
    $("xThunderDown").hidden = !radioExists;
    var downOffLineExists = xThunderPref.getValue("downOffLineInSaveFile");
    var xThunderRadio = $("xThunderRadio");
    var xThunderAgentList = $("xThunderAgentList");
    xThunderPref.appendAgentList($("xThunderAgentPopup"), "xThunderAgent", null, false, downOffLineExists);
    xThunderAgentList.value = xThunderPref.getDefaultAgent();
    xThunderAgentList.hidden = !xThunderPref.getValue("downListInSaveFile");

    var ext = dialog.mLauncher.suggestedFileName.split(".");
    ext = ext.length > 0 ? "." + ext[ext.length -1].toLowerCase() + ";" : "";
    var remExt = xThunderPref.getValue("remember");
    var extExists = xThunderPref.getValue("supportExt").indexOf(ext) != -1;
    if (extExists && remExt > 0) {
        download();
        return;
    }

    var mode = $("mode");
    
    if (radioExists) {
        // Show radio for EXE dialog
        forceNormal();
            
        // Same width as open radio
        var openRadio = $("open");
        if (openRadio) {
            var maxWidth = Math.max(openRadio.boxObject.width, xThunderRadio.boxObject.width);
            if (maxWidth > 0) {
                openRadio.width = xThunderRadio.width = maxWidth;
            }
        }
        
        if (extExists) {
            mode.selectedItem = xThunderRadio;
        } 
    }
    
    // Mouse middle click and right click on accept button
    var acceptBtn = document.documentElement.getButton("accept");
    if (acceptBtn) {
        acceptBtn.addEventListener("click", function(event) {
            if (mode.selectedItem == xThunderRadio && event.button != 0) {
                download(xThunderPref.getAgentByClick(event, downOffLineExists));
            }
        }, false);
    }

    // Mouse left click or Enter key on accept button
    addEventListener("dialogaccept", function() {
        if (mode.selectedItem == xThunderRadio) {
            download();
        } 
    }, false); // Dialogaccept
    
    // Create a menu-button to download by xThunder
    if (xThunderPref.getValue("downBtnInSaveFile")) {
        var xThunderBtn = document.createElement("button");
        var xThunderBtnPopup = null;
        if (xThunderBtn && acceptBtn) {
            var btns = acceptBtn.parentNode.childNodes;
            for (var i = btns.length-1; i >= 0; --i) {
                if (btns[i].getAttribute("dlgtype") == "accept" || btns[i].getAttribute("dlgtype") == "cancel") {
                    acceptBtn.parentNode.insertBefore(xThunderBtn, btns[i]);
                    break;
                }
            }
            
            if (xThunderAgentList.itemCount > 1 && xThunderPref.getValue("downListInSaveFile")) {
                var popDisAllowed = false;
                xThunderBtn.type = "menu";
                xThunderBtn.addEventListener("mousedown", function(event) {
                    popDisAllowed = event.button == 0 && event.target.boxObject.x + event.target.boxObject.width - event.clientX > 20;
                }, false);
                xThunderBtnPopup = document.createElement("menupopup");
                xThunderBtnPopup.addEventListener("popupshowing", function(event) {
                    if (popDisAllowed) {
                        event.preventDefault();
                    }
                }, false);
                xThunderPref.appendAgentList(xThunderBtnPopup, "xThunderBtnAgent", null, false, downOffLineExists);
                var popMenuItems = xThunderBtnPopup.childNodes;
                for (var j = 0; j < popMenuItems.length; ++j) {
                    popMenuItems[j].className = "menuitem-non-iconic";
                    popMenuItems[j].addEventListener("click", function(event) {
                        download(this.value);
                    }, false);
                }
                xThunderBtn.appendChild(xThunderBtnPopup);
            }
            xThunderBtn.id = "xThunderDownBtn";
            xThunderBtn.label = "xThunder";
            xThunderBtn.className = acceptBtn.className;
            xThunderBtn.addEventListener("click", function(event) {
                if (event.target == this) {
                    if (event.button == 0 && event.ctrlKey && event.altKey) {    
                        copyUrl();
                    } else if (xThunderBtn.type != "menu" || event.button != 0 || event.target.boxObject.x + event.target.boxObject.width - event.clientX > 20) {
                        download(xThunderPref.getAgentByClick(event, downOffLineExists));
                    }
                }
            }, false);
        }
    }
 
}, false); // End load function