////////////////////////////////////////////////////////////
//	Save as file dialog,require xThunder.js,prefs.js
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

    forceNormal();

    const mode = $('mode');
    const remember = $('rememberChoice');
    const tddownload = $('thunderdownload');

    if (xThunderPref.getValue('remember')) {
        remember.checked = true;
        mode.selectedItem = tddownload;
    }

    mode.addEventListener('select', function() {
			if (mode.selectedItem == tddownload) {
				remember.disabled = false;
			}
	}, false);

	addEventListener('dialogaccept', function(evt) {
		if (mode.selectedItem == tddownload) {
            if (remember.checked) {
				xThunderPref.setValue('remember', 1);
			} else {
                xThunderPref.setValue('remember', 0);
            }

            var de = document.documentElement;
            var url = dialog.mLauncher.source.spec;
            var referrer;
            try {
                referrer = dialog.mContext.QueryInterface(Components.interfaces.nsIWebNavigation).currentURI.spec;
            }
            catch(ex) {
                referrer = url;
            }

            xThunder.callThunder(url, referrer);
            de.removeAttribute('ondialogaccept');
            de.removeAttribute('onblur');
            de.removeAttribute('onfocus');
            de.cancelDialog();
		} else {
            xThunderPref.setValue('remember', 0);
        }
	}, false); // dialogaccept
}, false); // load