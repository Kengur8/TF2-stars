function TFMotd() {
    "use strict";

    this.cache = Date.now();

    this.data = {};

    this.cached = false;

    this.callbacks = [];

    this.updates = 0;

    this.updating = false;

    this.source = {
        name: "motd",
        url: "http://raw.githubusercontent.com/Kengur8/TF2-center-stars/master/motd.json",
        type: "application/json",
        onload: "_motd",
    };
}

TFMotd.prototype.get = function(id, callback) {
    "use strict";

    var self = this;

    this.update(function() {
        if (self.data[id]) callback(self.data[id]);
        else callback("");
    });

};

TFMotd.prototype.update = function(callback) {
    "use strict";

    var self = this;

    this.callbacks.push(callback);

    if (!this.updating) {

        this.updating = true;

        chrome.storage.local.get("motd", function(cache) {

            if (!isEmpty(cache) && Object.keys(cache["motd"]) > 1 && dayssince(cache["motd"].cache) < 1) {
                self.data = cache["motd"];
                self.cached = true;
                //log("motd ok from " + dayssince(data.cache));
                callback(self);
            } else self.fetch();

        });

    } else this.callback(self);

};

TFMotd.prototype.fetch = function(self) {
    "use strict";

    this.updates = 1;

    XHR(this, this.source);

};

TFMotd.prototype.callback = function(self) {
    "use strict";

    if (self === undefined && this.updates > 0) this.updates -= 1;
    self = this;

    if (self.updates === 0) {

        if (!self.cached) {
            var newdata = {};
            newdata.motd = self.data;
            newdata.motd.cache = this.cache;
            self.cached = true;

            log(newdata, "saving cache motd");

            chrome.storage.local.set(newdata, function() {});
        }

        for (var j = self.callbacks.length - 1; j >= 0; j--) {
            if (isFunction(self.callbacks[j])) self.callbacks[j](self);
        }
        self.callbacks = [];
    }

};

TFMotd.prototype._motd = function(resp) {
    "use strict";

    var data = JSON.parse(resp.responseText);
    log(data, "got motd");
    this.data = data.response;
    this.callback();
};
