const PopupMenu = imports.ui.popupMenu;



// settings = appletSettings, key = settings key to use for switch

function SettingsUISwitch(settings, key) {
    this._init.apply(this, arguments);
}

SettingsUISwitch.prototype = {
        __proto__: PopupSwitchMenuItem.prototype,
        
        _init: function (text, active, params) {
            try {
          
            } catch (e) {
                global.logError(e);
            }
        },
        

};