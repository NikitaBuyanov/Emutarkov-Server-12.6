"use strict";

function syncHealth(url, info, sessionID) {
    let pmcData = profile_f.profileServer.getPmcProfile(sessionID);
    health_f.healthServer.saveHealth(pmcData, info, sessionID);
    return response_f.nullResponse();
}

function updateHealth(url, info, sessionID) {
    health_f.healthServer.updateHealth(info, sessionID);
    return response_f.nullResponse();
}

function offraidEat(pmcData, body, sessionID) {
    return health_f.healthServer.offraidEat(pmcData, body, sessionID);
}

function offraidHeal(pmcData, body, sessionID) {
    return health_f.healthServer.offraidHeal(pmcData, body, sessionID);
}

router.addStaticRoute("/player/health/sync", syncHealth);
router.addStaticRoute("/player/health/events", updateHealth);
item_f.itemServer.addRoute("Eat", offraidEat);
item_f.itemServer.addRoute("Heal", offraidHeal);