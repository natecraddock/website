import {Mode} from "./mode.js";
import {Context} from "../context.js";
import * as utils from "../utils.js";

// Basic mode
export class Similar extends Mode {
    // Set up divs and settings for the app
    enter() {
        console.debug("Entered Similar Search");
        
        let context = new Context();
        const prompts = ["1 Nephi 1:1", "Romans 1:16", "Genesis 1:1", "D&C 121:7",
                         "Mosiah 3:19", "Moses 1:39", "2 Nephi 31:20", "3 Nephi 27:27",
                         "Isaiah 1:18", "John 3:16"];
        context.set_search_prompt(utils.random_element(prompts));
        
        document.getElementById("similar-mode").classList.add("active-mode");

        // Create Mode settings
        context.mode_settings.empty();
        context.mode_settings.append("<label><input id='relevance' type='checkbox' checked> Sort by Relevance</label><br>");
        // context.mode_settings.append("<label><input id='") Minimum similarity??

        // Load mode settings from config
        if (context.has_config("similar_search_relevance")) {
            document.getElementById("relevance").checked = (context.get_config("similar_search_relevance") == 1) ? true : false;
        }
        else {
            document.getElementById("relevance").checked = true;
        }

        context.mode_settings.on("click", function() {
            let relevance = document.getElementById("relevance").checked ? 1 : 0;
            context.set_config("similar_search_relevance", relevance);
        });

        context.set_pattern(".+\\s+\\d+:\\d+");

        // Create area for drawing
        let app_area = $("#app");

        let text_search = $("<div></div>").appendTo(app_area);
        text_search.attr("id", "text-search");

        
        let text_search_area = $("<div></div>").appendTo(text_search);
        text_search_area.attr("id", "app-column-area");

        let placeholder = $('<h2>Enter a verse reference to find similar verses</h2>').appendTo(text_search_area);
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
    };

    // Clear divs and settings for the app
    exit() {
        let context = new Context();
        console.debug("Exited Similar Search");

        context.set_pattern("");

        $("#text-search").remove();        
    };

    // Execute "search" button
    execute() {
        let context = new Context();

        let query = context.get_search_value();

        do_similar_search(context.scriptures, query);
    };
}

class Similarity {
    remove_duplicates(array) {
        let s = new Set(array);
        return Array.from(s);
    }

    get_importance(words, all_words) {
        const NUM_ID_WORDS = 10;

        let importance = new Map();

        for (let word of words) {
            let importance_id = this.arr_occurrences(all_words, word) * word.length;
            importance.set(word, importance_id);
        }

        this.importance = importance;

        let vals = [];
        for (let pair of importance) {
            vals.push(pair);
        }

        vals.sort(function(a, b) {
            return a[1] < b[1];
        });

        vals = vals.slice(0, NUM_ID_WORDS);

        return vals;
    }

    constructor(string) {
        // Split into words
        string = string.toLowerCase();
        let words = string.split(/[";\'?!:,.()\[\]*\s]/);
        words = utils.remove_common_words(words);

        let no_duplicates = this.remove_duplicates(words);

        this.id_words_counts = this.get_importance(no_duplicates, words);

        this.id_words = [];
        this.id_words_counts.forEach(function(element) {
            this.id_words.push(element[0]);
        }, this);
        
        this.number = 0;
        for (let word of this.id_words) {
            this.number += word.length;
        }
    }

    arr_occurrences(array, string) {
        let count = 0;
        for (let item of array) {
            if (item === string) {
                ++count;
            }
        }
        return count;
    }

    occurrences(string, sub) {
        string += "";
        sub += "";

        if (sub.length <= 0) return (string.length + 1);

        let n = 0;
        let pos = 0;
        
        while (true) {
            pos = string.indexOf(sub, pos);
            if (pos >= 0) {
                ++n;
                pos += 1;
            }
            else {
                break;
            }
        }

        return n;
    }

    count_similar_words(words) {
        let count = 0;
        for (let w of this.id_words) {
            if (words.includes(w)) {
                count += w.length;
            }
        }
        return count / this.id_words.length;
    }

    // May be better for finding sub-words? Around the same time (maybe less by a little)
    count_similar_words_alt(text) {
        let count = 0;

        for (let w of this.id_words) {
            let word_importance = this.importance.get(w);

            count += w.length * this.occurrences(text, w);
        }

        return count / this.number;
    }

    // Return how similar a string is to the compiled similarity string
    compare(string) {
        string = string.toLowerCase();

        let words = string.split(/[";\'?!:,.()\[\]*\s]/);
        
        let similarity = this.count_similar_words(words);

        // let similarity = this.count_similar_words_alt(string);
        return similarity;
    }
}

function do_similar_search(data, query) {
    const relevance = document.getElementById("relevance").checked;
    const reference_code = utils.parse_reference(query);
    
    if (!reference_code) {
        return;
    }

    const verse = utils.get_verse_from_reference(reference_code).verse;

    if (!verse) {
        return;
    }
    
    // Create a similarity object
    const similarity = new Similarity(verse.text);

    let results = get_results(data, similarity);

    // Draw the results on the page
    let number = document.getElementById("placeholder")

    // Clear former results
    let search_results = $("#text-search-results");
    search_results.empty();

    // utils.place_verse(search_results, )

    // Draw data
    number.textContent = "Results: " + results.total;

    if (relevance) {
        utils.place_results_by_relevance(results, search_results);
    }
    else {
        // Fill in divs of each result
        utils.place_search_results(results.ot, "Old Testament", search_results, results.min, results.max);
        utils.place_search_results(results.nt, "New Testament", search_results, results.min, results.max);
        utils.place_search_results(results.bofm, "Book of Mormon", search_results, results.min, results.max);
        utils.place_search_results(results.dc, "Doctrine and Covenants", search_results, results.min, results.max);
        utils.place_search_results(results.pgp, "Pearl of Great Price", search_results, results.min, results.max);
    }


    // Ensure it scrolls to the top
    search_results.animate({scrollTop: 0}, "fast");
}

function get_results(data, similarity) {
    let results = utils.get_volume_names_arrays(data);

    let verse_iter = utils.verse_iterator(data);
    let result = verse_iter.next();

    // Loop through each verse
    let total = 0;

    let max_similarity = 0;
    let min_similarity = 0;
    if (!result.done) {
        max_similarity = similarity.compare(result.value.verse.text);
        min_similarity = max_similarity;
    }

    while(!result.done) {
        let verse = result.value.verse;

        const similarness = similarity.compare(verse.text);

        if (similarness > max_similarity) {
            max_similarity = similarness;
        }
        if (similarness < min_similarity) {
            min_similarity = similarness;
        }

        // Don't count non-similar verses
        if (!similarness) {
            result = verse_iter.next();
            continue;
        }

        let verse_match = {};

        verse_match.similarity = similarness;
        verse_match.formatted_html = verse.text;
        verse_match.url = result.value.chapter.url;
        verse_match.ref = result.value.book.name + " " + result.value.chapter.number + ":" + result.value.verse_number;

        verse_match.links = verse.links_simple;
        verse_match.code = `${result.value.volume_name}:${result.value.book_name}:${result.value.chapter_number + 1}:${result.value.verse_number}`;

        results[result.value.volume_name].push(verse_match);

        total += 1;

        result = verse_iter.next();
    }

    results["total"] = total;
    results["max"] = max_similarity;
    results["min"] = min_similarity;
    
    return results;
}