"use strict";

function load() {
    preset_f.itemPresets.initialize();
}

server.addStartCallback("loadPresets", load);