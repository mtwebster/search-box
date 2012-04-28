const Applet = imports.ui.applet;
const Gio = imports.gi.Gio;
const Lang = imports.lang;
const Mainloop = imports.mainloop;
const Clutter = imports.gi.Clutter;
const St = imports.gi.St;
const Util = imports.misc.util;
const PopupMenu = imports.ui.popupMenu;
const Calendar = imports.ui.calendar;
const UPowerGlib = imports.gi.UPowerGlib;
const PanelMenu = imports.ui.panelMenu;
const Main = imports.ui.main;
const Gtk = imports.gi.Gtk;
const GLib = imports.gi.GLib;
const Cinnamon = imports.gi.Cinnamon;

const PROVIDER_FILE = GLib.build_filenamev([global.userdatadir, 'applets/search-box@mtwebster/providers.conf']);

// fallbacks
let prov_label = 'Google';
let prov_url = 'http://google.com/search?q=';

function MyApplet(orientation) {
    this._init(orientation);
}

MyApplet.prototype = {
    __proto__: Applet.TextIconApplet.prototype,

    _init: function(orientation) {        
        Applet.TextIconApplet.prototype._init.call(this, orientation);
        
        try {                 
            this.menuManager = new PopupMenu.PopupMenuManager(this);
            this._searchInactiveIcon = new St.Icon({ style_class: 'menu-search-entry-icon',
                                               icon_name: 'edit-find',
                                               icon_type: St.IconType.SYMBOLIC });
            this._searchActiveIcon = new St.Icon({ style_class: 'menu-search-entry-icon',
                                             icon_name: 'edit-clear',
                                             icon_type: St.IconType.SYMBOLIC });
            this.searchIcon = new St.Icon({icon_name: "edit-find", icon_size: 24, icon_type: St.IconType.FULLCOLOR});
            this.googleIcon = new St.Icon({icon_name: "google", icon_size: 24});
            this._searchIconClickedId = 0;
            this._grab_providers();
            this.set_applet_label(prov_label);
            this.set_applet_icon_name("web-browser");
            this._orientation = orientation;
            this.menu = new Applet.AppletPopupMenu(this, this._orientation);
            this.menuManager.addMenu(this.menu);
        
            
                                     
            this._searchArea = new St.BoxLayout({name: 'searchArea' });
      
            this.menu.addActor(this._searchArea);

            this.searchBox = new St.BoxLayout({ style_class: 'menu-search-box' });
            this._searchArea.add(this.searchBox);

            this.buttonbox = new St.BoxLayout();
            button = new St.Button({ child: this.searchIcon });
            button.connect('clicked', Lang.bind(this, this._search));
            this.buttonbox.add_actor(button);
            this._searchArea.add(this.buttonbox);            
            
            this.searchEntry = new St.Entry({ name: 'menu-search-entry',
                                     hint_text: _("Type to search..."),
                                     track_hover: true,
                                     can_focus: true });
            this.searchEntry.set_secondary_icon(this._searchInactiveIcon);
            this.searchBox.add_actor(this.searchEntry);
            this.searchActive = false;
            this.searchEntryText = this.searchEntry.clutter_text;
            this.searchEntryText.connect('text-changed', Lang.bind(this, this._onSearchTextChanged));
            this.searchEntryText.connect('key-press-event', Lang.bind(this, this._onMenuKeyPress));
            this._previousSearchPattern = "";
            this.edit_menu_item = new Applet.MenuItem(_("Edit search providers (reload Cinnamon after)"), Gtk.STOCK_EDIT, Lang.bind(this, this._edit_providers));
            this._applet_context_menu.addMenuItem(this.edit_menu_item);

        }
        catch (e) {
            global.logError(e);
        }
    },
    
    _edit_providers: function() {
        Main.Util.spawnCommandLine("gedit " + PROVIDER_FILE);
    },
    
    
    
     _onMenuKeyPress: function(actor, event) {

        let symbol = event.get_key_symbol();
        
        if (symbol==Clutter.KEY_Return && this.menu.isOpen) {
            this._search();
            return true;
        }
    },
    
    
    
    _search: function() {
        Main.Util.spawnCommandLine("sensible-browser " + prov_url + "'" + this.searchEntry.get_text() + "'");
        this.menu.close();
    },
    
    resetSearch: function(){
        this.searchEntry.set_text("");
        this.searchActive = false;
        global.stage.set_key_focus(this.searchEntry);
    },
    
    _onSearchTextChanged: function (se, prop) {
        this.searchActive = this.searchEntry.get_text() != '';
        if (this.searchActive) {
            this.searchEntry.set_secondary_icon(this._searchActiveIcon);

            if (this._searchIconClickedId == 0) {
                this._searchIconClickedId = this.searchEntry.connect('secondary-icon-clicked',
                    Lang.bind(this, function() {
                        this.resetSearch();       
                    }));
            }
            
        } else {
            if (this._searchIconClickedId > 0)
                this.searchEntry.disconnect(this._searchIconClickedId);
            this._searchIconClickedId = 0;

            this.searchEntry.set_secondary_icon(this._searchInactiveIcon);

        }
        if (!this.searchActive) {
            if (this._searchTimeoutId > 0) {
                Mainloop.source_remove(this._searchTimeoutId);
                this._searchTimeoutId = 0;
            }
            return;
        }
        if (this._searchTimeoutId > 0)
            return;
        this._searchTimeoutId = Mainloop.timeout_add(150, Lang.bind(this, this._doSearch));
    },
    
    
    
    on_applet_clicked: function(event) {
        this.menu.toggle();
    },
    
    _onLaunchSettings: function() {
        this.menu.close();
        Util.spawnCommandLine("cinnamon-settings calendar");
    },

    _updateClockAndDate: function() {
        let dateFormat = this._calendarSettings.get_string('date-format');       
        let dateFormatFull = this._calendarSettings.get_string('date-format-full'); 
        let displayDate = new Date();
   //     this.set_applet_label(displayDate.toLocaleFormat(dateFormat));
   //     this._date.set_text(displayDate.toLocaleFormat(dateFormatFull));

        Mainloop.timeout_add_seconds(1, Lang.bind(this, this._updateClockAndDate));
        return false;
    },
    
    
    on_orientation_changed: function (orientation) {
        this._orientation = orientation;
        this._initContextMenu();
    },
    
    
    _grab_providers: function () {

        let providerContent = Cinnamon.get_file_contents_utf8_sync(PROVIDER_FILE);

        let lines = providerContent.split('\n');
        for (let i = 0; i < lines.length; i++) {
            let line = lines[i];
            if (line.substring(0,1) == '#')
                continue;
            if (line.trim(' ') == '')
                continue;
            let components = line.split(',');
            prov_label = components[0].trim(' ');
            prov_url = components[1].trim(' ');
        }
        
    },


    
    
};

function main(metadata, orientation) {  
    let myApplet = new MyApplet(orientation);
    return myApplet;      
}
