/**
 * Utility functions to make iterating through the standard works easier
*/

import {Context} from "./context.js";


// Yield an indicator of the verse in the form {verse: verse, chapter: chapter, book: book, volume: volume}
export function* verse_iterator(data) {
    for (let key_volume in data) {
        let volume = data[key_volume];

        for (let key_book in volume.books) {
            let book = volume.books[key_book];

            if (!book.hasOwnProperty("chapters")) {
                continue;
            }

            for (let i = 0; i < book.chapters.length; ++i) {
                let chapter = book.chapters[i];

                for (let key_verse in chapter.verses) {
                    yield {
                        verse: chapter.verses[key_verse],
                        verse_number: key_verse,
                        chapter: chapter,
                        chapter_number: i,
                        book: book,
                        book_name: key_book,
                        volume: volume,
                        volume_name: key_volume
                    };
                }
            }
        }
    }
}

export function* book_iterator(data) {
    for (let key_volume in data) {
        let volume = data[key_volume];

        for (let key_book in volume.books) {
            let book = volume.books[key_book];

            yield {
                book: book,
                book_name: key_book,
                volume: volume,
                volume_name: key_volume
            };
        }
    }
}

export function get_volume_names_arrays(data) {
    let results = {};

    for (let key_volume in data) {
        results[key_volume] = [];
    }

    return results;
}

function match_keywords(text, keywords, case_sensitive) {
    if (!case_sensitive) {
        text = text.toLowerCase();
    }

    let length = 0;
    for (let keyword of keywords) {
        if (text.startsWith(keyword)) {
            if (keyword.length > length) {
                length = keyword.length;
            }
        }
    }

    return length;
}

// Given text, a list of words, and a bool, return the text with matching words highlighted
export function highlight_verse(verse, keywords, case_sensitive) {
    let highlighted_text = [];

    for (let i = 0; i < verse.length; ++i) {
        let match_length = match_keywords(verse.substr(i), keywords, case_sensitive);
        
        // if a keyword matched from this position, use it
        if (match_length > 0) {
            let matched_phrase = verse.substr(i, match_length)
            highlighted_text.push("<span class='text-highlight'>" + matched_phrase + "</span>");
            i += match_length - 1;
        }
        else {
            // Just add this character, it doesn't match
            highlighted_text.push(verse[i]);
        }
    }

    return highlighted_text.join("");
}

function get_volume_from_book(book) {
    let data = new Context().scriptures;
    let book_iter = book_iterator(data);

    let result = book_iter.next();
    while(!result.done) {
        if (result.value.book_name === book) {
            return result.value.volume_name;
        }

        result = book_iter.next();
    }

    return "";
}

export function code_to_name(code) {
    let lookup_table = new Context().lookup_table;

    return lookup_table[code];
}

export function name_to_code(name) {
    let lookup_table = new Context().lookup_table;

    return lookup_table[name];
}

export function parse_reference(reference) {
    // Split at colon
    let parts = reference.split(":");
    if (parts.length != 2) {
        return null;
    }

    let verse = parts[1].trim();

    // Parse the book and chapter
    parts[0] = parts[0].trim();

    let last_space_index = parts[0].lastIndexOf(" ");
    let book = parts[0].substr(0, last_space_index).trim();
    let chapter = parts[0].substr(last_space_index + 1).trim();
    
    let book_code = name_to_code(book);

    if (book_code === "") {
        return null;
    }

    let volume = get_volume_from_book(book_code);

    if (!volume) {
        return null;
    }

    return `${volume}:${book_code}:${chapter}:${verse}`;
}

export function parse_reference_code(reference) {
    // Split at colon
    let parts = reference.split(":");
    if (parts.length != 3) {
        return null;
    }

    let book_code = parts[0].trim();
    let volume = get_volume_from_book(book_code);

    return `${volume}:${reference}`;
}

// Get verse from reference
export function get_verse_from_reference(reference) {
    let data = new Context().scriptures;

    let parts = reference.split(":");

    let volume = parts[0];
    let book = parts[1];

    // Chapter is a 0 indexed array
    let chapter = (parts[2] - 1).toString();
    let verse = parts[3];


    try {
        let ret_verse = data[volume]["books"][book]["chapters"][chapter]["verses"][verse];
        return {
            verse: ret_verse,
            url: data[volume]["books"][book]["chapters"][chapter]["url"],
            reference: code_ref_to_ref(reference),
        };
    }
    catch {
        return undefined;
    }
}

export function code_ref_to_ref(code) {
    let parts = code.split(":");

    let book = code_to_name(parts[1]);
    let chapter = parts[2];
    let verse = parts[3];

    return `${book} ${chapter}:${verse}`;
}

