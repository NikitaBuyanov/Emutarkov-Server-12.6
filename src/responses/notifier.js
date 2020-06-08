"use strict";

function createNotifierChannel(url, info, sessionID) {
    return response_f.getBody({"notifier": {"server": server.getBackendUrl() + "/", "channel_id": "testChannel", "url": server.getBackendUrl() + "/notifierServer/get/" + sessionID, "notifierServer": server.getBackendUrl() + "/notifierServer/get/" + sessionID}});
}

function notify(url, info, sessionID) {
    return "NOTIFY";
}

router.addStaticRoute("/client/notifier/channel/create", createNotifierChannel);
router.addDynamicRoute("/?last_id", notify);
router.addDynamicRoute("/notifierServer", notify);
router.addDynamicRoute("/notifierBase", response_f.emptyArrayResponse);
router.addDynamicRoute("/push/notifier/get/", response_f.emptyArrayResponse);