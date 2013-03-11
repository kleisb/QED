var Template = require("./templates/grid_admix");

module.exports = Backbone.View.extend({

    initialize: function (options) {
        _.bindAll(this, "renderGrid");

        this.model.on("load", this.renderGrid);
    },

    renderGrid: function () {
        console.log("grid_admix.renderGrid");
        var items = this.model.get("items");
        if (items && items.length) {
            var lookups = qed.Annotations[this.model.get("dataset_id")] || {};

            var headers = _.map(_.keys(_.first(items)), function(item_key) {
                return { "label": lookups[item_key] || item_key, "id": item_key };
            });
            var rows = _.map(items, function (item) {
                return {
                    "values": _.map(headers, function (header) {
                        return item[header.id];
                    })
                };
            });

            this.$el.html(Template({ "headers": headers, "rows": rows, "showAdmix": lookups["admix"] || false }));
        }
    }
});