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

            // Workaround for bug 371508
            try {
                window.sizeToContent();
            }
            catch (ex) {}	
        }
    }

    function download() {
        var de = document.documentElement;
        var url = dialog.mLauncher.source.spec;
        var referrer;
        try {
            var openerDocument = dialog.mContext.QueryInterface(Components.interfaces.nsIInterfaceRequestor)
                                            .getInterface(Components.interfaces.nsIDOMWindow).document;   
            referrer = openerDocument && openerDocument.URL                            
        } catch(ex) {}
        if (!referrer || referrer == "about:blank") {
            referrer = "";
        }

        xThunder.apiDownSingleUrl(referrer, url, $("xThunderAgentList").value);
        de.removeAttribute("ondialogaccept");
        de.removeAttribute("onblur");
        de.removeAttribute("onfocus");
        de.cancelDialog();
    } // end download function

    if (!xThunderPref.getValue("downInSaveFile")) {
        $("xThunderDown").setAttribute("hidden", true);
        return;
    } 

    var xThunderRadio = $("xThunderRadio");
    xThunderPref.appendAgentList($("xThunderAgentPopup"), "xThunderAgent", null, false, xThunderPref.getValue("downOffLineInSaveFile"));
    $("xThunderAgentList").value = xThunderPref.getValue("agentName");
    $("xThunderAgentList").setAttribute("hidden", !xThunderPref.getValue("downListInSaveFile"));

    var ext = dialog.mLauncher.suggestedFileName.split(".");
    ext = ext.length > 0 ? "." + ext[ext.length -1].toLowerCase() + ";" : "";
    var supportExt = xThunderPref.getValue("supportExt");
    var remExt = xThunderPref.getValue("remember");
    var extExists = supportExt.indexOf(ext) != -1;
    if (extExists && remExt > 0) {
        download();
        return;
    }

    forceNormal();

    var mode = $("mode");

    //same width as open radio
    var openRadio = $("open");
    if(openRadio) {
        var maxWidth = Math.max(openRadio.boxObject.width, xThunderRadio.boxObject.width);
        if(maxWidth > 0) openRadio.width = xThunderRadio.width = maxWidth;
    }

    if (extExists) {
        mode.selectedItem = xThunderRadio;
    } 

	addEventListener("dialogaccept", function() {
		if (mode.selectedItem == xThunderRadio) {
            if (!extExists) {
                xThunderPref.setValue("supportExt", ext + supportExt);
            }

            download();
		} else {
            if (extExists) {
                xThunderPref.setValue("supportExt", supportExt.replace(ext, ""));
            }
        }
	}, false); // dialogaccept
    
}, false); // load