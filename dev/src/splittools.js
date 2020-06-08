"use strict";

const fs = require('fs');
const json = require('./json.js');

const inputDir = "input/";
const outputDir = "output/";

function genericSplitter(type, basepath, basefile) {
    let file = json.parse(json.read(basefile));

    for (let element in file.data) {
        let output = "";

        switch (type) {
            case "items":
            case "quests":
            case "traders":
            case "hideoutAreas":
            case "hideoutProd":
            case "hideoutScav":
                output = outputDir + basepath + "/" + file.data[element]._id + ".json";
                json.write(output, file.data[element]);
                break;

            case "languages":
                output = outputDir + basepath + "/" + file.data[element].ShortName + "/" + file.data[element].ShortName + ".json";
                json.write(output, file.data[element]);
                break;

            case "customOutfits":
                output = outputDir + basepath + "/" + element + ".json";
                json.write(output, file.data[element]);
                break;

            case "customOffers":
                output = outputDir + basepath + "/" + file.data[element].tid + "/customization/" + file.data[element].suiteId + ".json";
                json.write(output, file.data[element]);
                break;
        }

        console.log("done: " + output);
    }
}

function items() {
    genericSplitter("items", "items", inputDir + ".client.items.json");
}

function quests() {
    let file = json.parse(json.read(inputDir + ".client.quest.list.json"));

    for (let element in file.data) {
        let output = outputDir + "assort/" + file.data[element].traderId + "/quests/" + file.data[element]._id + ".json";

        json.write(output, file.data[element]);
        console.log("done: " + output);
    }
}

function traders() {
    let file = json.parse(json.read(inputDir + ".client.trading.api.getTradersList.json"));

    for (let element in file.data) {
        let output = outputDir + "assort/" + file.data[element]._id + "/" + "base.json";
        console.log("done: " + output);
    }
}

function locations() {
    let file = json.parse(json.read(inputDir + ".client.locations.json"));

    for (let element in file.data.locations) {
        let data = file.data.locations[element];
        let basedir = outputDir + "locations/" + data.Id.toLowerCase().replace(" ", "") + "/";
        let output = "";

        // waves
        for (let item in data.waves) {
            output = basedir + "waves/" + "wave_" + item + ".json";
            json.write(output, data.waves[item]);
        }

        data.waves = [];

        // exits
        for (let item in data.exits) {
            output = basedir + "exits/" + "exfill_" + item + ".json";
            json.write(output, data.exits[item]);
        }

        data.exits = [];

        // entry
        data.SpawnAreas = [];

        // spawns
        for (let item in data.BossLocationSpawn) {
            output = basedir + "bosses/" + "boss_" + item + ".json";
            json.write(output, data.BossLocationSpawn[item]);
        }

        data.BossLocationSpawn = [];

        // base
        output = basedir + "base" + ".json";
        json.write(output, data);
        
        console.log("done: " + file.data.locations[element].Id);
    }
}

function language() {
    genericSplitter("languages", "locales", inputDir + ".client.languages.json");
}

function customizationOutfits() {
    genericSplitter("customOutfits", "customization", inputDir + ".client.customization.json");
}

function customizationOffers() {
    genericSplitter("customOffers", "assort", inputDir + ".client.trading.customization.5ac3b934156ae10c4430e83c.offers.json");
}

function hideoutAreas() {
    genericSplitter("hideoutAreas", "hideout/areas", inputDir + ".client.hideout.areas.json");
}

function hideoutProduction() {
    genericSplitter("hideoutProd", "hideout/production", inputDir + ".client.hideout.production.recipes.json");
}

function hideoutScavcase() {
    genericSplitter("hideoutScav", "hideout/scavcase", inputDir + ".client.hideout.production.scavcase.recipes.json");
}

function templates() {
    let file = json.parse(json.read(inputDir + ".client.handbook.templates.json"));

    for (let element in file.data) {
        let key = file.data[element];

        for (let target in key) {
	        let output = key[target].Id;

            output = outputDir + "templates/" + element.toLowerCase() + "/" + output + ".json";
            json.write(output, key[target]);
            console.log("done: " + output);
        }
    }
}

function assortHelper(assortFile, shortName) {
    let file = json.parse(json.read(inputDir + assortFile));

    for (let element in file.data) {
        let key = file.data[element];

        for (let target in key) {
            let output = "";

            if (element === "items") {
                if ("upd" in key[target]) {
                    // trader has endless supply of item
                    key[target].upd = {UnlimitedCount: true, StackObjectsCount: 999999999};
                }

                output = outputDir + "assort/" + shortName + "/"  + "items" + "/" + key[target]._id + ".json";
            } else if (element === "barter_scheme") {
                output = outputDir + "assort/" + shortName + "/"  + "barter_scheme" + "/" + target + ".json";
            } else if (element === "loyal_level_items") {
                output = outputDir + "assort/" + shortName + "/"  + "loyal_level_items" + "/" + target + ".json";
            }

            json.write(output, key[target]);
            console.log("done: " + output);
        }
    }
}

