var TFPlayer = function(id) {
    "use strict";

    this.id64 = id;

    var now = Date.now();

    this.callbacks = [];

    this.updates = 0;

    this.updating = false;

    this.data = {
        cache: now,
        etf2l: null,
        ugc: null,
        steam: null,
    };

    this.cached = false;

    this.motd = "";

    this.sources = [{
        name: "etf2l_player",
        url: "http://api.etf2l.org/player/id64",
        type: "application/json",
        onload: "_etf2l_player",
    }, {
        name: "etf2l_results",
        url: "http://api.etf2l.org/player/id64/results?since=0",
        type: "application/json",
        onload: "_etf2l_results",
    }, {
        name: "steam_player",
        url: "http://api.steampowered.com/ISteamUser/GetPlayerSummaries/v0002/?key=steam_key&steamids=id64",
        type: "application/json",
        onload: "_steam_player",
    }, {
        name: "steam_bans",
        url: "http://api.steampowered.com/ISteamUser/GetPlayerBans/v1/?key=steam_key&steamids=id64",
        type: "application/json",
        onload: "_steam_bans",
    }, {
        name: "steam_stats",
        url: "http://api.steampowered.com/ISteamUserStats/GetUserStatsForGame/v0002/?appid=440&key=steam_key&steamid=id64",
        type: "application/json",
        onload: "_steam_stats",
    }, {
        name: "ugc_player",
        url: "http://www.ugcleague.com/api/api.php?key=ugc_key&current_player=id64",
        type: "application/json",
        onload: "_ugc_player",
    }];

    this.ugc_table = 40;

    this.etf2lfun = ["The Highlander Open", "Fun Cup", "Nations' Cup", ];

    this.etf2lformat = ["Highlander", "6on6", ];

    this.ugcformat = ["9v9", "6v6", ];

    this.etf2l_hl_div = ["HL&nbsp;Prem", "HL&nbsp;High", "HL&nbsp;High", "HL&nbsp;Mid", "HL&nbsp;Mid", "HL&nbsp;Open", "HL&nbsp;Open", "HL&nbsp;FunCup"];

    this.etf2l_six_div = ["6on6&nbsp;Prem", "6on6&nbsp;High", "6on6&nbsp;High", "6on6&nbsp;Mid", "6on6&nbsp;Mid", "6on6&nbsp;Open", "6on6&nbsp;Open", "6on6&nbsp;FunCup"];

    this.ugc_hl_div = ["HL&nbsp;Plat", "HL&nbsp;Plat", "HL&nbsp;Gold", "HL&nbsp;Gold", "HL&nbsp;Silver", "HL&nbsp;Silver", "HL&nbsp;Steel", "HL&nbsp;Iron"];

    this.ugc_six_div = ["6vs6&nbsp;Plat", "6vs6&nbsp;Plat", "6vs6&nbsp;Gold", "6vs6&nbsp;Gold", "6vs6&nbsp;Silver", "6vs6&nbsp;Silver", "6vs6&nbsp;Steel", "6vs6&nbsp;Iron"];

    this.numbers = ["", "❶", "❷", "❸", "❹", "❺", "❻", "❼", "❽", "❾"];

    this.etf2l_to_div = {
        "Prem": 0,
        "High": 2,
        "Mid": 4,
        "Open": 6,
    };

    this.etf2l_new = {
        0 : 0,
        1 : 2,
        2 : 4,
        3 : 6,
        4 : 4,
        6 : 6,
    };

}

TFPlayer.prototype.bestRating = function(obj, adj) {
    "use strict";
    if (obj !== undefined && obj !== null && !isEmpty(obj)) {
        var key = Object.keys(obj).sort(sortNumber).pop();
        return [parseFloat(key) + adj, obj[key]];
    }
    return [0, null];
};

TFPlayer.prototype.NR = function(rating) {
    "use strict";
    var MIN = 0;
    var MAX = 50;
    return Math.min(Math.max(~~(parseFloat(rating) / 5) * 5, MIN), MAX);
};

