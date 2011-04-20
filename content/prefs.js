var xThunderPref = {
    pref : Components.classes["@mozilla.org/preferences-service;1"].
        getService(Components.interfaces.nsIPrefService).
        getBranch('extensions.xthunder.'),

    remove: function(prefName)
    {
        this.pref.deleteBranch(prefName);
    },

    exists: function(prefName)
    {
        return this.pref.getPrefType(prefName) != 0;
    },

    getValue: function(prefName, defaultValue)
    {
        var prefType=this.pref.getPrefType(prefName);

        if (prefType==this.pref.PREF_INVALID)
        {
            return defaultValue;
        }

        switch (prefType)
        {
            case this.pref.PREF_STRING: return this.pref.getCharPref(prefName);
            case this.pref.PREF_BOOL: return this.pref.getBoolPref(prefName);
            case this.pref.PREF_INT: return this.pref.getIntPref(prefName);
        }
    },

    setValue: function(prefName, value)
    {
        var prefType=typeof(value);

        switch (prefType)
        {
        case "string":
        case "boolean":
            break;
        case "number":
            if (value % 1 != 0)
            {
                throw new Error("Cannot set preference to non integral number");
            }
            break;
        default:
            throw new Error("Cannot set preference with datatype: " + prefType);
        }

        if (this.exists(prefName) && prefType != typeof(this.getValue(prefName)))
        {
            this.remove(prefName);
        }

        switch (prefType)
        {
            case "string": this.pref.setCharPref(prefName, value); break;
            case "boolean": this.pref.setBoolPref(prefName, value); break;
            case "number": this.pref.setIntPref(prefName, Math.floor(value)); break;
        }
    }
}
