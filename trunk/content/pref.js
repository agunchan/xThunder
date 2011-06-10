var xThunderPref = {
    pref : null,

    getBranch : function()
    {
        if (this.pref == null)
        {
            this.pref = Components.classes["@mozilla.org/preferences-service;1"].
                            getService(Components.interfaces.nsIPrefService).
                            getBranch('extensions.xthunder.');
        }
        return this.pref;
    },

    getValue: function(prefName, defaultValue)
    {
        var prefType=this.getBranch().getPrefType(prefName);

        switch (prefType)
        {
            case this.pref.PREF_STRING: return this.pref.getCharPref(prefName);
            case this.pref.PREF_BOOL: return this.pref.getBoolPref(prefName);
            case this.pref.PREF_INT: return this.pref.getIntPref(prefName);
            default: return defaultValue || 0;
        }
    },

    setValue: function(prefName, value)
    {
        var prefType=typeof(value);
        if (prefType != typeof(this.getValue(prefName)))
        {
            this.pref.deleteBranch(prefName);
        }

        switch (prefType)
        {
        case "string":
            this.pref.setCharPref(prefName, value);
            break;
        case "boolean":
            this.pref.setBoolPref(prefName, value);
            break;
        case "number":
            if (value % 1 != 0)
            {
                throw new Error("Cannot set preference to non integral number");
            }
            else
            {
                this.pref.setIntPref(prefName, Math.floor(value));
            }
            break;
        default:
            throw new Error("Cannot set preference with datatype: " + prefType);
        }
    }
}
