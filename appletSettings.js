const Gio = imports.gi.Gio;
const GLib = imports.gi.GLib;
const Lang = imports.lang;
const Cinnamon = imports.gi.Cinnamon;
const Main = imports.ui.main;
const Signals = imports.signals;

const SETTINGS_FOLDER = GLib.get_home_dir() + '/.cinnamon/';

function AppletSettings(uuid, dist_filename, filename) {
    this._init(uuid, dist_filename, filename);
}

AppletSettings.prototype = {
        _init: function (uuid, dist_filename, filename) {
            this.uuid = uuid;
            this.dist_filename = dist_filename;
            this.applet_dir = imports.ui.appletManager._find_applet(this.uuid);
            this.filename = filename;
            this.settings = new Array();
            this.parsed_settings = new Array();
            try {
                this.dist_filename = this.applet_dir.get_child(this.dist_filename);
                this.settings_dir = Gio.file_new_for_path(SETTINGS_FOLDER + this.uuid);
                this.settings_file = Gio.file_parse_name(SETTINGS_FOLDER + this.uuid + '/' + this.filename);

                if (!this.settings_file.query_exists(null)) {
                    if (!this.settings_dir.query_exists(null)) this.settings_dir.make_directory_with_parents(null);
                    let fp = this.settings_file.create(0, null);
                    let dist_settings = Cinnamon.get_file_contents_utf8_sync(this.dist_filename.get_path());
                    fp.write(dist_settings, null);
                    fp.close(null);
                }
                let f = this.settings_file;
                this.settings_file_monitor = f.monitor_file(Gio.FileMonitorFlags.NONE, null);
                this.settings_file_monitor.connect('changed', Lang.bind(this, this._on_settings_file_changed));
                this._read_settings();
            } catch (e) {
                global.logError(e);
            }
        },

        _read_settings: function () {
            this.settings = Cinnamon.get_file_contents_utf8_sync(this.settings_file.get_path());
            // First, split the lines up
            let lines = this.settings.split('\n');
            // then, go thru and trim out any comments and blank lines, and
            // with what's remaining, create a single-dimension string array of each line
            for (let i = 0; i < lines.length; i++) {
                let line = lines[i];
                if (line.substring(0,1) == '#')
                    continue;
                if (line.trim(' ') == '')
                    continue;
                let component_line_pretrim = line.split(',');
                let component_line = new Array();
                // Trim any extra space out of each line's members
                for (let j = 0; j < component_line_pretrim.length; j++) {
                    component_line[j] = component_line_pretrim[j].replace(/^\s+|\s+$/g, "");
                }
                // Finally, store the settings line in the final array to be used
                // for any further work in this class
                this.parsed_settings.push(component_line);
            }
        },

        _on_settings_file_changed: function () {
            this.emit("settings-file-changed");
        },
        
        editSettingsFile: function () {
            Main.Util.spawnCommandLine("xdg-open " + this.settings_file.get_path());
        },
        
        getArray: function (key, def) {
            if (this.parsed_settings.length == 0) {
                return def;
            }
            let res;
            for (i=0; i < this.parsed_settings.length; i++)
                if(key == this.parsed_settings[i][0]) {
                    res = this.parsed_settings[i]; 
                }
            
            if (res) {
                return res;
            } else {
                global.logError('didnt find settings array');
                return def;
            }
        },

        getString: function (key, def) {
            let res = this.getArray(key, ['null', 'null']);
            if (res[0] == 'null') {
                return def;
            } else {
                return res[1];
            }
        },

        getBoolean: function (key, def) {
            let res = this.getString(key, 'null');
            if (res == 'null') {
                return def;
            }
            return (res == 'true') ? true : false;
        }
};
Signals.addSignalMethods(AppletSettings.prototype);

/*
function initialize_setting_file(uuid, dist_filename, filename) {
    
     Check if settings file has been created and create directory structure if not
     provide uuid of applet, filename of setting seed file, and desired filename of setting file
     return a 'changed' watcher
     this is typically run once upon initialization of the applet - if the settings file exists, it
     creates a watcher and  returns it
    
}

function read_setting_file(uuid, filename) {
    /*
     * read a settings file - this can be done initially
     * then triggered upon the file changing, so settings can be updated
     
}


Settings files will be organized as follows:

3+ fields, comma delimited, one 'entry' per field.  


setting-label       ,       data1       ,       data2       ,       etc..

i.e.

provider, http://www.google.com, Google

this js file will provide utility classes for reading a particular setting by requesting a 'setting-label', or key,
and the package of data that goes with it


function getSetting(dataset, key) {
    // Returns a String array - for now, it's up to the applet to decide how to handle it
    return String[];
}

function edit_setting_file(uuid, filename) {
    /*
     * Allow the applet to 
     
}
*/