"use strict";

class MatchServer {
    constructor() {
        /* this.servers = {}; */
        this.locations = {};
    }

/*
    addServer(info) {
        for (let server in this.servers) {
            if (this.servers[server].id === info.id) {
                return "OK";
            }
        }

        this.servers[info.id] = {"ip": info.ip, "port": info.port, "location": info.location};
        return "FAILED";
    }

    removeServer(info) {
        delete this.servers[info.id];
        return "OK";
    }
*/

    getEnabled() {
        return gameplayConfig.match.enabled;
    }

    getProfile(info) {
        if (info.profileId.includes("pmcAID")) {
            return profile_f.profileServer.getCompleteProfile(info.profileId.replace("pmcAID", "AID"));
        }

        if (info.profileId.includes("scavAID")) {
            return profile_f.profileServer.getCompleteProfile(info.profileId.replace("scavAID", "AID"));
        }

        return null;
    }

    getMatch(location) {
        return {"id": "TEST", "ip": "127.0.0.1", "port": 9909};
    }

    joinMatch(info, sessionID) {
        let match = this.getMatch(info.location);
        let output = [];
        
        // --- LOOP (DO THIS FOR EVERY PLAYER IN GROUP)
        // get player profile
        let account = account_f.accountServer.find(sessionID);
        let profileID = "";
        
        if (info.savage === true) {
            profileID = "scav" + account.id;
        } else {
            profileID = "pmc" + account.id;
        }

        // get list of players joining into the match
        output.push({"profileid": profileID, "status": "busy", "sid": "", "ip": match.ip, "port": match.port, "version": "live", "location": info.location, "gamemode": "deathmatch", "shortid": match.id});
        // ---

        return output;
    }

    getGroupStatus(info) {
        return {"players": [], "invite": [], "group": []};
    }

    createGroup(sessionID, info) {
        let groupID = "test";

        this.locations[info.location].groups[groupID] = {"_id": groupID, "owner": "pmc" + sessionID, "location": info.location, "gameVersion": "live", "region": "EUR", "status": "wait", "isSavage": false, "timeShift": "CURR", "dt": utility.getTimestamp(), "players": [{"_id": "pmc" + sessionID, "region": "EUR", "ip": "127.0.0.1", "savageId": "scav" + sessionID, "accessKeyId": ""}], "customDataCenter": []};
        return this.locations[info.location].groups[groupID];
    }

    deleteGroup(info) {
        for (let locationID in this.locations) {
            for (let groupID in this.locations[locationID].groups) {
                if (groupID === info.groupId) {
                    delete this.locations[locationID].groups[groupID];
                    return;
                }
            }
        }
    }
}

module.exports.matchServer = new MatchServer();
