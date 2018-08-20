function save_options() {

    etf2l_update = document.getElementById('etf2l_update').checked;
    ugc_update = document.getElementById('ugc_update').checked;
    steam_update = document.getElementById('steam_update').checked;

    tf2c_show = document.getElementById('tf2c_show').checked;
    logstf_show = document.getElementById('logstf_show').checked;
    steam_show = document.getElementById('steam_show').checked;

    sound_volume = document.getElementById('sound_volume').value;

    cache_days = document.getElementById('cache_days').value;

    chrome.storage.sync.set({

        etf2l_update: etf2l_update,
        ugc_update: ugc_update,
        steam_update: steam_update,

        tf2c_show: tf2c_show,
        logstf_show: logstf_show,
        steam_show: steam_show,

        sound_volume: sound_volume,

        cache_days: cache_days,

    }, function() {
        // Update status to let user know options were saved.
        var status = document.getElementById('status');
        status.textContent = 'Options saved.';
        setTimeout(function() {
            status.textContent = '';
        }, 750);
    });
}

function restore_options() {

    chrome.storage.sync.get({

        etf2l_update: true,
        ugc_update: true,
        steam_update: true,

        tf2c_show: true,
        logstf_show: true,
        steam_show: true,

        sound_volume: 100,

        cache_days: 14,

    }, function(options) {

        document.getElementById('etf2l_update').checked = options.etf2l_update;
        document.getElementById('ugc_update').checked = options.ugc_update;
        document.getElementById('steam_update').checked = options.steam_update;

        document.getElementById('tf2c_show').checked = options.tf2c_show;
        document.getElementById('logstf_show').checked = options.logstf_show;
        document.getElementById('steam_show').checked = options.steam_show;

        document.getElementById('sound_volume').value = options.sound_volume;

        document.getElementById('cache_days').value = options.cache_days;

    });
}

function clear_cache() {
    chrome.storage.local.clear(function() {
        var status = document.getElementById('status');
        status.textContent = 'Cache cleared.';
        setTimeout(function() {
            status.textContent = '';
        }, 750);
    });

}

chrome.storage.local.getBytesInUse(null, function(data) {
    var status = document.getElementById('status');
    status.textContent = sizeBytes(data) + " in use";

});

document.addEventListener('DOMContentLoaded', restore_options);
document.getElementById('save').addEventListener('click', save_options);
document.getElementById('clear').addEventListener('click', clear_cache);
