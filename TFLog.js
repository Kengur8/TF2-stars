function TFLog(gameID, selfIDs) {
    "use strict";

    this.gameID = gameID;

    this.selfIDs = selfIDs;

    this.data = [];

    this.cached = false;

    this.callbacks = [];

    this.updates = 0;

    this.updating = false;

    this.source = {
        name: "motd",
        url: "http://logs.tf/json/" + gameID,
        type: "application/json",
        onload: "_parse",
    };

}

TFLog.prototype.magic = {
    scout: 125,
    soldier: 200,
    pyro: 175,
    demoman: 175,
    heavyweapons: 300,
    engineer: 125,
    medic: 150,
    sniper: 125,
    spy: 125
}

TFLog.prototype.get = function(id, callback) {
    "use strict";

    var self = this;

    this.update(function() {
        if (self.data[id]) callback(self.data[id]);
        else callback("");
    });

};

TFLog.prototype.update = function(callback) {
    "use strict";

    var self = this;

    this.callbacks.push(callback);

    if (!this.updating) {

        this.updating = true;

        self.fetch();

        // chrome.storage.local.get("motd", function(cache) {

        //     if (!isEmpty(cache) && Object.keys(cache["motd"]) > 1 && dayssince(cache["motd"].cache) < 1) {
        //         self.data = cache["motd"];
        //         self.cached = true;
        //         //log("motd ok from " + dayssince(data.cache));
        //         callback(self);
        //     } else self.fetch();

        // });

    } else this.callback(self);

};

TFLog.prototype.fetch = function(self) {
    "use strict";

    this.updates = 1;

    XHR(this, this.source);

};

TFLog.prototype.callback = function(self) {
    "use strict";

    if (self === undefined && this.updates > 0) this.updates -= 1;
    self = this;

    if (self.updates === 0) {

        if (!self.cached) {
            var newdata = {};
            newdata.motd = self.data;
            self.cached = true;

            log(this.gameID, "log");

            //chrome.storage.local.set(newdata, function() {});
        }

        for (var j = self.callbacks.length - 1; j >= 0; j--) {
            if (isFunction(self.callbacks[j])) self.callbacks[j](self);
        }
        self.callbacks = [];
    }

};

TFLog.prototype._parse = function(resp) {
    "use strict";

    var selfID;
    var myteam;
    var myclass;
    var winteam;
    var medkills = {};

    var data = JSON.parse(resp.responseText);
    log(data, "got log");

    if (data) {
        if (data.chat) {
            for (var i = 0; i < data.chat.length; i++) {
                if (data.chat[i].steamid === "Console" && data.chat[i].msg.substr(0, 3) === "Map") {
                    var map_name = data.chat[i].msg.substr(5).split("_");
                    if (map_name.length > 1) {
                        var map_type = map_name[0];
                        map_name = map_name[0] + "_" + map_name[1];
                        // log("Map :", map_name);
                    }
                }
                if (data.chat[i].steamid === "Console" && data.chat[i].msg.substr(0, 11) === "Launch date") {
                    var date = data.chat[i].msg.substr(13);
                    try {
                        var date = new Date(Date(date));
                        // log("Launch date :", date);
                    } catch (e) {
                        log("Launch date unknown format");
                        var date = new Date.now();
                    }
                    break;
                }
            }
        }

        if (data.teams && data.rounds) {
            if (data.teams.Blue.score > data.teams.Red.score) winteam = "Blue";
            else if (data.teams.Blue.score < data.teams.Red.score) winteam = "Red";
            else if (data.rounds[0]["length"] < data.rounds[1]["length"]) winteam = data.rounds[0].winner;
            else winteam = data.rounds[1].winner;
            for (var k = 0; k < data.rounds.length; k++) {
                for (var j = 0; j < data.rounds[k].events.length; j++) {
                    if (data.rounds[k].events[j].type === "drop") {
                        var killer = data.rounds[k].events[j + 1].killer;
                        if (killer in medkills) medkills[killer] += 1;
                        else medkills[killer] = 1;
                    }
                }
            }
        }

        if (data.players) {
            for (var id in data.players) {
                var player = data.players[id];
                if (id64(id) in this.selfIDs) {
                    selfID = id;
                    // log("My ID :", selfID);
                    var myteam = player.team;
                    // log("My team:", myteam);
                    var myclass = player.class_stats[0].type;
                    // log("My class:", myclass);
                    break;
                }
            }

            for (var id in data.players) { //build data
                if (data["length"] / player.class_stats[0].total_time < 0.75) continue; //played only part
                var player = data.players[id];
                var stats = {};
                stats.player = id64(id);
                stats.game = this.gameID;
                stats.date = date;
                stats.type = map_type;
                stats.map = map_name;
                stats.time = player.class_stats[0].total_time;
                stats.cls = player.class_stats[0].type;
                if (player.team === winteam) stats.win = 1;
                else stats.win = 0;
                stats.dmgd = player.dmg;
                stats.dmgt = player.dt;
                stats.caps = player.cpc;
                stats.kills = player.kills;
                stats.asst = player.assists;
                stats.dths = player.deaths;
                stats.drops = player.drops;
                stats.kldrp = medkills[id] ? medkills[id] : 0;
                stats.heald = player.heal;
                stats.healm = (stats.cls === "medic") ? player.heal : 0;
                stats.heal = player.hr;
                stats.hs = player.headshots;
                stats.hsh = player.headshots_hit;
                stats.medkts = player.medkits;
                stats.medkhp = player.medkits_hp;
                stats.medkmx = player.medkits / 4 * this.magic[stats.cls];
                stats.kritz = player.ubertypes.kritzkrieg || 0;
                stats.medigun = player.ubertypes.medigun || 0;
                stats.vs_k = 0;
                stats.vs_d = 0;
                stats.vs_da = 0;
                stats.vs_ka = 0;
                if (!selfID) stats.team = 3; //didn't play
                else if (id === selfID) stats.team = 0;
                else if (player.team === myteam) stats.team = 1; //Friend
                else { //Foe
                    stats.team = 2;
                    if (data.classdeaths[id] && data.classdeaths[id][myclass]) stats.vs_d = data.classdeaths[id][myclass];
                    if (data.classkills[id] && data.classkills[id][myclass]) stats.vs_k = data.classkills[id][myclass];
                    if (data.classkillassists[id] && data.classkillassists[id][myclass]) stats.vs_ka = data.classkillassists[id][myclass] - stats.vs_kill;
                    var killz = (data.classkills[selfID][stats.cls]) ? data.classkills[selfID][stats.cls] : 0;
                    if (data.classkillassists[selfID] && data.classkillassists[selfID][stats.cls]) stats.vs_da = data.classkillassists[selfID][stats.cls] - killz;

                }
                this.data.push(stats);
            }
            log(this.data, "final stats");

        }
    }

    this.callback();
};
