"use strict";

function getTraderList(url, info, sessionID) {
    return response_f.getBody(trader_f.traderServer.getAllTraders(sessionID));
}

function getCustomization(url, info, sessionID) {
    let splittedUrl = url.split('/');
    let traderID = splittedUrl[splittedUrl.length - 2];
    return response_f.getBody(trader_f.traderServer.getCustomization(traderID, sessionID));
}

function getProfilePurchases(url, info, sessionID) {
    return response_f.getBody(trader_f.traderServer.getPurchasesData(url.substr(url.lastIndexOf('/') + 1), sessionID));
}

function getTrader(url, info, sessionID) {
    return response_f.getBody(trader_f.traderServer.getTrader(url.replace("/client/trading/api/getTrader/", ""), sessionID));
}

function getAssort(url, info, sessionID) {
    return response_f.getBody(trader_f.traderServer.getAssort(sessionID, url.replace("/client/trading/api/getTraderAssort/", "")));
}

router.addStaticRoute("/client/trading/api/getTradersList", getTraderList);
router.addDynamicRoute("/client/trading/api/getUserAssortPrice/trader/", getProfilePurchases);
router.addDynamicRoute("/client/trading/api/getTrader/", getTrader);
router.addDynamicRoute("/client/trading/api/getTraderAssort/", getAssort);
router.addDynamicRoute("/client/trading/customization/", getCustomization);