var TF = (function() {
    //singleton
    "use strict";

    var players = {};

    var cfg = {
        etf2l_update: true,
        ugc_update: true,
        steam_update: true,
        tf2c_show: true,
        logstf_show: true,
        steam_show: true,
        refresh: 1000,
        class_bonus: 10,
        map_bonus: 0,
        format_penalty: -10,
        baseline_div: 8,
        increment_div: 5,
        class_hours: 150,
        map_hours: 30,
        class_stack: 1,
        map_stack: 1,
        color_warning: "AF534F",
        sound_volume: 100,
        cache_days: 14,
    };

    function set_conf(config) {
        if (!isEmpty(config)) {
            var new_cfg = cfg;
            var key;
            var len = Object.keys(cfg).length;
            for (var i = 0; i < len; i++) {
                key = atIndex(cfg, i);
                if (key in config) new_cfg[key] = config[key];
                else {
                    new_cfg[key] = cfg[key];
                    //log(key, "new option:");
                }
            }
            cfg = new_cfg;
        }
        //log("set_conf", cfg);
    }

    function refresh_cache() {
        chrome.storage.local.get(null, function(data) {

            var clearlist = [];
            for (var key in data) {
                if (dayssince(data[key].cache) >= TF.getCFG("cache_days")) clearlist.push(key);
            }

            chrome.storage.local.remove(clearlist, function() {
                //log(clearlist, "remove old cache entries");
            });

        });
    }

    function init_options() {

        log("init_options");

        chrome.storage.sync.set({

            etf2l_update: true,
            ugc_update: true,
            steam_update: true,

            tf2c_show: true,
            logstf_show: true,
            steam_show: true,

            cache_days: 14,

        }, function() {});
    }

    //TF Public
    return {

        load_conf: function(callback) {
            chrome.storage.sync.get(null, function(cfg) {
                if (isEmpty(cfg)) init_options();
                else set_conf(cfg);
                if (callback) callback();
            });
        },

        init: function() {
            TF.load_conf(refresh_cache);
            this.MOTD = new TFMotd();
            this.MOTD.update();
        },

        getPlayer: function(id, callback) {
            if (id in players) players[id].update(callback);
            else {
                var player = new TFPlayer(id);
                log("New player " + id);
                players[id] = player;
                player.update(callback);
            }
        },

        getCFG: function(name, opt) {
            var option = cfg[name];
            if (option === undefined) {
                log(name, "no config value");
                return null;
            }
            if (opt !== undefined && typeof(option) == "string") return inArray(opt, option.split(" "));
            return option;
        },

        updateRating: function(slot, content, side) {
            //log(slot, "updating slot");
            if (slot !== null && slot !== undefined) {
                var a = slot.getElementsByClassName("rating")[0];
                if (a === undefined) {
                    a = document.createElement('a');
                    a.classList.add("rating");
                    a.href = "#";
                    var stars = document.createElement('span');
                    stars.classList.add("rating-static");
                    stars.classList.add("rating-" + content[0]);
                    stars.style.margin = "auto"; //center

                    if (content[2] == 1) stars.style.border = "1px solid #" + TF.getCFG("color_warning"); //minor bans
                    if (content[2] == 2) slot.style.background = "#" + TF.getCFG("color_warning"); //vacban, blacklist
                    a.appendChild(stars);
                    if (content[1]) {
                        var tooltip = document.createElement('span');
                        tooltip.classList.add("tooltip");
                        tooltip.innerHTML = content[1];
                        a.appendChild(tooltip);
                    }
                    var div = document.createElement('div');
                    div.appendChild(a);
                    if (side == 1) slot.insertBefore(a, slot.children[0]); //left
                    else if (side == 2) slot.appendChild(div); //after
                    else if (side == 3) slot.insertBefore(div, slot.children[0]); //before
                    else slot.appendChild(a); //right
                } else {
                    if (side == 2 || side == 3) slot.removeChild(a.parentNode);
                    else slot.removeChild(a);
                    TF.updateRating(slot, content, side);
                }
            }
        },

        getRating: function(id, slot, format, plclass, side, lobby_map, lobby_map_alt) {
            chrome.runtime.sendMessage({
                type: "player",
                id: id,
                format: format,
                plclass: plclass,
                lobby_map: lobby_map,
                lobby_map_alt: lobby_map_alt
            }, function(response) {
                //log(response);
                if (response.rating !== null) TF.updateRating(slot, response.rating, side);
            });
        },

    };

})();