function assort() {
    assortHelper(".client.trading.api.getTraderAssort.5a7c2eca46aef81a7ca2145d.json", "5a7c2eca46aef81a7ca2145d");
    assortHelper(".client.trading.api.getTraderAssort.5ac3b934156ae10c4430e83c.json", "5ac3b934156ae10c4430e83c");
    assortHelper(".client.trading.api.getTraderAssort.5c0647fdd443bc2504c2d371.json", "5c0647fdd443bc2504c2d371");
    assortHelper(".client.trading.api.getTraderAssort.54cb50c76803fa8b248b4571.json", "54cb50c76803fa8b248b4571");
    assortHelper(".client.trading.api.getTraderAssort.54cb57776803fa99248b456e.json", "54cb57776803fa99248b456e");
    assortHelper(".client.trading.api.getTraderAssort.5935c25fb3acc3127c3d8cd9.json", "5935c25fb3acc3127c3d8cd9");
    assortHelper(".client.trading.api.getTraderAssort.58330581ace78e27b8b10cee.json", "58330581ace78e27b8b10cee");
}

function localesHelper(language, shortName) {
    let file = json.parse(json.read(inputDir + language));

    for (let element in file.data) {
        if (element === "interface" || element === "error") {
            let output = outputDir + "locales/" + shortName + "/" + element +  ".json";

            json.write(output, file.data[element]);
            console.log("done: " + output);
            continue;
        }

        let key = file.data[element];

        for (let target in key) {
            let output = outputDir + "locales/" + shortName + "/"  + element + "/" + target + ".json";
            let file = key[target];

            if (element === "quest" && "successMessageText" in file) {
                file.startedMessageText = "";
            }

            json.write(output, file);
            console.log("done: " + output);
        }
    }
}

function locales() {
    localesHelper(".client.locale.en.json", "en");
    localesHelper(".client.locale.ru.json", "ru");
    localesHelper(".client.locale.ge.json", "ge");
    localesHelper(".client.locale.fr.json", "fr");
    localesHelper(".client.locale.po.json", "po");
    localesHelper(".client.locale.es.json", "es");
    localesHelper(".client.locale.es-mx.json", "es-mx");
    localesHelper(".client.locale.ch.json", "ch");
    localesHelper(".client.locale.it.json", "it");
    localesHelper(".client.locale.tu.json", "tu");
}

function globals() {
    let output = json.parse(json.read(inputDir + ".client.globals.json"));

    output.data.config.EventType = ["Christmas"];
    json.write(outputDir + "globals.json", output);
    console.log("done: globals");
}

function generateRagfairTrader() {
    let itemFiles = fs.readdirSync(outputDir + "items/");
    let templateFiles = fs.readdirSync(outputDir + "templates/items/");
    let globalFiles = (json.parse(json.read(inputDir + ".client.globals.json")).data.ItemPresets);

    /* single items */
    for (let file in itemFiles) {
        let filePath = outputDir + "items/" + itemFiles[file];
        let fileData = json.parse(json.read(filePath));
        let fileName = fileData._id;
        let price = 0;

        if (fileData._type !== "Item") {
            continue;
        }

        // get item price
        for (let itemFile in templateFiles) {
            let template = json.parse(json.read(outputDir + "templates/items/" + templateFiles[itemFile]));

            if (fileData._id === template.Id) {
                price = template.Price;
                break;
            }
        }

        // shrapnel and stash item and such (referring to the items with a question mark) always have the price 0 or 100
        // no other items in the game has this.
        if (price === 0 || price === 100) {
            continue;
        }

        // save everything
        json.write(outputDir + "assort/ragfair/items/" + fileName + ".json", {_id: fileData._id, _tpl: fileData._id, parentId: "hideout", slotId: "hideout", upd: {UnlimitedCount: true, StackObjectsCount: 999999999}});
        json.write(outputDir + "assort/ragfair/barter_scheme/" + fileName + ".json", [[{count: price, _tpl: "5449016a4bdc2d6f028b456f"}]]);
        json.write(outputDir + "assort/ragfair/loyal_level_items/" + fileName + ".json", 1);

        console.log("done: ragfair <- " + fileName);
    }

    /* presets */
    for (let file in globalFiles) {
        let presetId = globalFiles[file]._id;
        let price = 0;

        for (let item of globalFiles[file]._items) {
            if (item._id !== globalFiles[file]._parent) {
                /* attachment */
                if (item.parentId === globalFiles[file]._parent) {
                    item.parentId = presetId;
                }

                // get item price
                for (let templateFile in templateFiles) {
                    let template = json.parse(json.read(outputDir + "templates/items/" + templateFiles[templateFile]));

                    if (item._tpl === template.Id) {
                        price = template.Price;
                        break;
                    }
                }

                json.write(outputDir + "assort/ragfair/items/" + item._id + ".json", item);
                console.log("done: ragfair <- " + item._id);
            }
        }

        /* base item */
        for (let item of globalFiles[file]._items) {
            if (item._id === globalFiles[file]._parent) {
                json.write(outputDir + "assort/ragfair/items/" + presetId + ".json", {_id: presetId, _tpl: item._tpl, parentId: "hideout", slotId: "hideout", upd: {UnlimitedCount: true, StackObjectsCount: 999999999}});
                json.write(outputDir + "assort/ragfair/barter_scheme/" + presetId + ".json", [[{count: price, _tpl: "5449016a4bdc2d6f028b456f"}]]);
                json.write(outputDir + "assort/ragfair/loyal_level_items/" + presetId + ".json", 1);
                console.log("done: ragfair <- " + presetId);
                break;
            }
        }
    }
}

function splitAll() {
    console.log("Splitting files...");

    items();
    quests();
    traders();
    locations();
    language();
    customizationOutfits();
    customizationOffers();
    hideoutAreas();
    hideoutProduction();
    hideoutScavcase();
    templates();
    assort();
    locales();
    globals();
    generateRagfairTrader();

    console.log("Splitting done");
}

splitAll();