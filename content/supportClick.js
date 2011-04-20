///////////////////////////////////////////////////////////////////
//	Click event handler,require xThunder.js,prefs.js,decode.js
///////////////////////////////////////////////////////////////////
var xThunderPros = ["thunder", "flashget", "qqdl", "fs2you", "ed2k", "magnet", "115"];
var xThunderProsMap = {
    'thunder': '@thunderhref or contains(@oncontextmenu,"ThunderNetwork_SetHref") or starts-with(@href,"thunder:") or @id="bt_down"',
    'flashget' : '@fg or contains(@oncontextmenu,"Flashget_SetHref") or starts-with(@href,"flashget:")',
    'qqdl' : '@qhref or starts-with(@href,"qqdl:")',
    'fs2you' : 'starts-with(@href,"fs2you:")',
    'ed2k' : 'starts-with(@href,"ed2k:")',
    'magnet' : 'starts-with(@href,"magnet:")',
    '115' : 'starts-with(@href,"http://u.115.com/file/")'
};

function addClickSupport() {
    if (xThunderPref.getValue("supportClick") != "" && gBrowser) {
        gBrowser.addEventListener("DOMContentLoaded", onContentLoad, false);
    }
}

function onContentLoad(event)
{
    // this is the content document of the loaded page.
    var htmlDocument = event.originalTarget;

    if (htmlDocument instanceof HTMLDocument) {
        var referrer = htmlDocument.URL;
        var supstr = xThunderPref.getValue("supportClick");
        if (supstr == "" || referrer == "about:blank") {
            return;
        }

        //Click support for rayfile.com
        if (supstr.indexOf("fs2you") != -1 &&
            /^http:\/\/www\.rayfile\.com\/zh-cn\/files\/.*\/.*\//i.test(referrer)) {

            htmlDocument.getElementById('vodlink').addEventListener("click", function(evt){
                if (this.hasChildNodes()) {
                    var url = getDecodedUrl(this.childNodes[0].href);
                    xThunder.callThunder(url, referrer);
                    evt.stopPropagation();
                    evt.preventDefault();
                }
            }, false);
            
            return;
        }

        //Click support for general website
        var protocals = supstr.split(",");
        var xpath = '//a[' + xThunderProsMap[protocals[0]];
        for (var i=1; i<protocals.length-1; ++i) {
            xpath += ' or ' + xThunderProsMap[protocals[i]];
        }
        xpath += ']';
        var links = htmlDocument.evaluate(xpath, htmlDocument, null, XPathResult.UNORDERED_NODE_SNAPSHOT_TYPE, null);
        for (var j=0; j<links.snapshotLength; ++j){
            var link = links.snapshotItem(j);
            link.removeAttribute("onclick", "");
            link.addEventListener("click", function(evt){
                var url = getDecodedNode(this, htmlDocument);
                xThunder.callThunder(url, referrer);
                evt.stopPropagation();
                evt.preventDefault();
            }, false);
        }
    }
}

function loadPrefs() {
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
}