import * as utils from "./utils.js";
import { Intro } from "./modes/intro.js";

export class Context {
    // Set up references to search bar and other document elements
    constructor() {
        if (Context.context) {
            return Context.context;
        }

        this.settings_open = false;

        this.search_bar = $("#search-field");
        this.settings_button = $("#settings-button");
        this.submit_button =  $("#submit-search-button");
        this.settings_area = $("#settings-wrapper");
        this.mode_settings = $("#mode-settings");
        this.footer = $("#page-footer");

        this.mode_button_area = $("#mode-buttons");
        this.mode_buttons = $(".mode-button");

        this.settings_update = null;

        this.top_button = $("#top-button");

        this.mode = null;

        this.scriptures = null;
        this.lookup_table = null;
        
        this.scrolling = "vertical";
        
        Context.context = this; 
    }

    settings_changed() {
        if (this.settings_update) {
            setTimeout(this.settings_update, 200);
        }
    }

    hide_footer() {
        this.footer.hide();
    }

    show_footer() {
        this.footer.show();
    }

    set_search_prompt(prompt) {
        this.search_bar.attr("placeholder", prompt);
    }

    set_mode(mode) {
        if (this.mode) {
            this.mode.exit();
        }

        this.mode_settings.off();

        this.mode = mode;

        if (this.mode) {
            this.mode.enter();
        }

        // Clear the input field
        this.search_bar.val("");

        // Set the last mode
        this.set_config("last_mode", this.mode.constructor.name);

        // If this is the "first run" clear that
        if (this.get_config("first_run") && !(this.mode instanceof Intro)) {
            this.set_config("first_run", 0);
        }
    }

    set_scriptures(data) {
        this.scriptures = data;
    }

    set_lookup_table(table) {
        this.lookup_table = table;
    }

    execute() {
        // Hide focus for mobile keyboard
        document.activeElement.blur();
        setTimeout(function() {
            utils.show_loading();
        });
        
        let that  = this;
        setTimeout(function() {
            if (that.mode) {
                that.mode.execute();
    
            }
            // Hide the loading message
            utils.hide_loading();
        }, 100); 

    }

    get_search_value() {
        return this.search_bar.val();
    }

    focus_content() {
        if (window.scrollTo) {
            window.scrollTo({top: 0, behavior: "smooth"});
        } else {
            document.body.scrollTop = 0;
            document.documentElement.scrollTop = 0;
        }
    }

    scroll_listener() {
        if (this.scrolling === "vertical") {
            if (document.body.scrollTop > 20 || document.documentElement.scrollTop > 20) {
                this.top_button.fadeIn(200);
            }
            else {
                this.top_button.fadeOut(200);
            }
        }
    }

    set_pattern(pattern) {
        if (pattern === "") {
            this.search_bar.removeAttr("pattern");
            return;
        }
        this.search_bar.attr("pattern", pattern);
    }

    set_config(key, value) {
        let prefs = utils.get_preferences();

        prefs[key] = value;

        utils.set_preferences(prefs);
    }

    get_config(key) {
        let prefs = utils.get_preferences();
        return prefs[key];
    }

    has_config(key) {
        let prefs = utils.get_preferences();
        return prefs[key] !== undefined;
    }
}