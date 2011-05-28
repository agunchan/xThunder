var xThunderOption = {
    pros : ["thunder", "flashget", "qqdl", "fs2you", "ed2k", "magnet", "115", "udown"],

    loadPrefs : function() {
        var rem = xThunderPref.getValue("remember");
        document.getElementById('remember').checked = rem;
        document.getElementById('supportExt').disabled = !rem;

        var supstr = xThunderPref.getValue("supportClick");
        if (supstr == "") {
            return;
        }
        for (var i=0; i<this.pros.length; ++i) {
            if (supstr.indexOf(this.pros[i]) != -1)
                document.getElementById(this.pros[i]).checked = true;
        }
    },

    savePrefs : function() {
        var oriValue = xThunderPref.getValue("supportClick");
        var supstr = "";
        for (var i=0; i<this.pros.length; ++i) {
            if (document.getElementById(this.pros[i]).checked) {
                supstr += (this.pros[i] + ",");
            }
        }

        if (supstr != oriValue) {
            xThunderPref.setValue("supportClick", supstr);
        }

        xThunderPref.setValue("remember", document.getElementById('remember').checked ? 1 : 0);
    }
}