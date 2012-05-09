const PopupMenu = imports.ui.popupMenu;
const Lang = imports.lang;



// settings = appletSettings, key = settings key/label to tie to

function SwitchSetting(settings, key) {
    this._init(settings, key);
}


SwitchSetting.prototype = {
        _init: function (settings, key) {
            this.settings = settings;
            this.key = key;
            this._switch = new PopupMenu.PopupSwitchMenuItem(this.key, this.settings.getBoolean(this.key, false));
            this._switch.connect('toggled', Lang.bind(this, this._switch_toggled));
            this.settings.connect('settings-file-changed', Lang.bind(this, this._settings_file_edited_offline));
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
            _write_setting();
        },

        _write_setting: function () {
            this.settings.setBoolean(this.key, this._switch.state);
        },

        _settings_file_edited_offline: function () {
            this._switch.setToggleState(this.settings.getBoolean(this.key, false));
        }
};