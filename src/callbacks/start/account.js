"use strict";

function load() {
    account_f.accountServer.initialize();
}

server.addStartCallback("loadAccounts", load);