TFPlayer.prototype.getRating = function(format, player_class, lobby_map, lobby_map_alt) {
    "use strict";
    var bonus = 0;
    var rating = 0;
    var head = "";
    var body = "";
    var name = "";
    var other = "";
    var ban = 0;
    var bans;
    var class_played = 0;
    var map_played = 0;
    var main_class = false;
    var hl_rating = {};
    var six_rating = {};
    var best_hl;
    var best_six;
    var etf2l_hl;
    var etf2l_six;
    var class_bonus = TF.getCFG("class_bonus");
    var map_bonus = TF.getCFG("map_bonus");
    var format_penalty = TF.getCFG("format_penalty");
    var baseline_div = TF.getCFG("baseline_div");
    var increment_div = TF.getCFG("increment_div");
    if (format === 0) {
        increment_div = 6.67;
        //log("Profile rating");
    }

    // UGC
    if (!isEmpty(this.data.ugc) && TF.getCFG("ugc_update")) {
        var ugc_hl = this.data.ugc["Highlander"];
        var ugc_six = this.data.ugc["6vs6"];
        if (ugc_hl !== undefined) {
            body = ugc_hl.region + " " + this.ugc_hl_div[ugc_hl.div] + "<br>[&nbsp;" + ugc_hl.team + "&nbsp;]";
            rating = (baseline_div - ugc_hl.div) * increment_div;
            hl_rating[rating] = body;
        }
        if (ugc_six !== undefined) {
            body = ugc_six.region + " " + this.ugc_six_div[ugc_six.div] + "<br>[&nbsp;" + ugc_six.team + "&nbsp;]";
            rating = (baseline_div - ugc_six.div) * increment_div;
            six_rating[rating] = body;
        }
    }

    // ETF2L
    if (!isEmpty(this.data.etf2l) && TF.getCFG("etf2l_update")) {
        etf2l_hl = this.data.etf2l["Highlander"];
        etf2l_six = this.data.etf2l["6on6"];
        if (this.data.etf2l.country !== null) head = "<img src='http://etf2l.org/images/flags/" + this.data.etf2l.country + ".gif' style='float: right; outline: 1px solid #000000;'>";
        if (this.data.etf2l.name !== null) {
            name = "<p>" + this.data.etf2l.name;
            var years = unixtime_years_since(this.data.etf2l.registered);
            if (years == 1) name = name + " on ETF2L 1 year";
            else if (years > 1) name = name + " on ETF2L " + years + " years";
            else name = name + " on ETF2L less than a year";
            name = name + "</p>";
        }
        if (TF.getCFG("etf2l_update") && inArray(player_class, this.data.etf2l.classes)) main_class = true;
        bans = this.data.etf2l.bans;
        if (bans !== undefined) {
            var active = this.data.etf2l.ban;
            if (active !== undefined) {
                if (active.reason == "Blacklisted") head = head + "<p style='color: #" + TF.getCFG("color_warning") + "'>The account is Blacklisted and not eligible to play in ETF2L.";
                else if (active.reason == "VAC ban") head = head + "<p style='color: #" + TF.getCFG("color_warning") + "'>The account is VAC banned on ETF2L untill " + unixtime(active.end);
                else head = head + "<p style='color: #" + TF.getCFG("color_warning") + "'>The account is banned for " + active.reason + " on ETF2L untill&nbsp;" + unixtime(active.end);
                ban = 2;
            } else {
                head = head + "<p style='color: #" + TF.getCFG("color_warning") + "'>Expired bans on ETF2L " + bans;
                if (ban === 0) ban = 1;
            }
            head = head + "</p>";
        }
        if (etf2l_hl !== undefined) {

            if (etf2l_hl.div_max !== null) {
                body = "<p>" + this.etf2l_hl_div[etf2l_hl.div_max];
                if (etf2l_hl.div !== null) body += "</p><p>[&nbsp;" + etf2l_hl.team + "&nbsp;] " + this.etf2l_hl_div[etf2l_hl.div] + "</p>";
                else body += "</p><small>Not currently on Highlander roster or team has no games</small></p>";
                rating = (baseline_div - etf2l_hl.div_max) * increment_div;
                if (!isNaN(rating)) hl_rating[rating] = body;
                else log(this, "hl divmax NaN");
            }
            if (etf2l_hl.div !== null) {
                body = "<p>" + this.etf2l_hl_div[etf2l_hl.div] + "</p><p>[&nbsp;" + etf2l_hl.team + "&nbsp;]</p>";
                if (etf2l_hl.div_max !== null && etf2l_hl.div < etf2l_hl.div_max) {
                    rating = (baseline_div - etf2l_hl.div_max) * increment_div;
                    body += "<p><small>Recently played " + this.etf2l_hl_div[etf2l_hl.div_max] + "</small></p>";
                } else rating = (baseline_div - etf2l_hl.div) * increment_div;
                if (!isNaN(rating)) hl_rating[rating] = body;
                else log(this, "hl div NaN");
            }
        }
        if (etf2l_six !== undefined) {
            if (etf2l_six.div_max !== null) {
                body = "<p>" + this.etf2l_six_div[etf2l_six.div_max];
                if (etf2l_six.div !== null) body += "</p><p>[&nbsp;" + etf2l_six.team + "&nbsp;] " + this.etf2l_six_div[etf2l_six.div] + "</p>";
                else body += "<p><small>Not currently on 6on6 roster or team has no games</small></p>";
                rating = (baseline_div - etf2l_six.div_max) * increment_div;
                if (!isNaN(rating)) six_rating[rating] = body;
                else log(this, "six divmax NaN");
            }
            if (etf2l_six.div !== null) {
                body = "<p>" + this.etf2l_six_div[etf2l_six.div] + "</p><p>[&nbsp;" + etf2l_six.team + "&nbsp;]</p>";
                if (etf2l_six.div_max !== null && etf2l_six.div < etf2l_six.div_max) {
                    rating = (baseline_div - etf2l_six.div_max) * increment_div;
                    body += "<p><small>Recently played " + this.etf2l_six_div[etf2l_six.div_max] + "</small></p>";
                } else rating = (baseline_div - etf2l_six.div) * increment_div;
                if (!isNaN(rating)) six_rating[rating] = body;
                else log(this, "six div NaN");
            }
        }
    }

    // STEAM
    if (!isEmpty(this.data.steam) && TF.getCFG("steam_update")) {
        bans = this.data.steam.bans; //Steam Bans
        if (bans !== undefined) {
            if (bans.vac) {
                head = head + "<p style='color: #" + TF.getCFG("color_warning") + "'>Steam VAC ban(s)&nbsp;" + bans.vacbans + " on record. Day(s) since last ban&nbsp;" + bans.lastbandays.toLocaleString() + "</p>";
                ban = 2;
            }
            if (bans.community) {
                head = head + "<p style='color: #" + TF.getCFG("color_warning") + "'>Steam Community banned</p>";
                if (ban === 0) ban = 1;
            }
            if (bans.economy !== "none") {
                head = head + "<p style='color: #" + TF.getCFG("color_warning") + "'>Steam Trade " + bans.economy + "</p>";
                if (ban === 0) ban = 1;
            }
        }
        var stats = this.data.steam.tf2stats;
        if (stats !== undefined) {
            class_played = Math.round(stats[player_class] / 3600);
            if (class_played >= TF.getCFG("class_hours")) main_class = true;
            map_played = stats[lobby_map];
            if (map_played === undefined) map_played = stats[lobby_map_alt];
            if (map_played !== undefined) map_played = Math.round(map_played / 3600);
        }
    }

    //Class bonus
    if (main_class) {
        if (class_played > 0) {
            other = other + "<p>" + player_class + " main " + class_played.toLocaleString() + " hrs</p>";
            class_bonus = Math.min(Math.floor(class_played / TF.getCFG("class_hours")), TF.getCFG("class_stack")) * class_bonus;
        } else other = other + "<p>" + player_class + " main</p>";
        bonus = bonus + class_bonus;
    }

    //Map bonus
    if (map_played >= TF.getCFG("map_hours")) {
        other = other + "<p>Map played " + map_played.toLocaleString() + " hrs</p>";
        map_bonus = Math.min(Math.floor(map_played / TF.getCFG("map_hours")), TF.getCFG("map_stack")) * map_bonus;
        bonus = bonus + map_bonus;
    }

    switch (format) {
        //Profile
        case 0:
            bonus = 0;
            format_penalty = 0; //fallthrough
            //Highlander
        case 1:
            best_hl = this.bestRating(hl_rating, bonus);
            best_six = this.bestRating(six_rating, bonus + format_penalty);
            if (best_hl[0] > 0 && best_hl[0] >= best_six[0]) return [this.NR(best_hl[0]), this.motd + head + best_hl[1] + other + name, ban];
            else if (best_six[0] > 0 && best_six[0] > best_hl[0]) return [this.NR(best_six[0]), this.motd + head + best_six[1] + other + name, ban];
            else if (ban > 0 || bonus > 0) return [bonus, this.motd + head + other + name, ban];
			else if (self.motd !== "") return [0, this.motd, 0];
            return [0, null, 0];
            //6on6
        case 2:
            best_hl = this.bestRating(hl_rating, bonus + format_penalty);
            best_six = this.bestRating(six_rating, bonus);
            if (best_six[0] > 0 && best_six[0] >= best_hl[0]) return [this.NR(best_six[0]), this.motd + head + best_six[1] + other + name, ban];
            else if (best_hl[0] > 0 && best_hl[0] > best_six[0]) return [this.NR(best_hl[0]), this.motd + head + best_hl[1] + other + name, ban];
            else if (ban > 0 || bonus > 0) return [bonus, this.motd + head + other + name, ban];
			else if (self.motd !== "") return [0, this.motd, 0];
            return [0, null, 0];
    }
};

