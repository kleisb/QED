var Template = require("./templates/admix_ratios");

module.exports = Backbone.View.extend({
    races: ["AMR", "AFA", "EUR", "ASN"],

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
        var finderFn = function (item) {
            return _.contains(_.values(item), this.options.subpopulation);
        };

        var subpopulation = _.find(this.model.get("items"), finderFn, this) || {};
        var data = _.reject(this.model.get("items"), finderFn, this) || [];

        var m = [20, 40, 0, 40];
        var w = 300;
        var h = 50;

        var strokeFn = d3.scale.category20b();

        var axis = d3.svg.axis().ticks(0).orient("left");
        var x = d3.scale.ordinal().domain(this.races).rangePoints([0, w]);
        var y = {};
        _.each(this.races, function (d) {
            y[d] = d3.scale.linear().domain([0, 1]).range([h, 0]);
        });

        var _this = this;
        var line = d3.svg.line();
        var path = function (d) {
            return line(_this.races.map(function (p) {
                return [x(p), y[p](d[p])];
            }));
        };

        var svg = d3.select(_.first(this.$el.find(".c-admix-ratios"))).append("svg:svg")
            .attr("width", w + m[1] + m[3])
            .attr("height", h + m[0] + m[2])
            .append("svg:g").attr("transform", "translate(" + m[3] + "," + m[0] + ")");

        // Add foreground lines.
        var idx = 0;
        svg.append("svg:g").attr("class", "foreground").selectAll("path").data(data)
            .enter().append("svg:path").attr("d", path).attr("stroke", function (d) {
                return strokeFn(idx++ % 20);
            });

        // Add a group element for each trait.
        var g = svg.selectAll(".trait").data(this.races).enter().append("svg:g").attr("class", "trait")
            .attr("transform", function (d) {
                return "translate(" + x(d) + ")";
            });

        // Add an axis and title.
        g.append("svg:g").attr("class", "axis")
            .each(function (d) {
                d3.select(this).call(axis.scale(y[d]));
            })
            .append("svg:text").attr("text-anchor", "middle").attr("y", -9)
            .text(function (d) {
                var subpop = subpopulation[d];
                if (subpop) return d + " (" + subpop + "%)";
                return d;
            });
    }
});