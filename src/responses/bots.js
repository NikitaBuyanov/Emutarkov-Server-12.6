"use strict";

function getBots(url, info, sessionID) {
    return response_f.getBody(bots_f.generate(info, sessionID));
}

function getBotLimit(url, info, sessionID) {
    let splittedUrl = url.split('/');
    let type = splittedUrl[splittedUrl.length - 1];

    if (type === "cursedAssault")
    {
        type = "assault";
    }

    return response_f.noBody(gameplayConfig.bots.limits[type]);
}

function getBotDifficulty(url, info, sessionID) {
    let splittedUrl = url.split('/');
    let type = splittedUrl[splittedUrl.length - 2].toLowerCase();
    let difficulty = splittedUrl[splittedUrl.length - 1];

    if (type === "core") {
        return json.read(db.bots.core);
    }

    if (type === "cursedassault")
    {
        type = "assault";
    }

    return json.read(db.bots[type].difficulties[difficulty]);
}

router.addStaticRoute("/client/game/bot/generate", getBots);
router.addDynamicRoute("/client/game/bot/limit/", getBotLimit);
router.addDynamicRoute("/client/game/bot/difficulty/", getBotDifficulty);
