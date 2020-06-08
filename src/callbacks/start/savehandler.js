"use strict";

function load() {
    saveHandler.initialize();
}

server.addStartCallback("loadSavehandler", load);