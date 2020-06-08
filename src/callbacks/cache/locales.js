"use strict";

function cache() {
    if (!serverConfig.rebuildCache) {
        return;
    }
    
    for (let locale in db.locales) {
        let base = json.parse(json.read("db/cache/locale.json"));
        let inputNode = db.locales[locale];
        let inputDir = [
            "mail",
            "quest",
            "preset",
            "handbook",
            "season",
            "templates",
            "locations",
            "banners",
            "trading",
        ];

        logger.logInfo("Caching: locale_" + locale + ".json");

        base.data.interface = json.parse(json.read(inputNode.interface));
        base.data.error = json.parse(json.read(inputNode.error));

        for (let path in inputDir) {
            let inputFiles = inputNode[inputDir[path]];
            let inputNames = Object.keys(inputFiles);
            let i = 0;

            for (let file in inputFiles) {
                let filePath = inputFiles[file];
                let fileData = json.parse(json.read(filePath));
                let fileName = inputNames[i++];

                if (path == 0) {
                    base.data.mail[fileName] = fileData;
                } else if (path == 1) {
                    base.data.quest[fileName] = fileData;
                } else if (path == 2) {
                    base.data.preset[fileName] = fileData;
                } else if (path == 3) {
                    base.data.handbook[fileName] = fileData;
                } else if (path == 4) {
                    base.data.season[fileName] = fileData;
                } else if (path == 5) {
                    base.data.templates[fileName] = fileData;
                } else if (path == 6) {
                    base.data.locations[fileName] = fileData;
                } else if (path == 7) {
                    base.data.banners[fileName] = fileData;
                } else if (path == 8) {
                    base.data.trading[fileName] = fileData;
                }
            }
        }

        json.write("user/cache/locale_" + locale + ".json", base);
    }
}

server.addStartCallback("cacheLocales", cache);