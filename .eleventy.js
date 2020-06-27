const moment = require('moment');
const syntaxHighlight = require('@11ty/eleventy-plugin-syntaxhighlight');
const pluginRss = require('@11ty/eleventy-plugin-rss');

module.exports = function(eleventyConfig) {
    eleventyConfig.addPassthroughCopy("data");
    eleventyConfig.setDataDeepMerge(true);

    // Plugins!
    eleventyConfig.addPlugin(syntaxHighlight);
    eleventyConfig.addPlugin(pluginRss);
    
    // Add a filter for dates
    eleventyConfig.addFilter("readableDate", date => {
        return moment(date).format("LL");
    });

    // Filter out "default" collections for tags
    eleventyConfig.addCollection("tags", function(collectionApi) {
        let all_collections = collectionApi.getAll();
        let all_tags = new Set();

        all_collections.forEach(function(item) {
            if ("tags" in item.data) {
                let tags = item.data.tags;

                tags = tags.filter(function(item) {
                    switch(item) {
                        case "all":
                        case "post":
                            return false;
                    }
                    return true;
                });

                for (const tag of tags) {
                    all_tags.add(tag);
                }
            }
        });

        
        return [...all_tags].sort();
    });
}
