"use strict";

function load() {
    staticdata_f.initialize();
}

server.addStartCallback("loadStaticdata", load);