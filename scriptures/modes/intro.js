import {Mode} from "./mode.js";
import {Context} from "../context.js";

// Basic mode
export class Intro extends Mode {
    // Set up divs and settings for the app
    enter() {
        console.debug("Entered Intro");

        $("#header").hide();

        let context = new Context();
        context.search_bar.prop("disabled", true);
        context.submit_button.prop("disabled", true);
        document.getElementById("intro-mode").classList.add("active-mode");

        context.set_search_prompt("");

        // Clear mode settings div
        context.mode_settings.empty();

        // Create area for drawing
        let app_area = $("#app");

        let intro_area = $("<div></div>").appendTo(app_area);
        intro_area.attr("id", "intro");

        let intro = $("<div></div>").appendTo(intro_area);
        intro.attr("id", "app-column-area");

        intro.load("./modes/intro.html");

        context.show_footer();
    };

    // Clear divs and settings for the app
    exit() {
        $("#header").show();
        let context = new Context();
        context.search_bar.prop("disabled", false);
        context.submit_button.prop("disabled", false);

        $("#intro").remove();
    };

    // Execute "search" button
    execute() {
        throw new Error("Not implemented");
    };
}
