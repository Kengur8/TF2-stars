function center_lobby(sound_volume) {

    var confirm_exit = "window.onbeforeunload = confirmExit; function confirmExit() { return 'You joined this lobby. (Reload the page to fix the connection!)'; }";

    var unconfirm_exit = "window.onbeforeunload = confirmExit; function confirmExit() { }";

    var sounds_on = [
        "var playPrematureLobbyEnding = function(){var s = new Audio('/assets/sounds/heavy_premature_ending.wav'); s.volume = ",
        sound_volume,
        "; s.play()}; var playReadySoundHeavy = function(){var s = new Audio('/assets/sounds/ready_heavy.wav'); s.volume = ",
        sound_volume,
        "; s.play()}; var playLaunchSoundAnnouncer = function(){var s = new Audio('/assets/sounds/announcer_am_gamestarting.mp3'); s.volume = ",
        sound_volume,
        "; s.play()}"
    ].join("");

    var sounds_off = "var playPrematureLobbyEnding = function(){};var playReadySoundHeavy = function(){};";

    addScript("custom_sounds", sounds_off);

    lobby_map = document.evaluate("//*[@id='mainHeader']/div[2]/div/div[7]/div/div[2]/div[2]/table/tbody/tr[1]/td[2]/p/a", document, null, XPathResult.FIRST_ORDERED_NODE_TYPE, null).singleNodeValue.innerHTML;

    my_id = document.evaluate("//*[@id='nav-bar']/div/div/div[2]/ul/li[1]/a", document, null, XPathResult.FIRST_ORDERED_NODE_TYPE, null).singleNodeValue;
    if (my_id !== null) my_id = /^http[s]*\:\/\/tf2center\.com\/profile\/(\d+)$/.exec(my_id.href);
    if (my_id !== null) my_id = my_id[1];

    var lobby_map_alt = lobby_map.split("_");
    if (lobby_map_alt.length > 1) lobby_map_alt = lobby_map_alt[0] + "_" + lobby_map_alt[1];

    var HLcls = [
        "Scout",
        "Soldier",
        "Pyro",
        "Demoman",
        "Heavy",
        "Engineer",
        "Medic",
        "Sniper",
        "Spy",
        "Scout",
        "Soldier",
        "Pyro",
        "Demoman",
        "Heavy",
        "Engineer",
        "Medic",
        "Sniper",
        "Spy",
    ];

    var SIXcls = [
        "Scout",
        "Scout",
        "Soldier",
        "Soldier",
        "Demoman",
        "Medic",
        "Scout",
        "Scout",
        "Soldier",
        "Soldier",
        "Demoman",
        "Medic",
    ];

    function updateSlots(my_lobby, all_ingame, all_readyup) {
        var mylobby = false;
        var ingame = 0;
        //var all_ingame = false;
        var readyup = 0;
        //var all_readyup = false;
        var status;
        var time = Date.now();
        var msg;
        var admchat = document.evaluate('//span[@class="message admin"]/..',
            document, null, XPathResult.UNORDERED_NODE_SNAPSHOT_TYPE, null);
        //for (var i = 0; (msg = admchat.snapshotItem(i)) !== null; i++) {
        //check_lobby_events(msg, initial);
        //}
        var gamestatus = document.evaluate('//div[contains(@class, "gameStatus ")]',
            document, null, XPathResult.UNORDERED_NODE_SNAPSHOT_TYPE, null);
        for (var i = 0;
            (status = gamestatus.snapshotItem(i)) !== null; i++) {
            readyup += 1;
            if (status.innerText == "In-Game") ingame += 1;
        }
        var slots = document.evaluate('//div[contains(@class, "lobbySlot")]',
            document, null, XPathResult.UNORDERED_NODE_SNAPSHOT_TYPE, null);
        for (var i = 0;
            (slot = slots.snapshotItem(i)) !== null; i++) {
            var filled = slot.classList.contains("filled");
            if (filled) {
                var profile = slot.getElementsByTagName('a').item(0).href;
                var rating = slot.getElementsByClassName('rating')[0];
                var id = /^http[s]*\:\/\/tf2center\.com\/profile\/(\d+)$/.exec(profile);
                if (id !== null) id = id[1];
                else {
                    log(slot, "no id64 matched for slot");
                    continue;
                }
                if (id == my_id) mylobby = true;

                //log("update slot");
                var stats = slot.getElementsByClassName('statsContainer')[0];

                switch (slots.snapshotLength) {
                    case 18: //Highlander
                        if (!rating) {
                            if (i < 9) TF.getRating(id, stats, 1, HLcls[i], 0, lobby_map, lobby_map_alt); //Blue
                            else TF.getRating(id, stats, 1, HLcls[i], 1, lobby_map, lobby_map_alt);
                        }

                        if (ingame == 18 && !all_ingame) {
                            all_ingame = true;
                            log("All in");
                        }

                        if (readyup == 18 && !all_readyup) {
                            log("All ready");
                            all_readyup = true;
                        }
                        break;
                    case 12: //6on6

                        if (!rating) {
                            if (i < 6) TF.getRating(id, stats, 2, SIXcls[i], 0, lobby_map, lobby_map_alt); //Blue
                            else TF.getRating(id, stats, 2, SIXcls[i], 1, lobby_map, lobby_map_alt);
                        }

                        if (ingame == 12 && !all_ingame) {
                            all_ingame = true;
                            log("All in");

                        }

                        if (readyup == 12 && !all_readyup) {
                            log("All ready");
                            all_readyup = true;
                        }
                        break;
                }
            }
        }
        if (my_lobby !== mylobby) {
            if (mylobby) {
                log("I joined");
                addScript("confirm_exit", confirm_exit);
                addScript("custom_sounds", sounds_on);
            } else {
                log("I left");
                removeElement("confirm_exit");
                addScript("confirm_exit", unconfirm_exit);
                addScript("custom_sounds", sounds_off);
            }
        }

        if (mylobby && all_ingame) {
            addScript("confirm_exit", unconfirm_exit);
            var s = new Audio("/assets/sounds/gong.mp3");
            s.volume = sound_volume;
            s.play();
            log("Exit");
            return;
        }

        setTimeout(function() {
            updateSlots(mylobby, all_ingame, all_readyup);
        }, TF.getCFG("refresh"));
    }

    addStyle(tf2stars_css);

    updateSlots(false);

}

if (/^http[s]*\:\/\/tf2center\.com\/lobbies\/(\d+)\/*$/.exec(document.URL) !== null) {
    chrome.storage.sync.get({
        tf2c_show: false,
        sound_volume: 100
    }, function(options) {
        if (options.tf2c_show) center_lobby(options.sound_volume / 100);
    });
}
