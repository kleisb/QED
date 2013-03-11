module.exports = Backbone.Model.extend({
    url: function () {
        return this.get("data_uri");
    },

    parse: function (tsv_text) {
        var items = d3.tsv.parse(tsv_text);
        return {
            "items": items
        }
    },

    fetch: function (options) {
        return Backbone.Model.prototype.fetch.call(this, _.extend({}, options, {dataType: 'text'}));
    }
});