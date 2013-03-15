var Template = require("./templates/admix_ratios");

module.exports = Backbone.View.extend({
    bar_height: 10,
    bar_gap: 3,
    group_width: 100,

    initialize: function (options) {
        _.extend(this, options);
        _.bindAll(this, "renderView");

        this.model.on("load", this.renderView);
    },

    render: function () {
        this.$el.html(Template());
        return this;
    },

    renderView: function () {
        if (!this.options.groupings) {
            console.log("no grouping specified");
            return;
        }

        var finderFn = function (item) {
            return _.contains(_.values(item), this.options.subpopulation);
        };

        var subpopulation = _.find(this.model.get("items"), finderFn, this) || {};
        var data = _.reject(this.model.get("items"), finderFn, this) || [];

        var bar_height = this.options.bar_height || this.bar_height;
        var bar_gap = this.options.bar_gap || this.bar_gap;
        var group_width = this.options.group_width || this.group_width;
        var full_height = bar_height * 3 + (data.length * (bar_height + bar_gap));

        var svg = d3.select(_.first(this.$el.find(".c-admix-ratios"))).append("svg")
            .attr("width", this.options.groupings.length * group_width)
            .attr("height", full_height);

        var g_container = svg.append("g").attr("class", "admix-columns").attr("transform", "translate(4,4)");

        _.each(this.options.groupings, function (grouping, idx) {
            var data_points = _.map(data, function (item) {
                return parseFloat(item[grouping]);
            }, this);

            var width = d3.scale.linear().domain([0, 1]).range([0, (group_width * 0.9)]);
            var position = d3.scale.ordinal().domain(_.range(data_points.length)).rangeBands([0, data_points.length * (bar_height + bar_gap)]);

            var rect_group = g_container.append("g").attr("transform", "translate(" + idx * group_width + ",0)");

            rect_group.append("text")
                .attr("y", bar_height)
                .text(function () {
                    if (_.has(subpopulation, grouping)) return grouping + " (" + subpopulation[grouping] + "%)";
                    return grouping;
                });

            rect_group.append("line")
                .attr("x1", 0)
                .attr("x2", 0)
                .attr("y1", bar_height * 1.5)
                .attr("y2", full_height);

            rect_group.selectAll("rect")
                .data(data_points)
                .enter()
                .append("rect")
                .attr("y", function (d, i) {
                    return (bar_height * 2) + position(i);
                })
                .attr("width", width)
                .attr("height", bar_height);

        });
    }
});