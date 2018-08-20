// When the extension is installed or upgraded ...
chrome.runtime.onInstalled.addListener(function() {

    // Replace all rules ...
    chrome.declarativeContent.onPageChanged.removeRules(undefined, function() {
        // With a new rule ...
        chrome.declarativeContent.onPageChanged.addRules([{
            // That fires when a page's URL contains
            conditions: [
                new chrome.declarativeContent.PageStateMatcher({
                    pageUrl: {
                        hostEquals: "logs.tf"
                    },
                })
            ],
            // And shows the extension's page action.
            actions: [new chrome.declarativeContent.ShowPageAction()]
        }]);

        chrome.declarativeContent.onPageChanged.addRules([{
            // That fires when a page's URL contains
            conditions: [
                new chrome.declarativeContent.PageStateMatcher({
                    pageUrl: {
                        hostEquals: "tf2center.com"
                    },
                })
            ],
            // And shows the extension's page action.
            actions: [new chrome.declarativeContent.ShowPageAction()]
        }]);

    });
});

//Show icon in URL
chrome.pageAction.onClicked.addListener(function(tab) {
    chrome.runtime.openOptionsPage();

});

//Get player from context script
chrome.runtime.onMessage.addListener(function(request, sender, sendResponse) {
    //log(sender.tab ? "Msg from " + sender.url: "Msg from extension");
    if (request.type === "player") {

        var player = TF.getPlayer(request.id, function(player) {

            var rating = player.getRating(request.format, request.plclass, request.lobby_map, request.lobby_map_alt);

            sendResponse({
                rating: rating
            });

        });

        return true; //async response
    }

});

// chrome.storage.onChanged.addListener(function(changes, namespace) {
//         for (var key in changes) {
//           var storageChange = changes[key];
//           console.log(''Old value was "%s", new value is "%s".', storageChange.oldValue, storageChange.newValue);
//         }
//       });

TF.init();