//Updates

TFPlayer.prototype.update = function(callback) {
    "use strict";

    var self = this;

    this.callbacks.push(callback);

    if (!this.updating) {

        this.updating = true;

        TF.MOTD.get(this.id64, function(motd) {

            if (self.motd === "") {
                if (typeof(motd) == "string") self.motd = motd;
                else self.motd = randArray(motd);
            }

        });

        chrome.storage.local.get(this.id64, function(cache) {

            if (!isEmpty(cache)) {
                var id = self.id64;
                var data = cache[id];
                if (dayssince(data.cache) < TF.getCFG("cache_days") &&
                    (data.etf2l !== null ||
                        data.steam !== null ||
                        data.ugc !== null)) {
                    self.data = data;
                    self.cached = true;
                    //log(self, "cache ok from " + dayssince(data.cache));
                    self.callback(self);
                } else {
                    //log(self, "cache expired from " + dayssince(data.cache));
                    self.fetch();
                }
            } else self.fetch();

        });
    } else self.callback(self);

};

TFPlayer.prototype.fetch = function(self) {
    "use strict";

    //log("fetching " + this.id64);

    var my_sources = [];

    for (var j = this.sources.length - 1; j >= 0; j--) {
        var opt = this.sources[j].name.split("_")[0];
        if (TF.getCFG(opt + "_update")) {
            my_sources.unshift(this.sources[j]);
        }
    }

    this.sources = my_sources;

    this.updates = this.sources.length;

    for (var i = 0; i < this.sources.length; i++) {
        this.sources[i].url = this.sources[i].url.replace("id64", this.id64);
        if (this.sources[i].next) this.sources[i].next.url = this.sources[i].next.url.replace("id64", this.id64);
        this.sources[i].url = this.sources[i].url.replace("steam_key", "E33E39DE9ED584992EEA7987334502C5");
        this.sources[i].url = this.sources[i].url.replace("ugc_key", "EFATSWDUSITPJPKYQVYDSQHLHLBRFOIX");
        XHR(this, this.sources[i]);
    }

};

