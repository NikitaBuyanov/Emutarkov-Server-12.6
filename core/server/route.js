"use strict";

const fs = require('fs');

function getModFilepath(mod) {
    return "user/mods/" + mod.author + "-" + mod.name + "-" + mod.version + "/";
}

function scanRecursiveMod(filepath, baseNode, modNode) {
    if (typeof modNode === "string") {
        baseNode = filepath + modNode;
    }

    if (typeof modNode === "object") {
        for (let node in modNode) {
            if (!(node in baseNode)) {
                baseNode[node] = {};
            }

            baseNode[node] = scanRecursiveMod(filepath, baseNode[node], modNode[node]);
        }
    }

    return baseNode;
}

function loadMod(mod, filepath) {
    logger.logInfo("Loading mod " + mod.author + "-" + mod.name + "-" + mod.version);

    let src = json.parse(json.read("user/cache/loadorder.json"));

    if ("db" in mod) {
        db = scanRecursiveMod(filepath, db, mod.db);
    }

    if ("res" in mod) {
        res = scanRecursiveMod(filepath, res, mod.res);
    }

    if ("src" in mod) {
        src = scanRecursiveMod(filepath, src, mod.src);
        json.write("user/cache/loadorder.json", src);
    }
}

function detectChangedMods() {
    let changed = false;

    for (let mod of modsConfig) {
        if (!fs.existsSync(getModFilepath(mod) + "mod.config.json")) {
            changed = true;
            break;
        }

        let config = json.parse(json.read(getModFilepath(mod) + "mod.config.json"));

        if (mod.name !== config.name || mod.author !== config.author || mod.version !== config.version) {
            changed = true;
            break;
        }
    }

    if (changed) {
        modsConfig = [];
    }

    return changed;
}

function detectMissingMods() {
    if (!fs.existsSync("user/mods/")) {
        return;
    }

    let dir = "user/mods/";
    let mods = utility.getDirList(dir);

    for (let mod of mods) {
        /* check if config exists */
        if (!fs.existsSync(dir + mod + "/mod.config.json")) {
            logger.logError("Mod " + mod + " is missing mod.config.json");
            logger.logError("Forcing server shutdown...");
            process.exit(1);
        }

        let config = json.parse(json.read(dir + mod + "/mod.config.json"));
        let found = false;

        /* check if mod is already in the list */
        for (let installed of modsConfig) {
            if (installed.name === config.name) {
                logger.logInfo("Mod " + mod + " is installed");
                found = true;
                break;
            }
        }

        /* add mod to the list */
        if (!found) {
            if (!config.version || config.files || config.filepaths) {
                logger.logError(`Mod ${mod} is out of date and not compatible with this version of EmuTarkov`);
                logger.logError("Forcing server shutdown...");
                process.exit(1);
            }
            logger.logWarning("Mod " + mod + " not installed, adding it to the modlist");
            modsConfig.push({"name": config.name, "author": config.author, "version": config.version, "enabled": true});
            serverConfig.rebuildCache = true;
            json.write("user/configs/mods.json", modsConfig);
        }
    }
}

function isRebuildRequired() {
    if (!fs.existsSync("user/cache/mods.json")
    || !fs.existsSync("user/cache/db.json")
    || !fs.existsSync("user/cache/res.json")
    || !fs.existsSync("user/cache/loadorder.json")) {
        return true;
    }

    let cachedlist = json.parse(json.read("user/cache/mods.json"));

    if (modsConfig.length !== cachedlist.length) {
        return true;
    }

    for (let mod in modsConfig) {
        /* check against cached list */
        if (modsConfig[mod].name !== cachedlist[mod].name
        || modsConfig[mod].author !== cachedlist[mod].author
        || modsConfig[mod].version !== cachedlist[mod].version
        || modsConfig[mod].enabled !== cachedlist[mod].enabled) {
            return true;
        }
    }

    return false;
}

function loadAllMods() {
    for (let element of modsConfig) {
        if (!element.enabled) {
            logger.logWarning("Skipping mod " + element.author + "-" + element.name + "-" + element.version);
            continue;
        }

        let filepath = getModFilepath(element);
        let mod = json.parse(json.read(filepath + "mod.config.json"));
        loadMod(mod, filepath);
    }
}

function flush() {
    db = {};
    res = {};
}

function dump() {
    json.write("user/cache/db.json", db);
    json.write("user/cache/res.json", res);
}

function scanRecursiveRoute(filepath) {
    let baseNode = {};
    let directories = utility.getDirList(filepath);
    let files = fs.readdirSync(filepath);

    // remove all directories from files
    for (let directory of directories) {
        for (let file in files) {
            if (files[file] === directory) {
                files.splice(file, 1);
            }
        }
    }

    // make sure to remove the file extention
    for (let node in files) {
        let fileName = files[node].split('.').slice(0, -1).join('.');
        baseNode[fileName] = filepath + files[node];
    }

    // deep tree search
    for (let node of directories) {
        baseNode[node] = scanRecursiveRoute(filepath + node + "/");
    }

    return baseNode;
}

function routeAll() {
    db = scanRecursiveRoute("db/");
    res = scanRecursiveRoute("res/");
    json.write("user/cache/loadorder.json", json.parse(json.read("src/loadorder.json")));

    /* add important server paths */
    db.user = {
        "configs": {
            "server": "user/config/server.json"
        },
        "events": {
            "schedule": "user/events/schedule.json"
        }   
    }
}

function all() {
    detectMissingMods();

    /* check if loadorder is missing */
    if (!fs.existsSync("user/cache/loadorder.json")) {
        logger.logWarning("Loadorder mismatch");
        serverConfig.rebuildCache = true;
    }

    /* detect if existing mods changed */
    if (detectChangedMods()) {
        logger.logWarning("Modlist mismatch");
        serverConfig.rebuildCache = true;
    }

    /* check if db need rebuid */
    if (isRebuildRequired()) {
        logger.logWarning("Rebuild required");
        serverConfig.rebuildCache = true;
    }

    /* rebuild db */
    if (serverConfig.rebuildCache) {
        logger.logWarning("Rebuilding routes");
        
        flush();
        routeAll();
        detectMissingMods();
        loadAllMods();
        dump();

        return;
    }

    db = json.parse(json.read("user/cache/db.json"));
    res = json.parse(json.read("user/cache/res.json"));
}

module.exports.all = all;