var BitHeatPrototype = {
    clear: function() {

    },

    setColorScale: function(scale) {
        this.color_scale = scale;
    },

    addDataPoint: function(x, y, value) {
        var buf = this.buffer_ctx;

        buf.fillStyle = this.color_scale(value);
        buf.fillRect(x, y, 1.0, 1.0);
    },

    display: function() {
        this.render_ctx.drawImage(this.buffer, 0, 0);
    }
};

var BitHeatFactory = {
    create: function(config) {
        var obj = Object.create(BitHeatPrototype, {});
        obj.config = { };

        _.extend(obj.config, config);

        obj.buffer = document.createElement('canvas');
        obj.buffer.width = config.width;
        obj.buffer.height = config.height;

        obj.buffer_ctx = obj.buffer.getContext('2d');
        obj.render_ctx = obj.config.canvas_el.getContext('2d');

        var x_scale_factor = config.width / obj.config.num_data_x,
            y_scale_factor = config.height / obj.config.num_data_y;

        obj.buffer_ctx.scale(x_scale_factor, y_scale_factor);

        return obj;
    }
};