TFPlayer.prototype.callback = function(self) {
    "use strict";

    if (self === undefined && this.updates > 0) this.updates -= 1;
    self = this;

    if (self.updates === 0) {

        if (!self.cached &&
            (self.data.etf2l !== null ||
                self.data.steam !== null ||
                self.data.ugc !== null)) {
            var data = {};
            var id = self.id64;
            data[id] = self.data;
            self.cached = true;

            //log("saving cache " + id);

            chrome.storage.local.set(data, function() {});
        }

        for (var j = self.callbacks.length - 1; j >= 0; j--) {
            if (isFunction(self.callbacks[j])) self.callbacks[j](self);
        }
        self.callbacks = [];
    }
};

TFPlayer.prototype._etf2l_player = function(resp) {
    "use strict";

    var player = this;
    var data = JSON.parse(resp.responseText);
    if (data !== null) {
        var etf2l = {
            classes: data.player.classes,
            country: data.player.country,
            name: data.player.name,
            registered: data.player.registered,
        };
        var key = atIndex(data.player.bans, -1);
        if (key !== null) {
            var ban = data.player.bans[key];
            var time = new Date(0);
            time.setSeconds(ban.end);
            if (etf2l.bans === undefined) etf2l.bans = "'" + ban.reason + "'";
            else etf2l.bans = etf2l.bans + "; '" + ban.reason + "'";
            if (Date.now() < time) etf2l.ban = ban;
        }

        //Init etf2lformat teams
        for (var i = 0; i < player.etf2lformat.length; i++)
            etf2l[player.etf2lformat[i]] = $.extend(etf2l[player.etf2lformat[i]], {
                team: null,
                tag: null,
                div: null,
                div_max: null
            });

        var teams = data.player.teams;
        if (teams !== null)
            for (var i = 0; i < teams.length; i++) {
                var lable = teams[i].type;
                var team = {
                    team: teams[i].name,
                    tag: teams[i].tag,
                    div: null,
                    div_max: null
                };

                var obj = teams[i].competitions;
                if (!isEmpty(obj)) {
                    for (var j = -1;
                        (key = atIndex(obj, j)) !== null; j--) {
                        if (!isEmpty(obj) && !inArray(obj[key].category, player.etf2lfun)) {
                            if (inArray(obj[key].division.name, Object.keys(player.etf2l_to_div))) {
                                team.div = parseInt(player.etf2l_to_div[obj[key].division.name]);
                                //log(team.div, "NEW fucken! tier "+obj[key].division.name);
                                break;
                            } else if (obj[key].division.tier !== null) {
                                team.div = parseInt(obj[key].division.tier);
                                break;
                            }
                        }
                        team.div = 7;
                    }
                }
                etf2l[lable] = $.extend(etf2l[lable], team);
            }
        player.data.etf2l = $.extend(player.data.etf2l, etf2l);
    }
    this.callback();
};

