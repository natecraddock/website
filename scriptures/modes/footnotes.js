import { Context } from "../context.js";
import * as utils from "../utils.js";

class Node {
    constructor(x, y) {
        this.x = x;
        this.y = y;
    }

    add(other) {
        return new Node(this.x + other.x, this.y - other.y);
    }

    scale(scalar) {
        return new Node(this.x * scalar, this.y * scalar);
    }

    distance(other) {
        return Math.sqrt(Math.pow(this.x - other.x, 2) + Math.pow(this.y - other.y, 2));
    }

    near(point) {
        return this.distance(point) < 15;
    }
}

// Basic mode
export class FootnoteSearch {
    // Set up divs and settings for the app
    enter() {
        console.debug("Entered Footnote Search");

        let context = new Context();
        const prompts = ["1 Nephi 1:1", "Romans 1:16", "Genesis 1:1", "D&C 121:7",
                         "Mosiah 3:19", "Moses 1:39", "2 Nephi 31:20", "3 Nephi 27:27",
                         "Isaiah 1:18", "John 3:16"];
        context.set_search_prompt(utils.random_element(prompts));

        document.getElementById("footnote-mode").classList.add("active-mode");

        context.set_pattern(".+\\s+\\d+:\\d+");

        // Create mode settings
        context.mode_settings.empty();
        context.mode_settings.append("<label><input type='checkbox' id='draw-labels'>Draw Labels</label><br>");
        context.mode_settings.append("<input type='range' id='search-depth' min='1' max='5' value='4'><span id='range-label'>5</span><br> Search Depth<br>");

        // Load mode settings from config
        if (context.has_config("footnote_search_depth")) {
            document.getElementById("search-depth").value = context.get_config("footnote_search_depth");
            $("#range-label").text(document.getElementById("search-depth").value);
        }
        else {
            document.getElementById("search-depth").value = 3;
            $("#range-label").text(3);
        }

        if (context.has_config("footnote_search_labels")) {
            document.getElementById("draw-labels").checked = (context.get_config("footnote_search_labels") == 1) ? true : false;
        }
        else {
            document.getElementById("draw-labels").checked = true;
        }

        context.mode_settings.on("click", function() {
            let depth = document.getElementById("search-depth").value;
            context.set_config("footnote_search_depth", depth);

            let labels = document.getElementById("draw-labels").checked ? 1 : 0;
            context.set_config("footnote_search_labels", labels);

            // Update value
            document.getElementById("range-label").textContext = document.getElementById("search-depth").value;
        });

        $("#search-depth").on("input", function() {
            $("#range-label").text($(this).val());
        });

        // Create area for drawing
        let app_area = $("#app");

        let footnote_search = $("<div></div>").appendTo(app_area);
        footnote_search.attr("id", "footnote-search");

        let canvas = $("<canvas></canvas>").appendTo(footnote_search);
        canvas.attr("id", "footnote-canvas");

        this.canvas = document.getElementById("footnote-canvas");
        this.ctx = this.canvas.getContext("2d");
        this.touch = -1;
        this.mouse = new Node(0, 0);
        
        context.hide_footer();

        // Hide overflow
        $("#app").css("overflow", "hidden");

        // Make canvas resize with window
        this.setup_listeners();
        this.offset = new Node(0, 0);
        this.zoom_level = 2;
        this.resize();
        
        this.set_zoom()

        context.settings_update = resize_handler;
        window.onresize = resize_handler;

        // Show zoom buttons
        $("#zoom-in-button").show();
        $("#zoom-out-button").show();
    };

    set_zoom() {
        this.zoom = Math.pow(2, this.zoom_level);
        this.draw();
    }

    zoom_change(zoom_in) {
        let iterations = 0;
        
        let app = this;
        
        if (zoom_in && this.zoom_level < 10) {
            this.zoom_level += 1;
            this.offset = this.offset.scale(2);
        }
        else if (this.zoom_level > 0) {
            this.zoom_level -= 1;
            this.offset = this.offset.scale(0.5);
        }

        this.set_zoom();        
    };
    
    offset_change(e, event_origin) {      
        this.offset.x = e.pageX - event_origin.x;
        this.offset.y = e.pageY - event_origin.y;
        this.draw();
    }

    set_mouse_coords(x, y) {
        this.mouse.x = x;
        this.mouse.y = y;

        this.draw();
    }

