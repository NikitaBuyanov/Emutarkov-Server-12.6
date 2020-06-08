"use strict";

function genericCacher(cachename, filepathNode, output = "") {
    logger.logInfo("Caching: " + cachename);

    let base = json.parse(json.read("db/cache/" + cachename));
    let inputFiles = filepathNode;

    for (let file in inputFiles) {
        let filePath = inputFiles[file];
        let fileData = json.parse(json.read(filePath));
        let fileName = "";

        switch (cachename) {
            case "traders.json":
            case "hideout_areas.json":
            case "hideout_production.json":
            case "hideout_scavcase.json":
            case "weather.json":
                base.data.push(fileData);
            break;

            case "items.json":
                fileName = fileData._id;
                base.data[fileName] = fileData;
            break;

            case "customization.json":
                fileName = file;
                base.data[fileName] = fileData;
            break;
        }
    }

    json.write("user/cache/" + cachename, base);
}

function cache() {
    if (serverConfig.rebuildCache) {
        genericCacher("items.json", db.items);
        genericCacher("customization.json", db.customization);
        genericCacher("hideout_areas.json", db.hideout.areas);
        genericCacher("hideout_production.json", db.hideout.production);
        genericCacher("hideout_scavcase.json", db.hideout.scavcase);
        genericCacher("weather.json", db.weather);   
    }
}

server.addStartCallback("cacheGeneric", cache);