export function create_modal(callback, arg) {
    let modal = $("#modal");
    let modal_body = $("#modal-body");
    
    modal_body.empty();

    let close = $("#modal-close");

    // Add contents to modal
    callback(modal_body, arg);

    // Fade in
    modal.css("display", "flex");
    modal.hide();
    modal.fadeIn(100);

    modal.on("click", function(e) {
        // If we clicked the modal itself, or a parent with the content class, return
        if ($(e.target).is($(".modal-content")) || $(e.target).parents(".modal-content").length) {
            return;
        }

        $(this).fadeOut(100);
    })

    close.on("click", function(e) {
        modal.fadeOut(100);
    });
}

export function show_loading() {
    let modal = $("#modal-spinner");

    modal.css("display", "flex");
    modal.hide();

    setTimeout(function() {
        modal.show();
    }, 10);
}

export function hide_loading() {
    let modal = $("#modal-spinner");
    modal.hide();
}

export function place_results_by_relevance(results, search_area) {
    let verses_div = $("<div></div>").appendTo(search_area);
    
    let min = results["min"] || 0;
    let max = results["max"] || 0;

    results = results.nt.concat(results.ot).concat(results.bofm).concat(results.dc).concat(results.pgp);

    // Sort results
    results.sort(function(a, b) {
        return a.similarity < b.similarity;
    });

    for (let i = 0; i < results.length; ++i) {
        place_verse(verses_div, results[i], min, max);
    }
    
    // while (results.length) {
    //     // Get highest result
    //     let similar = get_most_relevant_result(results);
    //     results.splice(similar.index, 1);

    //     place_verse(verses_div, similar.result);
    // }
}

export function place_search_results(results, title, search_area, min, max) {
    let volume_div = $("<div></div>").appendTo(search_area);

    let disclosure = $("<h2></h2>").appendTo(volume_div);
    disclosure.addClass("disclosure");

    let triangle = $("<span></span>").appendTo(disclosure);
    if (results.length > 0) {
        triangle.addClass("fas fa-caret-down disclosure-caret");
    }
    else {
        triangle.addClass("fas fa-caret-right disclosure-caret");
    }

    let volume_name = $("<span></span>").appendTo(disclosure);
    volume_name.addClass("disclosure-text");
    volume_name.text(title);

    let volume_count = $("<span></span>").appendTo(disclosure);
    volume_count.addClass("volume-count");
    volume_count.text(results.length);

    let verses_div = $("<div></div>").appendTo(volume_div);

    for (let i = 0; i < results.length; ++i) {
        place_verse(verses_div, results[i], min, max);
    }
}

function map_value(val, min, max) {
    let slope = 1.0 * (1 / (max - min));
    return slope * (val - min);
}

export function place_verse(verses_div, verse, min, max) {
    let result = $("<div></div>").appendTo(verses_div);
    result.addClass("text-search-result");

    let result_title = $("<h2></h2>").appendTo(result);
    result_title.text(verse.ref);

    let result_link = $("<a></a>").appendTo(result);
    result_link.attr("href", verse.url);
    result_link.attr("target", "_blank");
    result_link.attr("title", "Open on churchofjesuschrist.org");
    result_link.html('<span class="fas fa-external-link-alt extern-link"></span>');

    // Create redirect link
    let url = `${location.protocol}//${location.host}${location.pathname}`;
    let query = code_ref_to_ref(verse.code);
    // Encode the & character to not interrupt query strings
    query = query.replace(/&/g, "%26").replace(/\s/g, "%20");

    // Add a button to link to footnote mode
    if (verse.links.length) {
        let footnotes_link = $("<a></a>").appendTo(result);
        
        let href = url + `?mode=footnote&query=${query}`;
        footnotes_link.attr("href", href);
        footnotes_link.attr("title", "View footnote graph");
        footnotes_link.html('<span class="fas fa-project-diagram extern-link"></span>');
    }

    // Add a button to link to similarity mode
    let similarity_link = $("<a></a>").appendTo(result);
    let href = url + `?mode=similar&query=${query}`;
    similarity_link.attr("href", href);
    similarity_link.attr("title", "View similar verses");
    similarity_link.html('<span class="fas fa-equals extern-link"></span>');

    // Show similarity percent
    if (verse.similarity) {
        let similarity = $("<span></span>").appendTo(result);
        similarity.addClass("similarity");
        let similar_percent = Math.round(map_value(verse.similarity, min, max) * 100);
        similarity.text(`  (${similar_percent}%)`);
    }

    let result_body = $("<p></p>").appendTo(result);
    result_body.html(verse.formatted_html);
}

