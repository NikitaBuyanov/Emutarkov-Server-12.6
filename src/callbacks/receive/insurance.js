"use strict";

function checkInsurance(sessionID, req, resp, body, output) {
    if (req.url === "/client/notifier/channel/create") {
        insurance_f.insuranceServer.checkExpiredInsurance();
    }
}

server.addReceiveCallback("INSURANCE", checkInsurance);