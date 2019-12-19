import {Mode} from "./mode.js";
import {Context} from "../context.js";
import * as utils from "../utils.js";

export class KeywordSearch extends Mode {
    // Create keyword search area
    enter() {
        console.debug("Entered Keyword Search");

        // Set prompt
        let context = new Context();

        const prompts = ["Faith, Hope, Charity", "White, harvest", "Man, God, Image", "Strength, faith",
                         "Courage, hope", "Repent, faith", "Baptism, Holy Ghost"];
        context.set_search_prompt(utils.random_element(prompts));

        document.getElementById("word-mode").classList.add("active-mode");
        
        // Create mode settings
        context.mode_settings.empty();
        context.mode_settings.append("<label><input id='case-sensitive' type='checkbox'> Match Case</label><br>");
        context.mode_settings.append("<label><input id='match-all' type='checkbox'> Match All Words</label><br>");
        context.mode_settings.append("<label><input id='highlight-matches' type='checkbox'> Highlight Matches</label><br>")

        // Load mode settings from config
        if (context.has_config("keyword_search_case")) {
            document.getElementById("case-sensitive").checked = ((context.get_config("keyword_search_case") == 1) ? true : false);
        }
        else {
            document.getElementById("case-sensitive").checked = false;
        }
        if (context.has_config("keyword_search_highlight")) {
            document.getElementById("highlight-matches").checked = ((context.get_config("keyword_search_highlight") == 1) ? true : false);
        }
        else {
            document.getElementById("highlight-matches").checked = true;
        }
        if (context.has_config("keyword_search_match_all")) {
            document.getElementById("match-all").checked = ((context.get_config("keyword_search_match_all") == 1) ? true : false);
        }
        else {
            document.getElementById("match-all").checked = true;
        }

        context.mode_settings.on("click", function() {
            let match_case = document.getElementById("case-sensitive").checked ? 1 : 0;
            context.set_config("keyword_search_case", match_case);

            let highlight_matches = document.getElementById("highlight-matches").checked ? 1 : 0;
            context.set_config("keyword_search_highlight", highlight_matches);

            let match_all = document.getElementById("match-all").checked ? 1 : 0;
            context.set_config("keyword_search_match_all", match_all);
        });

        // Create area for drawing
        let app_area = $("#app");

        let text_search = $("<div></div>").appendTo(app_area);
        text_search.attr("id", "text-search");

        
        let text_search_area = $("<div></div>").appendTo(text_search);
        text_search_area.attr("id", "app-column-area");

        let placeholder = $('<h2>Enter keywords as a comma-separated list</h2>').appendTo(text_search_area);
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
        console.debug("Exited Keyword Search");

        $("#text-search").remove();
    }

    execute() {
        let context = new Context();

        let keywords = context.get_search_value();

        do_keyword_search(context.scriptures, keywords);
    }
}

function arrange_words(words) {
    let arranged = [];

    // Remove duplicates. Doesn't need to be super fast or efficient
    for (let i = 0; i < words.length; ++i) {
        if (!arranged.includes(words[i]) && words[i] !== "") {
            arranged.push(words[i]);
        }
    }

    // Sort by length, longest to shortest
    arranged.sort(function(a, b) {
        return a.length < b.length;
    });

    return arranged;
}

function generate_keyword_combinations(a, b) {
    let combinations = [];
    let start = a.length - b.length + 1;

    for (let i = start; i < a.length; ++i) {
        let overlap = a.length - i;

        if (a.substr(i) === b.substr(0, overlap)) {
            combinations.push(a.substr(0, i) + b);
        }
    }

    return combinations;
}

function generate_possible_keywords(keywords) {
    let temp = new Set(keywords);

    for (let i = 0; i < keywords.length; ++i) {
        for (let j = 0; j < keywords.length; ++j) {
            let res = generate_keyword_combinations(keywords[i], keywords[j]);
            for (let elem of res) {
                temp.add(elem);
            }
            
            res = generate_keyword_combinations(keywords[j], keywords[i]);
            for (let elem of res) {
                temp.add(elem);
            }
        }
    }

    return Array.from(temp);
}

function verse_has_keywords(verse, keywords, match_all, case_sensitive) {
    if (!case_sensitive) {
        verse = verse.toLowerCase();
    }

    if (match_all) {
        for (let i = 0; i < keywords.length; ++i) {
            if (!verse.includes(keywords[i])) {
                return false;
            }
        }
        return true;
    }
    else {
        for (let i = 0; i < keywords.length; ++i) {
            if (verse.includes(keywords[i])) {
                return true;
            }
        }
    }
    return false;
}

function keyword_search(data, keywords) {
    const case_sensitive = document.getElementById("case-sensitive").checked;
    const match_all = document.getElementById("match-all").checked;
    const highlight = document.getElementById("highlight-matches").checked;

    let results = utils.get_volume_names_arrays(data);

    let verse_iter = utils.verse_iterator(data);
    let result = verse_iter.next();

    // Make keywords lowercase if case insensitive
    if (!case_sensitive) {
        keywords.forEach(function(item, index, array) {
            array[index] = item.toLowerCase();
        });
    }

    // Generate possible combinations of keywords for highlighting
    let highlight_keywords = keywords;
    if (highlight) {
        highlight_keywords = generate_possible_keywords(keywords);
    }

    // iterate over each verse
    let total = 0;
    while (!result.done) {
        let verse = result.value.verse;

        if (verse_has_keywords(verse.text, keywords, match_all, case_sensitive)) {
            let verse_match = {};

            if (highlight) {
                verse_match.formatted_html = utils.highlight_verse(verse.text, highlight_keywords, case_sensitive);
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
            // break;
        }

        result = verse_iter.next();
    }

    results["total"] = total;

    return results;
}

function do_keyword_search(data, keywords_text) {
    if (keywords_text === "") {
        return;
    }

    // Split text into words
    let keywords = keywords_text.split(",");
    for (let i = 0; i < keywords.length; ++i) {
        keywords[i] = keywords[i].trim();
    }

    /*
     * Arrange words so that words that contain other words are listed first.
     * For example, searching for "Nephi" and "Nephites" would match "Nephi" twice if
     * the verse contained "Nephites". So highlighting "Nephites" first will make sure
     * that a subsequent highlighting of "Nephi" has no issues with the generated HTML.
     * This is simply done by ordering by length from longest to shortest.
    */
    keywords = arrange_words(keywords);

    // Do the keyword search
    let results = keyword_search(data, keywords);

    // Draw the results on the page
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