TFPlayer.prototype._etf2l_results = function(resp) {
    "use strict";

    var player = this;
    var data = JSON.parse(resp.responseText);
    if (!isEmpty(data) && !isEmpty(data.results)) {
        var results = data.results;
        if (typeof results[0] !== 'undefined')
            for (var i = 0; i < results.length; i++) {
                if (inArray(results[i].competition.type, player.etf2lformat) && inArray(results[i].division.name, Object.keys(player.etf2l_to_div))) {
                    var lable = results[i].competition.type;
                    var div = (inArray(results[i].competition.category, player.etf2lfun)) ? 7 : parseInt(player.etf2l_to_div[results[i].division.name]);
                    if (player.data.etf2l === null) player.data.etf2l = {};
                    if (player.data.etf2l[lable] === undefined) player.data.etf2l[lable] = {}; //no team, played divs
                    if (player.data.etf2l[lable].div_max === null || div < player.data.etf2l[lable].div_max) player.data.etf2l[lable].div_max = div;
                    //log(player.data.etf2l[lable].div_max, "NEW fucken! max tier "+results[i].division.name);
                } else if (inArray(results[i].competition.type, player.etf2lformat) && results[i].division.tier !== null) {
                    var lable = results[i].competition.type;
                    var div = (inArray(results[i].competition.category, player.etf2lfun)) ? 7 : player.etf2l_new[ parseInt(results[i].division.tier) ];
                    if (player.data.etf2l === null) player.data.etf2l = {};
                    if (player.data.etf2l[lable] === undefined) player.data.etf2l[lable] = {}; //no team, played divs
                    if (player.data.etf2l[lable].div_max === null || div < player.data.etf2l[lable].div_max) player.data.etf2l[lable].div_max = div;
                }
            }
    }
    this.callback();
};

