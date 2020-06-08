/* offraid.js
 * contains responses for the offraid class
 * dependencies: NLog.EmuTarkov.SaveLoot.dll
 */

"use strict";

function registerPlayer(url, info, sessionID) {
    offraid_f.inraidServer.addPlayer(sessionID, info);
}

function saveProgress(url, info, sessionID) {
    offraid_f.saveProgress(info, sessionID);
    return response_f.nullResponse();
}

router.addStaticRoute("/raid/map/name", registerPlayer);
router.addStaticRoute("/raid/profile/save", saveProgress);