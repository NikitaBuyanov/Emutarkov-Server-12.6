"use strict";

const fs = require('fs');

function route() {
    if (!serverConfig.rebuildCache) {
        return;
    }
    
    db.user.profiles = {
        "character": "user/profiles/__REPLACEME__/character.json",
        "dialogue": "user/profiles/__REPLACEME__/dialogue.json",
        "storage": "user/profiles/__REPLACEME__/storage.json",
        "userbuilds": "user/profiles/__REPLACEME__/userbuilds.json"
    },
    
    db.user.cache = {
        "items": "user/cache/items.json",
        "quests": "user/cache/quests.json",
        "locations": "user/cache/locations.json",
        "languages": "user/cache/languages.json",
        "customization": "user/cache/customization.json",
        "hideout_areas": "user/cache/hideout_areas.json",
        "hideout_production": "user/cache/hideout_production.json",
        "hideout_scavcase": "user/cache/hideout_scavcase.json",
        "weather": "user/cache/weather.json",
        "templates": "user/cache/templates.json",
        "mods": "user/cache/mods.json",
        "ragfair_offers": "user/cache/ragfair_offers.json"
    };

    db.user.configs.accounts = "user/configs/accounts.json";
    db.user.configs.gameplay = "user/configs/gameplay.json";

    for (let trader in db.assort) {
        db.user.cache["assort_" + trader] = "user/cache/assort_" + trader + ".json";

        if ("customization" in db.assort[trader]) {
            db.user.cache["customization_" + trader] = "user/cache/customization_" + trader + ".json";
        }
    }

    for (let locale in db.locales) {
        db.user.cache["locale_" + locale] = "user/cache/locale_" + locale + ".json";
    }

    json.write("user/cache/db.json", db);
}

server.addStartCallback("routeMissing", route);