const PopupMenu = imports.ui.popupMenu;
const Lang = imports.lang;



// settings = appletSettings

function SwitchSetting(settings, key) {
    this._init(settings, key);
}


SwitchSetting.prototype = {
        _init: function (settings, key) {
            this.settings = settings;
            this.key = key;
            this._switch = new PopupMenu.PopupSwitchMenuItem(this.key, this.settings.getBoolean(key, false));
            this._switch.connect('toggled', Lang.bind(this, this._switch_toggled));
            try {
          
            } catch (e) {
                global.logError(e);
            }
        },
        
        getSwitch: function () {
            return this._switch;
        },
        
        _switch_toggled: function () {
            global.logError('TOGGLED');
        },
        
        _write_setting: function () {
            
        }
        

};