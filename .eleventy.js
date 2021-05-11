const moment = require('moment');
const syntaxHighlight = require('@11ty/eleventy-plugin-syntaxhighlight');
const pluginRss = require('@11ty/eleventy-plugin-rss');

module.exports = function(eleventyConfig) {
    eleventyConfig.addPassthroughCopy("data");
    eleventyConfig.addPassthroughCopy("_redirects")
    eleventyConfig.setDataDeepMerge(true);

    // Plugins!
    eleventyConfig.addPlugin(syntaxHighlight);
    eleventyConfig.addPlugin(pluginRss);

    // Add a filter for dates
    eleventyConfig.addFilter("readableDate", date => {
        return moment.parseZone(date)//.format("LL");
    });

    eleventyConfig.addFilter("sortIndex", series => {
        return series.sort(function(a, b) {
            return a.data.series_index - b.data.series_index;
        });
    });

    // Collection for published posts
    eleventyConfig.addCollection("posts", function(collectionApi) {
        let all_posts = collectionApi.getFilteredByTag("post");
        return all_posts.filter(function(item) {
            return !("draft" in item.data);
        });
    });

    // Filter out "default" collections for tags
    eleventyConfig.addCollection("tags", function(collectionApi) {
        let all_collections = collectionApi.getAll();
        let all_tags = new Set();

        all_collections.forEach(function(item) {
            if ("draft" in item.data) {
                return false;
            }
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

    // Get list of series
    eleventyConfig.addCollection("series", function(collectionApi) {
        return collectionApi.getAll().filter(function(item) {
            return "series" in item.data;
        });
    });

    eleventyConfig.addCollection("series-names", function(collectionApi) {
        let all_collections =  collectionApi.getAll();
        let all_series = new Set();
        all_collections.forEach(function(item) {
            if ("draft" in item.data) {
                return false;
            }
            if ("series" in item.data) {
                all_series.add(item.data.series);
            }
        });
        return [...all_series].sort();
    });
}
