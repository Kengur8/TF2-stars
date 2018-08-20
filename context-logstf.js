function logstf() {
    var lobby_map, lobby_map_alt;

    lobby_map = document.evaluate('//*[@id="log-map"]', document,
        null, XPathResult.FIRST_ORDERED_NODE_TYPE, null).singleNodeValue.innerText;
    lobby_map_alt = lobby_map.split('_');
    if (name.length > 1) lobby_map_alt = lobby_map_alt[0] + "_" + lobby_map_alt[1];

    function updateSlots() {
        var plclass = "None";
        var slots = document.evaluate('//div[@class="dropdown"]', document,
            null, XPathResult.UNORDERED_NODE_SNAPSHOT_TYPE, null);
        for (var i = 0;
            (slot = slots.snapshotItem(i)) !== null; i++) {
            info = slot.parentNode.parentNode.getElementsByTagName('i');
            if (info !== null) plclass = info[0].getAttribute("data-title");
            if (plclass !== null) plclass = plclass.replace("Heavyweapons", "Heavy");
            var profile = slot.getElementsByTagName('a').item(3).href;
            var id = /^http[s]*\:\/\/steamcommunity\.com\/profiles\/(\d+)$/.exec(profile);
            if (id !== null) id = id[1];
            else {
                log(profile, "no id64 matched for profile");
                continue;

            }
            if (slots.snapshotLength > 15) TF.getRating(id, slot, 1, plclass, 0, lobby_map, lobby_map_alt); //Highlander
            else TF.getRating(id, slot, 2, plclass, 0, lobby_map, lobby_map_alt); //6on6
            //if (slots.snapshotLength > 15) rating = player.getRating(1, plclass); //Highlander
            //else rating = player.getRating(2, plclass); //6on6
            //if (rating !== null) updateRating(slot, rating);

        }

    }

    addStyle(tf2stars_css);
    TF.load_conf();

    updateSlots();
}



if (/^http[s]*\:\/\/logs\.tf\/(\d+)\/*/.exec(document.URL) !== null) {
    chrome.storage.sync.get({
        logstf_show: false
    }, function(options) {
        if (options.logstf_show) logstf();
    });
}
