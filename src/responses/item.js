"use strict";

function handleRoutes(url, info, sessionID) {
    return response_f.getBody(item_f.itemServer.handleRoutes(info, sessionID));
}

router.addStaticRoute("/client/game/profile/items/moving", handleRoutes);