    setup_listeners() {
        this.mouse_down = false;
        let event_origin = new Node(0, 0);

        $("#zoom-in-button").on("click", function(e) {
            zoom_handler(true);
        });

        $("#zoom-out-button").on("click", function(e) {
            zoom_handler(false);
        });


        $("#center-button").on("click", function(e) {
            let context = new Context();
            context.mode.offset = new Node(0, 0);
            context.mode.draw();
        });

        $("canvas").on("mousedown", function(e) {
            let context = new Context();
            context.mode.mouse_down = true;

            let offset = context.mode.offset;
            event_origin = new Node(e.pageX - offset.x, e.pageY - offset.y);
            
            context.mode.click(new Node(e.offsetX, e.offsetY));
        });
        
        $("canvas").on("mouseup", function(e) {
            let context = new Context();
            context.mode.mouse_down = false;
        });

        $("canvas").on("mousemove", function(e) {
            let context = new Context();

            // Always set new mouse coordinates
            context.mode.set_mouse_coords(e.offsetX, e.offsetY);

            if (!context.mode.mouse_down) {
                return;
            }

            context.mode.offset_change(e, event_origin);
        });

        let canvas = document.getElementById("footnote-canvas");

        // Only handle one touch
        canvas.addEventListener("touchstart", function(e) {
            let context = new Context();

            if (context.mode.touch !== -1) {
                return;
            }

            let touch = e.changedTouches[0];

            // Always set new mouse coordinates
            context.mode.set_mouse_coords(touch.offsetX, touch.offsetY);

            context.mode.touch = e.changedTouches[0].identifier;

            
            let offset = context.mode.offset;
            event_origin = new Node(touch.pageX - offset.x, touch.pageY - offset.y);

            context.mode.click(new Node(touch.offsetX, touch.offsetY));   
        }, false);

        canvas.addEventListener("touchmove", function(e) {
            let context = new Context();

            e.preventDefault();
            
            let touch = e.changedTouches[0];
            // Always set new mouse coordinates
            context.mode.set_mouse_coords(touch.offsetX, touch.offsetY);
            
            if (context.mode.touch === e.changedTouches[0].identifier) {
                context.mode.offset_change(touch, event_origin);
            }
        }, false);

        canvas.addEventListener("touchend", function(e) {
            let context = new Context();
            if (context.mode.touch === e.changedTouches[0].identifier) {
                context.mode.touch = -1;
            }
        }, false);
    }

    // Clear divs and settings for the app
    exit() {
        let context = new Context();
        console.debug("Exited Footnote Search");

        context.set_pattern("");

        $("#app").css("overflow", "visible");
        context.settings_update = null;
        window.onresize = null;

        $("#footnote-search").remove();

        // Hide footnote buttons
        $("#zoom-in-button").hide();
        $("#zoom-out-button").hide();
    };

    // Execute "search" button
    execute() {
        const search_depth = document.getElementById("search-depth").value;

        let context = new Context()
        let reference = context.get_search_value();

        let parsed_reference = utils.parse_reference(reference);
        if (parsed_reference) {

            let used_refs = new Set();
            used_refs.add(parsed_reference);
            this.tree = get_linked_footnotes(parsed_reference, used_refs, search_depth);
            this.nodes = create_tree(this.tree, 0, 0, 0, 360);
        }

        context.mode.draw();
    };

    resize() {
        let c = document.getElementById("footnote-canvas");
        let app = document.getElementById("app");
        if (!c) {
            return;
        }
        
        c.width = app.offsetWidth;
        c.height = app.offsetHeight;
        
        this.width = c.width;
        this.height = c.height;

        this.origin = new Node(this.width / 2, this.height / 2);
        this.offset = new Node(0, 0);
    
        this.draw();
    };

    draw() {
        const draw_labels = document.getElementById("draw-labels").checked;

        // Show center button if needed
        if (this.offset.x != 0 && this.offset.y != 0) {
            $("#center-button").fadeIn(100);
        }
        else {
            $("#center-button").fadeOut(100);
        }
        this.ctx.clearRect(0, 0, this.width, this.height);

        if (this.tree) {
            // Draw the nodes! This is the heart of the app! <3
            this.draw_tree(this.nodes, true);

            if (draw_labels) {
                this.draw_labels(this.nodes, true);
            }
        }
        else {
            // Draw a prompt
            let message = "Enter a verse reference to";
            let message_line_2 = "show related verses";
            this.ctx.font = "28px Roboto";

            let width = this.ctx.measureText(message).width;
            let width2 = this.ctx.measureText(message_line_2).width;
            this.ctx.fillText(message, this.origin.x - (width / 2), 100);
            this.ctx.fillText(message_line_2, this.origin.x - (width2 / 2), 124);
        }
    }

    to_local_coords(node) {
        return this.origin.add(node.scale(this.zoom).add(this.offset));
    }

    draw_node(node, color) {
        this.ctx.beginPath();
        this.ctx.strokeStyle = color;
        this.ctx.fillStyle = color;
        this.ctx.arc(node.x, node.y, 4, 0, 2 * Math.PI);
        this.ctx.fill();
        this.ctx.stroke();
    }

    draw_labels(nodes, root) {
        let node = nodes.n;

        node = node.scale(this.zoom).add(this.offset);
        node = this.origin.add(node);
    
        for (let i = 0; i < nodes.children.length; ++i) {
            if (!nodes.children[i].n) {
                continue;
            }
            this.draw_labels(nodes.children[i], false);
        }

        let color = "#141414";
        if (root) {
            color = "#b82626";
        }
        if (node.near(this.mouse)) {
            color = "#4b6ea3";
        }

        this.ctx.fillStyle = color;
    
        // Draw the text label
        let max = 36;
        let min = 6;
        let radius = 250;

        let distance = node.distance(this.origin);

        let size = min;
        if (distance < radius) {
            size = max - (((max - min) / radius) * distance);
        }

        this.draw_label(node, nodes.ref, size);
    }

