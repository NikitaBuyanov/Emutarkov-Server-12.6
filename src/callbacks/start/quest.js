"use strict";

function load() {
    quest_f.initialize();
}

server.addStartCallback("loadQuests", load);