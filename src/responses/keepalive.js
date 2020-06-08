"use strict";

function handleKeepAlive(url, info, sessionID) {
    keepAlive_f.main(sessionID);
    return response_f.getBody({"msg": "OK"});
}

router.addStaticRoute("/client/game/keepalive", handleKeepAlive);