function steamtf() {

    window.addEventListener("FromPage", function(evt) {
        var id = evt.detail;
        log(id);

        var link_etf2l = document.createElement("a");
        link_etf2l.target = "_blank";
        link_etf2l.innerHTML = '<img width="32" height="32" style="padding-left: 10px; padding-top: 5px;" alt="ETF2L" src=http://cdn.akamai.steamstatic.com/steamcommunity/public/images/avatars/d3/d3e5d7bb966b0867ce69448c9f4e1f782f672eb3_full.jpg>';
        link_etf2l.href = "http://etf2l.org/search/" + id;

        var link_ugc = document.createElement("a");
        link_ugc.target = "_blank";
        link_ugc.innerHTML = '<img width="32" height="32" style="padding-left: 10px; padding-top: 5px;" alt="UGC" src="http://cdn.akamai.steamstatic.com/steamcommunity/public/images/avatars/7e/7ea5bde6e1d5ed5add685c8ef224cf0b1fb1fc7e.jpg">';
        link_ugc.href = "http://www.ugcleague.com/players_page.cfm?player_id=" + id;

        var link_logs = document.createElement("a");
        link_logs.target = "_blank";
        link_logs.innerHTML = '<img width="32" height="32" style="padding-left: 10px; padding-top: 5px;" alt="Logs.tf" src="http://cdn.akamai.steamstatic.com/steamcommunity/public/images/avatars/7b/7bcc7b08e91659863bdbff2acf47ef5a25e9c3e9_full.jpg">';
        link_logs.href = "http://logs.tf/profile/" + id;

        var game_info = document.evaluate('//div[@class="game_info"]//a[@href="https://steamcommunity.com/app/440"]/../..', document, null, XPathResult.UNORDERED_NODE_SNAPSHOT_TYPE, null).snapshotItem(0);
        if (game_info !== null) {
            game_info.appendChild(link_etf2l);
            game_info.appendChild(link_ugc);
            game_info.appendChild(link_logs);

            var game_info_details = game_info.getElementsByClassName("game_info_details");

            TF.getRating(id, game_info_details[0], 0, null, 0);

        }

    }, false);

    var message = 'var id = g_rgProfileData.steamid; var event = new CustomEvent("FromPage", {detail: id} ); window.dispatchEvent(event);';

    addScript("tf2stars", message);

    addStyle(tf2stars_css);

}

if (/^http[s]*\:\/\/steamcommunity\.com\/profiles\/(\d+)\/*$/.exec(document.URL) !== null ||
    /^http[s]*\:\/\/steamcommunity\.com\/id\/([^\/]+)\/*$/.exec(document.URL) !== null ||
    /^http[s]*\:\/\/steamcommunity\.com\/profiles\/\[U\:1\:(\d+)\]\/*$/.exec(document.URL) !== null) {
    chrome.storage.sync.get({
        steam_show: false
    }, function(options) {
        if (options.steam_show) steamtf();
    });
}
