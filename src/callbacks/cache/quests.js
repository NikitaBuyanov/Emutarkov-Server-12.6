"use strict";

function cache() {
    if (!serverConfig.rebuildCache) {
        return;
    }

    logger.logInfo("Caching: quests");

    let base = {"err": 0, "errmsg": null, "data": []};

    /* assort */
    for (let trader in db.assort) {
        if (!("quests" in db.assort[trader])) {
            continue;
        }

        let inputFiles = db.assort[trader].quests;

        for (let file in inputFiles) {
            let filePath = inputFiles[file];
            let fileData = json.parse(json.read(filePath));

            base.data.push(fileData);
        }
    }

    json.write("user/cache/quests.json", base);
}

server.addStartCallback("cacheQuests", cache);