TFPlayer.prototype._steam_player = function(resp) {
    "use strict";

    var player = this;
    var data = JSON.parse(resp.responseText);
    if (data !== null) {
        var steam = {
            name: data.response.players[0].personaname,
            avatar: data.response.players[0].avatar,
            avatarfull: data.response.players[0].avatarfull,
            timecreated: data.response.players[0].timecreated,
            country: data.response.players[0].loccountrycode,
        };

        if (data.response.players[0].communityvisibilitystate == 3) steam.status = "public";
        else steam.status = "private";
        player.data.steam = $.extend(player.data.steam, steam);
    }
    this.callback();

};

TFPlayer.prototype._steam_bans = function(resp) {
    "use strict";

    var player = this;

    var data = JSON.parse(resp.responseText);
    if (data !== null) {
        var bans = {
            community: data.players[0].CommunityBanned,
            lastbandays: data.players[0].DaysSinceLastBan,
            economy: data.players[0].EconomyBan,
            vacbans: data.players[0].NumberOfVACBans,
            vac: data.players[0].VACBanned,
        };
        if (!player.data.steam) player.data.steam = {};
        player.data.steam.bans = bans;
    }
    this.callback();
};

TFPlayer.prototype._steam_stats = function(resp) {
    "use strict";

    var player = this;
    var data = JSON.parse(resp.responseText);
    if (data !== null) {
        var stats = {};
        var name;
        var len = data.playerstats.stats.length;
        for (var i = 0; i < len; i++) {
            name = data.playerstats.stats[i].name;
            if (name.indexOf(".accum.iPlayTime") > 0 && name.indexOf(".mvm.") == -1) {
                name = name.replace(".accum.iPlayTime", "");
                stats[name] = parseInt(data.playerstats.stats[i].value);
            }
        }
        if (!player.data.steam) player.data.steam = {};
        player.data.steam.tf2stats = stats;
    }
    this.callback();
};

TFPlayer.prototype._ugc_player = function(resp) {
    "use strict";

    var player = this;
    if (!isEmpty(resp.responseText)) {
        var data = JSON.parse(resp.responseText);
        if (!isEmpty(data) && !isEmpty(data.team)) {
            player.data.ugc = {};
            for (var i = 0; i < data.team.length; i++) {
                var team = {};
                var tmp = data.team[i].division.split(" ");
                team.region = tmp[0];
                if (tmp[1] == "Platinum") {
                    if (tmp[0] == "NA") team.div = 0;
                    else team.div = 1;
                } else if (tmp[1] == "Gold") team.div = 2;
                else if (tmp[1] == "Silver") team.div = 4;
                else if (tmp[1] == "Steel") team.div = 6;
                else team.div = 7;
                team.team = data.team[i].name;
                if (data.team[i].format == "9v9") player.data.ugc["Highlander"] = team;
                else if (data.team[i].format == "6v6") player.data.ugc["6vs6"] = team;

            }
        }
    }
    //else log("UGC player " + player.id64 + " has no active teams");
    this.callback();
};
