"use strict";

function getCustomization(url, info, sessionID) {
    return response_f.getBody(customization_f.getCustomization());
}

function getCustomizationStorage(url, info, sessionID) {
    return json.read(customization_f.getPath(sessionID));
}

router.addStaticRoute("/client/customization", getCustomization);
router.addStaticRoute("/client/trading/customization/storage", getCustomizationStorage);
item_f.itemServer.addRoute("CustomizationWear", customization_f.wearClothing);
item_f.itemServer.addRoute("CustomizationBuy", customization_f.buyClothing);