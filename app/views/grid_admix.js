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
            var annotations = qed.FetchAnnotations(this.model.get("dataset_id")) || {};
            if (!annotations.labels) annotations.labels = {};

            var headers = [];
            var rows = [];
            if (_.has(annotations, "columns")) {
                _.each(annotations["columns"], function (colSpec) {
                    headers.push({ "label": colSpec.label || colSpec, "id": colSpec.label || colSpec })
                });
                rows = _.map(items, function (item) {
                    return {
                        "values": _.map(annotations["columns"], function (colSpec) {
                            if (_.isObject(colSpec)) {
                                if (_.isArray(colSpec.fields)) {
                                    return _.map(colSpec.fields, function (field) { return item[field]; });
                                } else if (_.isString(colSpec.fields)) {
                                    return [item[colSpec.fields]];
                                }
                                return [item[colSpec.field] || ""];
                            } else if (_.isString(colSpec)) {
                                return [item[colSpec] || ""];
                            }
                        })
                    };
                });
            } else {
                headers = _.map(_.keys(_.first(items)), function (item_key) {
                    return { "label": annotations.labels[item_key] || item_key, "id": item_key };
                });
                rows = _.map(items, function (item) {
                    return {
                        "values": _.map(headers, function (header) {
                            return [item[header.id]];
                        })
                    };
                });
            }

            this.$el.html(Template({ "headers": headers, "rows": rows, "showAdmix": annotations["admix"] || false }));
        }
    }
});