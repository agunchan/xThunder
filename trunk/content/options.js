var xThunderPros = ["thunder", "flashget", "qqdl", "fs2you", "ed2k", "magnet", "115", "udown"];

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