    draw_tree(nodes, root) {
        let node = nodes.n;

        node = node.scale(this.zoom).add(this.offset);
        node = this.origin.add(node);
    
        for (let i = 0; i < nodes.children.length; ++i) {
            if (!nodes.children[i].n) {
                continue;
            }

            let child = nodes.children[i].n;
            child = child.scale(this.zoom).add(this.offset);
            child = this.origin.add(child);

            this.ctx.beginPath();
            this.ctx.strokeStyle = "#141414";
            this.ctx.fillStyle = "#141414";
            this.ctx.lineWidth = 2;
            this.ctx.moveTo(node.x, node.y);
            this.ctx.lineTo(child.x, child.y);
            this.ctx.stroke();

            this.draw_tree(nodes.children[i], false);
        }

        let color = "#141414";
        if (root) {
            color = "#b82626";
        }
        if (node.near(this.mouse)) {
            color = "#4b6ea3";
        }

        // Draw the node
        this.draw_node(node, color);
    }

    draw_label(node, ref, size) {
        const VPAD = 8;
        const HPAD = 4;

        this.ctx.textBaseline = "top";
        const old_style = this.ctx.fillStyle;

        // Set font
        this.ctx.font = `${size}px Roboto`;
        let text = utils.code_ref_to_ref(ref);

        // Get dimensions (with padding)
        let width = this.ctx.measureText(text).width + HPAD;
        
        // Draw
        this.ctx.fillStyle = "#f0f0f0";
        this.ctx.fillRect(node.x + 5, node.y, width, size + VPAD);
        this.ctx.fillStyle = old_style;
        this.ctx.fillText(text, node.x + 5 + HPAD / 2, node.y + VPAD / 2 + 1);
    }

    click_r(nodes) {
        if (!nodes) {
            return;
        }

        let node = nodes.n.scale(this.zoom).add(this.offset);
        node = this.origin.add(node);

        if (node.near(this.mouse)) {
            this.mouse_down = false;
            this.touch = -1;
            utils.create_modal(verse_modal_cb, nodes.verse);
        }

        for (let i = 0; i < nodes.children.length; ++i) {
            this.click_r(nodes.children[i]);
        }
    }

    click(event) {
        if (this.nodes) {
            this.click_r(this.nodes);            
        }
    }
}

function create_tree(root, x, y, min, max) {
    // Create this node
    let n = new Node(x, y);
    
    let ret = {
        n: n,
        ref: root.reference,
        verse: root.verse,
        children: [],
    }

    // Count weights
    let weights = [];
    let total_weight = count_links(root) - 1;

    for (let i = 0; i < root.children.length; ++i) {
        weights.push(count_links(root.children[i]));
    }

    let range = max - min;
    let count = root.children.length;
    
    let start = min;
    for (let i = 0; i < count; ++i) {
        let arc = range * (weights[i] / total_weight);
        
        let middle = start + (arc / 2);

        let newx = 10 * count * Math.cos(middle * (Math.PI / 180));
        let newy = 10 * count * Math.sin(middle * (Math.PI / 180));

        ret.children.push(create_tree(root.children[i], x + newx, y + newy, start, start + arc));

        start += arc;
    }

    return ret;
}

function resize_handler() {
    let context = new Context();
    context.mode.resize()
}

function zoom_handler(zoom_in) {
    let context = new Context();

    context.mode.zoom_change(zoom_in);
    context.mode.draw();
}

function get_linked_footnotes(reference, used_refs, depth) {
    let verse = utils.get_verse_from_reference(reference);
    let node = {reference: reference, verse: verse, children: []};

    for (let ref of verse.verse.links_simple) {
        let parsed_reference = utils.parse_reference_code(ref);
        if (used_refs.has(parsed_reference)) {
            continue;
        }

        used_refs.add(parsed_reference);
        if (parsed_reference !== null && depth > 0) {
            node.children.push(get_linked_footnotes(parsed_reference, used_refs, depth - 1));
        }
    }

    return node;
}

function count_links(node) {
    let count = 1;

    for (let n of node.children) {
        count += count_links(n);
    }

    return count;
}

function verse_modal_cb(modal_div, verse) {
    let result = $("<div></div>").appendTo(modal_div);
    result.addClass("text-search-result");

    let result_title = $("<h2></h2>").appendTo(result);
    result_title.text(verse.reference);

    let result_link = $("<a></a>").appendTo(result);
    result_link.attr("href", verse.url);
    result_link.attr("target", "_blank")
    result_link.attr("title", "Open on churchofjesuschrist.org");
    result_link.html('<span class="fas fa-external-link-alt extern-link"></span>');

    let result_body = $("<p></p>").appendTo(result);
    result_body.html(verse.verse.text);
}