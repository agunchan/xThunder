///////////////////////////////////////////////////////////////////
//	Click event handler,require xThunder.js,prefs.js,decode.js
///////////////////////////////////////////////////////////////////
var xThunderPros = ["thunder", "flashget", "qqdl", "fs2you", "ed2k", "magnet", "115"];

function addClickSupport(ev) {
    if (xThunderPref.getValue("supportClick") != "" ||
        xThunderPref.getValue("supportExt") != "" && xThunderPref.getValue("remember")) {

        var win = window.gBrowser || window;
        win.addEventListener("click", function(ev) {
            if (ev.button != 0 || ev.shiftKey) {
                return true;
            }

            if (ev.altKey && xThunderPref.getValue("altNoMonitor")) {
                return true;
            }

            var remExt = xThunderPref.getValue("remember");
            if (ev.ctrlKey && xThunderPref.getValue("ctrlNoMonitor"))
            {
                //remember value is 0:never down, 1: auto down, -1: no down this time
                if (remExt == 1) {
                    xThunderPref.setValue('remember', -1);
                }
                return true;
            } else {
                if (remExt == -1) {
                    xThunderPref.setValue('remember', 1);
                }
            }

            var link = ev.target;
            if (!link.href && !xThunderDownReg.test(link.name)) {
                link = link.parentNode;
                if (!link || !link.href)
                    return true;
            }
            
            var url = link.href || link.name;
            var download = false;

            //click support for associated file
            var supExt = xThunderPref.getValue("supportExt");
            if (remExt && supExt != "") {
                var subUrls = url.split("?");
                var matches = subUrls[0].match(/(?:ftp|https?):\/\/.*(\.\w+)/i);
                if (matches) {
                    if (supExt.indexOf(matches[1] + ";") != -1) {
                        url = subUrls[0];
                        download = true;
                    } else if (matches[1].indexOf("htm") == -1 && subUrls.length > 1){
                        var subParams = subUrls[1].split("&");
                        for (var j=0; j<subParams.length; ++j) {
                            matches = subParams[j].match(/.*(\.\w+)/i);
                            if (matches && supExt.indexOf(matches[1] + ";") != -1) {
                                //url is link.href or link.name
                                download = true;
                                break;
                            }
                        }
                    }
                }
            }

            //click support for protocals
            var supstr = xThunderPref.getValue("supportClick");
            if (!download && supstr != "") {
                var protocals = supstr.split(",");
                var contextmenu;
                for (var i=0; i<protocals.length-1; ++i) {
                    if (protocals[i] == "thunder" &&
                            (url.indexOf("thunder:") == 0 ||
                            link.getAttribute("thunderhref") ||
                            (contextmenu = link.getAttribute("oncontextmenu")) && contextmenu.indexOf("ThunderNetwork_SetHref") != -1)
                     || protocals[i] == "flashget" &&
                            (url.indexOf("flashget:") == 0 ||
                            link.getAttribute("fg") ||
                            (contextmenu = link.getAttribute("oncontextmenu")) && contextmenu.indexOf("Flashget_SetHref") != -1)
                     || protocals[i] == "qqdl" &&
                            (url.indexOf("qqdl:") == 0 ||
                            link.getAttribute("qhref"))
                     || protocals[i] == "fs2you" && url.indexOf("fs2you:") == 0
                     || protocals[i] == "ed2k" && url.indexOf("ed2k:") == 0
                     || protocals[i] == "magnet" && url.indexOf("magnet:") == 0
                     || protocals[i] == "115" && url.indexOf("http://u.115.com/file/") == 0
                    ) {
                        url = getDecodedNode(link);
                        download = true;
                        break;
                    }
                }
            }

            //download url by thunder
            if (download) {
                xThunder.callThunder(url, link.ownerDocument.URL);
                ev.preventDefault();
                ev.stopPropagation();
                return false;
            } else {
                return true;
            }
        }, true);
    }
}

function loadPrefs() {
    var rem = xThunderPref.getValue("remember");
    document.getElementById('remember').checked = rem;
    document.getElementById('supportExt').disabled = !rem;

    var supstr = xThunderPref.getValue("supportClick");
    if (supstr == "") {
        return;
    }
    for (var i=0; i<xThunderPros.length; ++i) {
        if (supstr.indexOf(xThunderPros[i]) != -1)
            document.getElementById(xThunderPros[i]).checked = true;
    }
}

function savePrefs() {
    var oriValue = xThunderPref.getValue("supportClick");
    var supstr = "";
    for (var i=0; i<xThunderPros.length; ++i) {
        if (document.getElementById(xThunderPros[i]).checked) {
            supstr += (xThunderPros[i] + ",");
        }
    }

    if (supstr != oriValue) {
        xThunderPref.setValue("supportClick", supstr);
    }

    xThunderPref.setValue("remember", document.getElementById('remember').checked ? 1 : 0);
}