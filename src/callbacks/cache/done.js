"use strict";

function done() {
    serverConfig.rebuildCache = false;
    json.write("user/configs/server.json", serverConfig);
}

server.addStartCallback("doneCaching", done);