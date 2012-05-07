const Gio = imports.gi.Gio;
const GLib = imports.gi.GLib;
const Lang = imports.lang;
const Cinnamon = imports.gi.Cinnamon;


const SETTINGS_FOLDER = GLib.get_home_dir() + '/.cinnamon/';

function AppletSettings(uuid, dist_filename, filename) {
    this._init(uuid, dist_filename, filename);
};


AppletSettings.prototype = {
        
        
        _init: function (uuid, dist_filename, filename) {
            this.parsed_settings = {};
            this.uuid = uuid;
            this.dist_filename = dist_filename;
            this.applet_dir = imports.ui.appletManager._find_applet(this.uuid);
            this.filename = filename;
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
                this.settings_file.connect('changed', Lang.bind(this, this._on_settings_file_changed));
                this._read_settings();
            } catch (e) {
                global.logError(e);
             //   throw new Error('something went wrong');
            }
        },

        _read_settings: function () {
            this.settings = Cinnamon.get_file_contents_utf8_sync(this.settings_file.get_path());
            
            if (!this.settings) { global.logError('blah'); }
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
                let component_line = line.split(',');
                // Trim any extra space out of each line's members
                // @TODO: how do we handle strings with intentional spaces?
                for (let j = 0; j < component_line.length; j++) {
                    component_line[j] = component_line[j].trim(' ');
                }
                // Finally, store the settings line in the final array to be used
                // for any further work in this class
                this.parsed_settings[i] = component_line;
            }
        },
        
        
        _on_settings_file_changed: function () {
            this._read_settings();
        },
        
        getSetting: function (key) {
            for (let i = 0; i < this.parsed_settings.length; i++) {
                if (this.parsed_settings[i][0] != key) {
                    continue;
                } else {
                    return this.parsed_settings[i];
                }
            }
            return null;
        },
        
        getSettingBoolean: function (key) {
            return (this.getSetting(key) == 'true') ? true : false;
        }
}

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