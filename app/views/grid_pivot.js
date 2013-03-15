var Template = require("./templates/grid_pivot");

module.exports = Backbone.View.extend({

    initialize: function (options) {
        _.bindAll(this, "renderGrid");

        this.model.on("load", this.renderGrid);
    },

    renderGrid: function () {
        var items = this.model.get("items");
        if (items && items.length) {
            var annotations = qed.FetchAnnotations(this.model.get("dataset_id")) || {};
            if (!annotations.labels) annotations.labels = {};

            var headers = [];
            var rows = [];
            var pivots = [];
            if (_.has(annotations, "columns")) {
                headers = _.map(annotations["columns"], function (colSpec) {
                    if (_.has(colSpec, "pivot") && _.has(colSpec, "view") && _.has(colSpec, "model") && _.has(colSpec, "join_data")) {
                        colSpec.isPivot = true;
                        colSpec.mappings = [];
                        pivots.push(colSpec);
                    }
                    return { "label": colSpec.label || colSpec, "id": colSpec.label || colSpec };
                });

                var cellTpl = function (colSpec, cell) {
                    return _.extend({ "span": colSpec["span"], "values": [] }, cell);
                };

                rows = _.map(items, function (item) {
                    return {
                        "cells": _.map(annotations["columns"], function (colSpec) {
                            if (_.isObject(colSpec)) {
                                if (_.isArray(colSpec.fields)) {
                                    return cellTpl(colSpec, {
                                        "values": _.map(colSpec.fields, function (field) {
                                            return item[field];
                                        })
                                    });
                                }
                                if (_.isString(colSpec.fields)) {
                                    return cellTpl(colSpec, { "values": [item[colSpec.fields]] });
                                }

                                if (colSpec.isPivot) {
                                    var pivotId = _.uniqueId("pivot_");
                                    colSpec.mappings.push({ "pivotValue": item[colSpec.pivot], "pivotId": pivotId });
                                    return cellTpl(colSpec, { "pivotColumn": true, "pivotId": pivotId });
                                }

                                return cellTpl(colSpec, { "values": [item[colSpec.field] || ""] });
                            } else if (_.isString(colSpec)) {
                                return cellTpl(colSpec, { "values": [item[colSpec] || ""] });
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
                        "cells": _.map(headers, function (header) {
                            return { "values": [item[header.id]] };
                        })
                    };
                });
            }

            this.$el.html(Template({ "headers": headers, "rows": rows }));

            _.each(pivots, function (colSpec) {
                var ViewClass = qed.Views[colSpec["view"]];

                var join_data = colSpec["join_data"];
                var join_sources = [];
                if (_.isString(join_data)) {
                    join_sources.push(join_data);
                } else if (_.isArray(join_data)) {
                    join_sources = join_data;
                }

                _.each(join_sources, function (join_source) {
                    var model = new qed.Models[colSpec["model"]]({ "data_uri": join_source });
                    model.fetch({
                        success: function () {
                            _.each(colSpec.mappings, function (mapping) {
                                var search = {};
                                search[colSpec.pivot] = mapping.pivotValue;

                                var subitems = _.where(model.get("items"), search);
                                if (!_.isEmpty(subitems)) {
                                    var submodel = new Backbone.Model({ "items": subitems });
                                    var view = new ViewClass(_.extend(colSpec.options, { "model": submodel  }));
                                    $("#" + mapping.pivotId).append(view.render().el);
                                    submodel.trigger("load");
                                }
                            });
                        }
                    });
                });
            });
        }
    }
});