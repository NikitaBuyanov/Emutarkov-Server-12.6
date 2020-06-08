"use strict";

class Initializer {
    constructor() {
        this.initializeCore();
        this.initializeExceptions();
        this.initializeLoadOrder();
        this.initializeClasses();
    }

    /* load core functionality */
    initializeCore() {
        /* setup utilites */
        global.utility = require('./util/utility.js');
        global.logger = (require('./util/logger.js').logger);
        global.json = require('./util/json.js');

        /* setup core files */
        global.serverConfig = json.parse(json.read("user/configs/server.json"));
        global.modsConfig = json.parse(json.read("user/configs/mods.json"));
        global.db = {};
        global.res = {};

        /* setup routes and cache */
        const route = require('./server/route.js');
        route.all();

        /* core logic */
        global.router = (require('./server/router.js').router);
        global.events = require('./server/events.js');
        global.server = (require('./server/server.js').server);
        global.watermark = require('./server/watermark.js');
    }

    /* load exception handler */
    initializeExceptions() {
        process.on('uncaughtException', (error, promise) => {
            logger.logError("Server:" + server.getVersion());
            logger.logError("Trace:");
            logger.logData(error);
        });
    }

    /* load loadorder from cache */
    initializeLoadOrder() {
        this.loadorder = json.parse(json.read("user/cache/loadorder.json"));
    }

    /* load classes */
    initializeClasses() {
        logger.logWarning("Interpreter: loading classes...");

        for (let name in this.loadorder) {
            global[name] = require("../" + this.loadorder[name]);
        }

        logger.logSuccess("Interpreter: loaded classes");
    }
}

module.exports.initializer = new Initializer();