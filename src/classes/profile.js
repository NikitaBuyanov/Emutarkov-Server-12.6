"use strict";

/*
* ProfileServer class maintains list of active profiles for each sessionID in memory. All first-time loads and save
* operations also write to disk.*
*/
class ProfileServer {
    constructor() {
        this.profiles = {};
    }

    initializeProfile(sessionID) {
        this.profiles[sessionID] = {};
        this.loadProfilesFromDisk(sessionID);
    }

    loadProfilesFromDisk(sessionID) {
        this.profiles[sessionID]['pmc'] = json.parse(json.read(getPmcPath(sessionID)));
        this.generateScav(sessionID);
    }

    getOpenSessions() {
        return Object.keys(this.profiles);
    }

    saveToDisk(sessionID) {
        if ("pmc" in this.profiles[sessionID]) {
            json.write(getPmcPath(sessionID), this.profiles[sessionID]['pmc']);
        }
    }

    /* 
    * Get profile with sessionID of type (profile type in string, i.e. 'pmc').
    * If we don't have a profile for this sessionID yet, then load it and other related data
    * from disk.
    */
    getProfile(sessionID, type) {
        if (!(sessionID in this.profiles)) {
            this.initializeProfile(sessionID);
            dialogue_f.dialogueServer.initializeDialogue(sessionID);
            health_f.healthServer.initializeHealth(sessionID);
            insurance_f.insuranceServer.resetSession(sessionID);
        }

        return this.profiles[sessionID][type];
    }

    getPmcProfile(sessionID) {
        return this.getProfile(sessionID, 'pmc');
    }

    getScavProfile(sessionID) {
        return this.getProfile(sessionID, 'scav');
    }

    setScavProfile(sessionID, scavData) {
        this.profiles[sessionID]['scav'] = scavData;
    }

    getCompleteProfile(sessionID) {
        let output = [];

        if (!account_f.accountServer.isWiped(sessionID)) {
            output.push(profile_f.profileServer.getPmcProfile(sessionID));
            output.push(profile_f.profileServer.getScavProfile(sessionID));
        }

        return output;
    }

    createProfile(info, sessionID) {
        let account = account_f.accountServer.find(sessionID);
        let folder = account_f.getPath(account.id);
        let pmcData = json.parse(json.read(db.profile[account.edition]["character_" + info.side.toLowerCase()]));
        let storage = json.parse(json.read(db.profile[account.edition]["storage_" + info.side.toLowerCase()]));

        // delete existing profile
        if (this.profiles[account.id]) {
            delete this.profiles[account.id];
        }

        // pmc
        pmcData._id = "pmc" + account.id;
        pmcData.aid = account.id;
        pmcData.savage = "scav" + account.id;
        pmcData.Info.Nickname = info.nickname;
        pmcData.Info.LowerNickname = info.nickname.toLowerCase();
        pmcData.Info.RegistrationDate = Math.floor(new Date() / 1000);
        pmcData.Health.UpdateTime = Math.round(Date.now() / 1000);

        // storage
        storage.data._id = "pmc" + account.id;

        // create profile
        json.write(folder + "character.json", pmcData);
        json.write(folder + "storage.json", storage);
        json.write(folder + "userbuilds.json", {});
        json.write(folder + "dialogue.json", {});

        // load to memory
        let profile = this.getProfile(account.id, 'pmc');

        // traders 
        for (let traderID in db.assort) {
            trader_f.traderServer.resetTrader(account.id, traderID);
        }

        // don't wipe profile again
        account_f.accountServer.setWipe(account.id, false);
    }

    generateScav(sessionID) {
        let pmcData = this.getPmcProfile(sessionID);
        let scavData = bots_f.generatePlayerScav();

        scavData._id = pmcData.savage;
        scavData.aid = sessionID;
        
        this.profiles[sessionID]['scav'] = scavData;
        return scavData;
    }

    validateNickname(info, sessionID) {
        if (info.nickname.length < 3) {
            return "tooshort";
        }

        if (account_f.accountServer.nicknameTaken(info)) {
            return "taken";
        }

        return "OK";
    }

    changeNickname(info, sessionID) {
        let output = this.validateNickname(info, sessionID);

        if (output === "OK") {
            let pmcData = this.getPmcProfile(sessionID);

            pmcData.Info.Nickname = info.nickname;
            pmcData.Info.LowerNickname = info.nickname.toLowerCase();
        }
        
        return output;
    }

    changeVoice(info, sessionID) {
        let pmcData = this.getPmcProfile(sessionID);
        pmcData.Info.Voice = info.voice;
    }
}

function getPmcPath(sessionID) {
    let pmcPath = db.user.profiles.character;
    return pmcPath.replace("__REPLACEME__", sessionID);
}

function getStashType(sessionID) {
    let pmcData = profile_f.profileServer.getPmcProfile(sessionID);

    for (let item of pmcData.Inventory.items) {
        if (item._id === pmcData.Inventory.stash) {
            return item._tpl;
        }
    }

    logger.logError("No stash found");
    return "";
}

function calculateLevel(pmcData) {
    let exp = 0;

    for (let level in globals.data.config.exp.level.exp_table) {
        if (pmcData.Info.Experience < exp) {
            break;
        }

        pmcData.Info.Level = parseInt(level);
        exp += globals.data.config.exp.level.exp_table[level].exp;
    }

    return pmcData.Info.Level;
}

module.exports.profileServer = new ProfileServer();
module.exports.getStashType = getStashType;
module.exports.calculateLevel = calculateLevel;
