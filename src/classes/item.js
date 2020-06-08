"use strict";

class ItemServer {
    constructor() {
        this.output = "";
        this.routes = {};

        this.resetOutput();
    }

    /* adds route to check for */
    addRoute(route, callback) {
        this.routes[route] = callback;
    }

    handleRoutes(info, sessionID) {
        let result = "";
        
        for (let body of info.data) {
            let pmcData = profile_f.profileServer.getPmcProfile(sessionID);

            if (body.Action in this.routes) {
                result = this.routes[body.Action](pmcData, body, sessionID);
            } else {
                logger.logError("[UNHANDLED ACTION] " + body.Action);
            }
        }

        this.resetOutput();
        return result;
    }

    getOutput() {
        if (this.output === "") {
            this.resetOutput();
        }

        return this.output;
    }

    setOutput(data) {
        this.output = data;
    }

    resetOutput() {
        this.output = {"items": {"new": [], "change": [], "del": []}, "badRequest": [], "quests": [], "ragFairOffers": [], "builds": [], "currentSalesSums": {}};
    }
}

module.exports.itemServer = new ItemServer();