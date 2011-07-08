////////////////////////////////////////////////////////////
//	Save as file dialog,require xThunder.js,pref.js
////////////////////////////////////////////////////////////
window.addEventListener('load', function() {
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
        var basicBox = $('basicBox');
        var normalBox = $('normalBox');
        if(basicBox && (!basicBox.collapsed || (normalBox && normalBox.collapsed))) {
            ['open'].forEach(
                function(e) {
                    e = $(e);
                    e.parentNode.collapsed = true;
                    e.disabled = true;
                }
            );
            normalBox.collapsed = false;
            var nodes = normalBox.getElementsByTagName('separator');

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
            referrer = dialog.mContext.QueryInterface(Components.interfaces.nsIWebNavigation).currentURI.spec;
        }
        catch(ex) {
            referrer = url;
        }

        xThunder.init(referrer, 1, $('xThunderAgentList').value);
        xThunder.addTask(url);
        xThunder.callAgent();
        de.removeAttribute('ondialogaccept');
        de.removeAttribute('onblur');
        de.removeAttribute('onfocus');
        de.cancelDialog();
    }

    if (!xThunderPref.getValue("downInSaveFile")) {
        $('xThunderDown').setAttribute("hidden", true);
        return;
    } 

    var xThunderRadio = $('xThunderRadio');
    xThunderPref.appendAgentList($('xThunderAgentPopup'), 'xThunderAgent');
    var xThunderAgentList = $('xThunderAgentList');
    xThunderAgentList.value = xThunderPref.getValue('agentName');
    xThunderAgentList.setAttribute("hidden", !xThunderPref.getValue('downListInSaveFile'));

    var ext = dialog.mLauncher.suggestedFileName.split('.');
    ext = ext.length > 0 ? "." + ext[ext.length -1].toLowerCase() + ";" : "";
    var supportExt = xThunderPref.getValue('supportExt');
    var rememberExt = xThunderPref.getValue('remember');
    var extExists = supportExt.indexOf(ext) != -1;
    if (extExists && rememberExt > 0) {
        download();
        return;
    }

    forceNormal();

    var mode = $('mode');
    var remember = $('rememberChoice');

    //same width as open radio
    var openRadio = $("open");
    if(openRadio) {
        var maxWidth = Math.max(openRadio.boxObject.width, xThunderRadio.boxObject.width);
        if(maxWidth > 0) openRadio.width = xThunderRadio.width = maxWidth;
    }

    if (extExists) {
        remember.checked = rememberExt;
        mode.selectedItem = xThunderRadio;
        remember.disabled = false;
    } 

    mode.addEventListener('select', function() {
		if (mode.selectedItem == xThunderRadio) {
			remember.disabled = false;
		} 
	}, false);

	addEventListener('dialogaccept', function(evt) {
		if (mode.selectedItem == xThunderRadio) {
            if (!extExists) {
                xThunderPref.setValue('supportExt', ext + supportExt);
            }

            if (remember.checked) {
                xThunderPref.setValue('remember', 1);
            }

            download();
		} else {
            if (extExists) {
                xThunderPref.setValue('supportExt', supportExt.replace(ext, ""));
            }
        }
	}, false); // dialogaccept
    
}, false); // load