export function remove_common_words(words) {
    const common = ["the", "and", "of", "to", "that", "in", "unto", "he", "i", "shall", "for", "they", "be", "his", "a", "it",
    "them", "not", "is", "all", "him", "with", "my", "which", "their", "have", "was", "ye", "thou", "will", "me", "you", 
    "thy", "but", "as", "from", "were", "this", "are", "said", "by", "upon", "thee", "people", "had", "came", "when",
    "out", "behold", "man", "there", "up", "land", "also", "come", "your", "we", "did", "hath", "into", "son", "now",
    "who", "king", "on", "if", "one", "things", "even", "before", "then", "pass", "house", "men", "against", "day",
    "children", "these", "an", "so", "do", "should", "at", "her", "because", "therefore", "let", "no", "our", "go",
    "say", "us", "may", "or", "after", "made", "shalt", "great", "saying", "hand", "forth", "yea", "father", "among",
    "saith", "every", "went", "down", "according", "name", "many", "over", "again", "o", "know", "away", "thus", "sons", 
    "words", "give", "time", "make", "what", "am", "hast", "city", "take", "days", "any", "been", "those", "neither",
    "more", "brethren", "brought", "thereof", "would", "word", "she", "whom", "put", "might", "thine", "mine", "called",
    "two", "place", "moses", "bring", "own", "wherefore", "nor", "fathers", "given", "about", "servant",
    "took", "sent", "voice", "way", "saw", "like", "yet", "judah", "done", "law", "see", "heard", "set", "hands",
    "spake", "evil", "cast", "years", "speak", "together", "offering", "other", "until", "thing", "commanded",
    "concerning", "how", "himself", "hear", "hundred", "eat", "life", "off", "world", "fire", "first", "servants",
    "themselves", "than", "work", "through", "glory", "face", "kings", "year", "another", "soul", "art", "blood",
    "eyes", "kingdom", "egypt", "death", "began", "high", "being", "spoken", "gave", "cause", "verily", "thousand",
    "three", "keep", "peace", "flesh", "same", "wilderness", "priests", "brother", "end", "priest", "ever", "under",
    "sin", "sword", "dead", "without", "much", "fear", "both", "taken", "answered", "found", "blessed", "cities",
    "mouth", "sea", "old", "can", "hearts", "where", "seed", "water", "written", "nations", "none", "save", "seven",
    "gold", "could", "cometh", "right", "must", "nephi", "having", "jacob", "wife", "manner", "side", "destroy", "left",
    "head", "has", "midst", "whose", "stand", "only", "round", "works", "seen", "dwell", "joseph", "night", "such",
    "stood", "four", "cut", "waters", "cannot", "drink", "fall", "enemies", "fruit", "die", "aaron", "very", "gathered",
    "five", "known", "mighty", "altar", "woman", "part", "bread", "hosts", "return", "silver", "received", "chief",
    "whole", "twenty", "burnt", "sight", "turn", "congregation", "some", "why", "war", "lay", "appointed", "strong",
    "lest", "daughters", "little", "while", "well", "full", "laid", "toward", "rest", "seek", "jews", "tree", "surely",
    "told", "feet", "field", "young", "above", "doth", "daughter", "nevertheless", "slain", "turned", "reign", "send",
    "become", "bear", "yourselves", "call", "judge", "multitude", "wise", "wilt", "exceedingly", "long", "disciples",
    "hearken", "battle", "live", "cry", "inhabitants", "meat", "mount", "babylon", "destroyed", "gone", "fell",
    "nothing", "whatsoever", "kept", "book", "gate", "begat", "tell", "rejoice", "wine", "solomon", "mother", "places",
    "knew", "number", "between", "built", "whosoever", "princes", "last", "wrath", "walk", "hold", "praise", "body",
    "dwelt", "amen", "ten", "month", "poor", "morning", "build", "offer", "departed", "ways", "caused", "ground",
    "died", "though", "near", "twelve", "look", "serve", "filled", "gather", "destruction", "broken", "second", "smote",
    "therein", "passed", "cried", "sacrifice", "except", "beginning", "whether", "pharaoh", "prepared", "tribe",
    "temple", "write", "coming", "returned", "third", "enter", "thyself"];

    let ret_words = [];

    for (let word of words) {
        if (word !== "" && !common.includes(word)) {
            ret_words.push(word);
        }
    }

    return ret_words;
}

export function get_preferences() {
    let default_preferences = {
        first_run: 1,
        last_mode: "",
    };

    // Local storage for preferences
    if (localStorage.getItem("preferences") === null) {
        localStorage.setItem("preferences", JSON.stringify(default_preferences));
    }

    return JSON.parse(localStorage.getItem("preferences"));
}

export function set_preferences(preferences) {
    localStorage.setItem("preferences", JSON.stringify(preferences));
}

export function random_element(array) {
    return array[Math.random() * array.length | 0];
}