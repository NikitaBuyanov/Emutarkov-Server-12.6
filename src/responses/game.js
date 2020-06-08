"use strict";

function getGameConfig(url, info, sessionID) {
    return response_f.getBody({"queued": false, "banTime": 0, "hash": "BAN0", "lang": "en", "aid": sessionID, "token": "token_" + sessionID, "taxonomy": "341", "activeProfileId": "user" + sessionID + "pmc", "nickname": "user", "backend": {"Trading": server.getBackendUrl(), "Messaging": server.getBackendUrl(), "Main": server.getBackendUrl(), "RagFair": server.getBackendUrl()}, "totalInGame": 0});
}

function selectProfile(url, info, sessionID) {
    return response_f.getBody({"status":"ok", "notifier": {"server": server.getBackendUrl() + "/", "channel_id": "testChannel"}});
}

function getProfileStatus(url, info, sessionID) {
    return response_f.getBody([{"profileid": "scav" + sessionID, "status": "Free", "sid": "", "ip": "", "port": 0}, {"profileid": "pmc" + sessionID, "status": "Free", "sid": "", "ip": "", "port": 0}]);
}

function getServer(url, info, sessionID) {
    return response_f.getBody([{"ip": server.getIp(), "port": server.getPort()}]);
}

function validateGameVersion(url, info, sessionID) {
    return response_f.getBody({"isvalid": true, "latestVersion": ""});
}

router.addStaticRoute("/client/game/profile/select", selectProfile);
router.addStaticRoute("/client/profile/status", getProfileStatus);
router.addStaticRoute("/client/server/list", getServer);
router.addStaticRoute("/client/game/version/validate", response_f.nullResponse);
router.addStaticRoute("/client/game/config", getGameConfig);
router.addStaticRoute("/client/game/start", response_f.nullResponse);
router.addStaticRoute("/client/game/logout", response_f.nullResponse);
router.addStaticRoute("/client/checkVersion", validateGameVersion)