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





function MyApplet(orientation) {
    this._init(orientation);
}

MyApplet.prototype = {
    __proto__: Applet.TextApplet.prototype,

    _init: function(orientation) {        
        Applet.TextApplet.prototype._init.call(this, orientation);
        
        try {                 
            this.menuManager = new PopupMenu.PopupMenuManager(this);
            this._searchInactiveIcon = new St.Icon({ style_class: 'menu-search-entry-icon',
                                               icon_name: 'edit-find',
                                               icon_type: St.IconType.SYMBOLIC });
            
            this._orientation = orientation;
            
            this._initContextMenu();
                                     
            this._calendarArea = new St.BoxLayout({name: 'calendarArea' });
            this.menu.addActor(this._calendarArea);

            // Fill up the first column

            this.searchBox = new St.BoxLayout({ style_class: 'menu-search-box' });
            this._calendarArea.add(this.searchBox);
       
            this.searchEntry = new St.Entry({ name: 'menu-search-entry',
                                     hint_text: _("Type to search..."),
                                     track_hover: true,
                                     can_focus: true });
            this.searchEntry.set_secondary_icon(this._searchInactiveIcon);
            this.searchBox.add_actor(this.searchEntry);
            this.searchActive = false;
            this.searchEntryText = this.searchEntry.clutter_text;
       //     this.searchEntryText.connect('text-changed', Lang.bind(this, this._onSearchTextChanged));
       //     this.searchEntryText.connect('key-press-event', Lang.bind(this, this._onMenuKeyPress));
      //      this._previousSearchPattern = "";


   
            this.set_applet_label("Search");
      
     
        }
        catch (e) {
            global.logError(e);
        }
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
    
    _initContextMenu: function () {
        if (this._calendarArea) this._calendarArea.unparent();
        if (this.menu) this.menuManager.removeMenu(this.menu);
        
        this.menu = new Applet.AppletPopupMenu(this, this._orientation);
        this.menuManager.addMenu(this.menu);
        
        if (this._calendarArea){
            this.menu.addActor(this._calendarArea);
            this._calendarArea.show_all();
        }
        
        // Whenever the menu is opened, select today
        this.menu.connect('open-state-changed', Lang.bind(this, function(menu, isOpen) {
            if (isOpen) {
                let now = new Date();
                /* Passing true to setDate() forces events to be reloaded. We
                 * want this behavior, because
                 *
                 *   o It will cause activation of the calendar server which is
                 *     useful if it has crashed
                 *
                 *   o It will cause the calendar server to reload events which
                 *     is useful if dynamic updates are not supported or not
                 *     properly working
                 *
                 * Since this only happens when the menu is opened, the cost
                 * isn't very big.
                 */
                this._calendar.setDate(now, true);
                // No need to update this._eventList as ::selected-date-changed
                // signal will fire
            }
        }));
    },
    
    on_orientation_changed: function (orientation) {
        this._orientation = orientation;
        this._initContextMenu();
    }
    
};

function main(metadata, orientation) {  
    let myApplet = new MyApplet(orientation);
    return myApplet;      
}
