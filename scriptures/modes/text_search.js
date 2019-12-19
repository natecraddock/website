import {Mode} from "./mode.js";
import {Context} from "../context.js";
import * as utils from "../utils.js"

export class TextSearch extends Mode {
    // Create text search area
    enter() {
        console.debug("Entered Text Search");

        // Set prompt
        let context = new Context();

        const prompts = ["And it came to pass", "Nevertheless", "Be still", "Be of good cheer", "Rameumptom"]
                         "Humble", "Reign of the judges";
        context.set_search_prompt(utils.random_element(prompts));
        
        document.getElementById("text-mode").classList.add("active-mode");

        // Create mode settings
        context.mode_settings.empty();
        context.mode_settings.append("<label><input id='case-sensitive' type='checkbox'> Match Case</label></br>");
        context.mode_settings.append("<label><input id='highlight-matches' type='checkbox' checked> Highlight Matches</label></br>");

        // Load mode settings from config
        if (context.has_config("text_search_case")) {
            document.getElementById("case-sensitive").checked = (context.get_config("text_search_case") == 1) ? true : false;
        }
        else {
            document.getElementById("case-sensitive").checked = false;
        }

        if (context.has_config("text_search_highlight")) {
            document.getElementById("highlight-matches").checked = (context.get_config("text_search_highlight") == 1) ? true : false;
        }
        else {
            document.getElementById("highlight-matches").checked = true;
        }

        context.mode_settings.on("click", function() {
            let match_case = document.getElementById("case-sensitive").checked ? 1 : 0;
            context.set_config("text_search_case", match_case);

            let highlight_matches = document.getElementById("highlight-matches").checked ? 1 : 0;
            context.set_config("text_search_highlight", highlight_matches);
        });

        // Create area for drawing
        let app_area = $("#app");

        let text_search = $("<div></div>").appendTo(app_area);
        text_search.attr("id", "text-search");

        let text_search_area = $("<div></div>").appendTo(text_search);
        text_search_area.attr("id", "app-column-area");

        let placeholder = $('<h2>Search for a word or phrase</h2>').appendTo(text_search_area);
        placeholder.attr("id", "placeholder");
        
        let text_search_text = $("<h2></h2>").appendTo(text_search_area);
        text_search_text.attr("id", "text-search-number");

        let text_search_results = $("<div></div>").appendTo(text_search_area);
        text_search_results.attr("id", "text-search-results");

        // Set up event handlers for text search
        text_search.on("click", ".disclosure", function(e) {
            let div = $(this).next();
            let caret = $(this).children().first();

            if (div.is(":visible")) {
                div.hide(200);
                caret.toggleClass("fa-caret-down");
                caret.toggleClass("fa-caret-right");
            }
            else {
                div.show(200);
                caret.toggleClass("fa-caret-down");
                caret.toggleClass("fa-caret-right");
            }
        });

        context.show_footer();
    }

    exit () {
        console.debug("Exited Text Search");

        $("#text-search").remove();
    }

    execute() {
        let context = new Context();

        let search_text = context.get_search_value();

        do_text_search(context.scriptures, search_text);
    }
}

function verse_has_word(verse, word, case_sensitive) {
    if (!case_sensitive) {
        verse = verse.toLowerCase();
    }

    return verse.includes(word);
}

// Text search function
function text_search(data, text) {
    const case_sensitive = document.getElementById("case-sensitive").checked;
    const highlight_matches = document.getElementById("highlight-matches").checked;

    let results = utils.get_volume_names_arrays(data);

    let verse_iter = utils.verse_iterator(data);
    let result = verse_iter.next();

    if (!case_sensitive) {
        text = text.toLowerCase();
    }
    
    // iterate over each verse
    let total = 0;
    while(!result.done) {
        let verse = result.value.verse;
        
        // If verse contains the word
        if (verse_has_word(verse.text, text, case_sensitive)) {
            let verse_match = {};
            
            // Highlight the matches if needed
            if (highlight_matches) {
                verse_match.formatted_html = utils.highlight_verse(verse.text, [text], case_sensitive);
            }
            else {
                verse_match.formatted_html = verse.text;
            }

            verse_match.url = result.value.chapter.url;
            verse_match.ref = result.value.book.name + " " + result.value.chapter.number + ":" + result.value.verse_number;

            verse_match.links = verse.links_simple;
            verse_match.code = `${result.value.volume_name}:${result.value.book_name}:${result.value.chapter_number + 1}:${result.value.verse_number}`;

            results[result.value.volume_name].push(verse_match);

            total += 1;
        }

        result = verse_iter.next();
    }

    results["total"] = total;

    return results;
}

function do_text_search(data, text) {
    if (text === "") {
        return;
    }

    let results = text_search(data, text);

    let number = document.getElementById("placeholder")

    // Clear former results
    let search_results = $("#text-search-results");
    search_results.empty();

    // Draw data
    number.textContent = "Results: " + results.total;

    // Fill in divs of each result
    utils.place_search_results(results.ot, "Old Testament", search_results);
    utils.place_search_results(results.nt, "New Testament", search_results);
    utils.place_search_results(results.bofm, "Book of Mormon", search_results);
    utils.place_search_results(results.dc, "Doctrine and Covenants", search_results);
    utils.place_search_results(results.pgp, "Pearl of Great Price", search_results);

    // Ensure it scrolls to the top
    search_results.animate({scrollTop: 0}, "fast");
}

function disclosure_evt(event) {
    let div = event.target.nextSibling;

    div.style.display = "none";
}