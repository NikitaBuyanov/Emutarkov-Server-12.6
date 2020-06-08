"use strict";

function load() {
    customization_f.initialize();
}

server.addStartCallback("loadCustomization", load);