var View = require('./view');
var template = require('./templates/topbar');
var SignInModal = require("./templates/sign_in_modal");
var SlideDeckInputs = require('./templates/slidedeck_inputs');
var SignInView = require("./sign_in");
var SessionsView = require("./sessions_view");

module.exports = View.extend({
    id:'top-bar',
    template:template,
    _autocompleteSources:[],
    sessionsView: new SessionsView(),

    events:{
        "click .signin": function(e) {
            e.preventDefault();
            this.$signInModal.modal("toggle");
        },
        "click .new-session": function(e) { this.sessionsView.newSession(e); },
        "click .open-session": function(e) { this.sessionsView.openSession(e); },
        "click .save-session": function(e) { this.sessionsView.saveSession(e); }
    },

    initialize:function () {
        _.bindAll(this, 'initSearchAutocomplete', 'addAutocompleteSource');
    },

    afterRender:function () {
        this.initSearchAutocomplete();
        this.initSignIn();

        this.$el.find(".sessions-container").append(this.sessionsView.render().el);

        this.$el.find(".slide-deck-clip").click(function(e) {
            // capture initial state
            var orig_border = $(".qed-selectable svg").css("border");
            var orig_background = $(".qed-selectable svg").css("background-color");

            // make selectable
            $(".qed-selectable svg").css("border", "1px dashed black");
            $(".qed-selectable svg").hover(function() {
                $(this).css("background-color", colorbrewer.YlOrBr[9][2]);
            });

            // on hover activate clip tool
            $(".qed-selectable svg").hover(_.once(function() {
                // show clip tool
                var container_inputs = $("body").append(SlideDeckInputs()).find(".container-slidedeck-inputs");
                container_inputs.modal("show");

                var _svg = $(this);
                $(".container-slidedeck-inputs .add-to-current-slide").click(function(e) {
                    // adjust modal size
                    container_inputs.find(".modal-body").css("max-height", "800px");
                    container_inputs.css("top", "30%");
                    container_inputs.css("left", "30%");
                    container_inputs.css("width", "800px");
                    container_inputs.css("height", "600px");

                    // revert svg to non-selected state
                    _svg.css("background-color", orig_background);
                    _svg.css("border", orig_border);

                    // copy svg
                    container_inputs.find(".modal-body").append(_svg.parent().html());
                    container_inputs.find("svg").css("height", "400");
                    container_inputs.find("svg").css("width", "600");

                    // TODO : Append SVG to Slide Deck Section
                    // TODO : Scale Down SVG properly
                })
            }));
        });
    },

    initSearchAutocomplete:function () {
        var queryEl = this.$el.find("#querySearchTerm");
        var resultsModal = this.$el.find("#searchResults");
        resultsModal.modal({ backdrop:false, show:false });

        var modalBody = resultsModal.find(".modal-body");
        var me = this;

        queryEl.typeahead({
            source:function (query) {
                modalBody.empty();

                _.each(me._autocompleteSources, function (src) {
                    if (src.autocomplete) {
                        var resultBin = function (results) {
                            if (results && results.length) {
                                resultsModal.modal('show');

                                var html = [];
                                html.push("<ul class='nav nav-list'>");
                                if (src.label) html.push("<li class='nav-header'>" + src.label + "</li>");
                                _.each(_.uniq(results), function (result) {
                                    html.push("<li>" + result + "</li>");
                                });
                                html.push("</ul>");
                                modalBody.append(html.join(""));

                                modalBody.find("li").find("a").click(function () {
                                    resultsModal.modal("hide");
                                });
                            }
                        };

                        src.autocomplete(query, resultBin);
                    }
                });
            }
        });
    },

    addAutocompleteSource:function (newSource) {
        this._autocompleteSources.push(newSource);
    },

    initSignIn:function () {
        this.$signInModal = $("body").append(SignInModal()).find(".signin-container");

        var _this = this;
        var addAuthProviders = function(json) {
            _.each(json.providers, function (provider) {
                var sign_in_view = new SignInView({ "provider":provider });
                _this.$signInModal.find(".modal-body").append(sign_in_view.render().el);
                _this.$signInModal.find(".signout-all").click(function() {
                    sign_in_view.signout();
                });
            });
        };

        // prepare sign in process in case of 403 (Forbidden)
        var signInProcessStart = _.once(function() {
            $.ajax({
                url: "svc/auth/providers",
                type: "GET",
                dataType: "json",
                success: function(json) {
                    addAuthProviders(json);
                    _this.$signInModal.modal("show");
                    _this.$signInModal.find(".signout-all").click();
                }
            });
        });

        this.$el.ajaxError(function(event, request) {
            if (request.status == 403) signInProcessStart();
        });

        $.ajax({ url:"svc/auth/whoami", method:"GET", context:this, success:addAuthProviders });
    }
});
