import {TextSearch} from "./modes/text_search.js";
import {KeywordSearch} from "./modes/keyword.js";
import {FootnoteSearch} from "./modes/footnotes.js";
import {Intro} from "./modes/intro.js";
import {Context} from "./context.js";
import { Similar } from "./modes/similar.js";

// Helper function to load json data
function load_json(url) {
    return $.getJSON(url).then(function(data) {
        return data;
    });
}

// Load all json files into a master data object
function load_all_json(callback) {
    let data = {};

    load_json("data/ot.json").done(function(d) {
        data.ot = d;

        load_json("data/nt.json").done(function(d) {
            data.nt = d;

            load_json("data/bofm.json").done(function(d) {
                data.bofm = d;

                load_json("data/dc-testament.json").done(function(d) {
                    data.dc = d;

                    load_json("data/pgp.json").done(function(d) {
                        data.pgp = d;

                        // Load lookup table 
                        load_json("data/lookup_table.json").done(function(d) {
                            // call the callback
                            console.log("SCRIPTURES LOADED");
                            callback(data, d);
                        });
                    });
                });
            });
        });
    });
}

// Start point for the webapp
$(document).ready(function() {
    // Draw the page first
    let context = new Context();

    // Handle URL parameters
    let page_url = new URL(window.location.href);
    let mode = page_url.searchParams.get("mode");
    let query = page_url.searchParams.get("query");

    if (mode) {
        if (mode === "footnote") {
            context.set_mode(new FootnoteSearch());
        }
        else if (mode === "text") {
            context.set_mode(new TextSearch());
        }
        else if (mode === "keyword") {
            context.set_mode(new KeywordSearch());
        }
        else if (mode === "similar") {
            context.set_mode(new Similar());
        }
        else if (mode === "intro") {
            context.set_mode(new Intro());
        }
        else {
            // Default
            context.set_mode(new TextSearch());
        }
    }
    else {
        let last_mode = context.get_config("last_mode");
        if (last_mode) {
            if (last_mode == "Intro") {
                context.set_mode(new Intro());
            }
            else if (last_mode == "TextSearch") {
                context.set_mode(new TextSearch());
            }
            else if (last_mode == "KeywordSearch") {
                context.set_mode(new KeywordSearch());
            }
            else if (last_mode == "FootnoteSearch") {
                context.set_mode(new FootnoteSearch());
            }
            else if (last_mode == "Similar") {
                context.set_mode(new Similar());
            }
        }
        else if (!context.get_config("first_run")) {
            // Default to text search
            context.set_mode(new TextSearch());
        }
    }
    
    if (query) {
        context.search_bar.val(query);
    }

    // Handle config
    let first_run = context.get_config("first_run");
    if (first_run) {
        context.set_mode(new Intro());
    }
    
    // Load JSON scripture data
    load_all_json(startup);
});

function startup(scriptures, lookup_table) {
    let context = new Context();

    context.set_lookup_table(lookup_table);
    context.set_scriptures(scriptures);

    // Set up event listeners
    context.search_bar.on("keyup", function(event) {
        if (event.key === "Enter") {
            context.execute();
        }
    });

    // Search button event listener
    context.submit_button.on("click", function() {
        context.execute();
    });

    // Focus content button event listener
    context.top_button.on("click", function(e) {
        context.focus_content();
    });

    window.onscroll = function() {
        context.scroll_listener();
    };
    
    // Settings area
    context.settings_button.on("click", function(event) {
        context.settings_area.fadeToggle(100);
        context.settings_open = !context.settings_open;

        event.stopPropagation();

        context.settings_changed();
    });

    $("body").on("click", function(event) {
        if (context.settings_open) {
            // If clicked in settings area
            if (event.target.id !== "settings-wrapper" && !$(event.target).parents("#settings-wrapper").length) {
                context.settings_area.fadeToggle(100);
                context.settings_open = false;
            }
            context.settings_changed();
        }
    });

    // Listener for mode toggling
    context.mode_buttons.on("click", function(event) {
        console.log($(this).attr("value"));

        // Clear active
        context.mode_button_area.children().removeClass("active-mode");

        let button = $(this);
        button.addClass("active-mode");

        let mode = button.attr("value");

        if (mode === "text") {
            context.set_mode(new TextSearch());
        }
        else if (mode === "word") {
            context.set_mode(new KeywordSearch());
        }
        else if (mode === "similar") {
            context.set_mode(new Similar());
        }
        else if (mode === "footnotes") {
            context.set_mode(new FootnoteSearch());
        }
        else if (mode === "intro") {
            context.set_mode(new Intro());
        }
        else {
            context.set_mode(null);
        }
    });

    // Scroll to top on reload
    context.focus_content();

    // Finally, execute if the query requires
    let page_url = new URL(window.location.href);
    let query = page_url.searchParams.get("query");
    let mode = page_url.searchParams.get("mode");

    if (query && mode && !(context.mode instanceof Intro)) {
        context.execute();
    }
}