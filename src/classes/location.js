"use strict";

/* LocationServer class maintains list of locations in memory. */
class LocationServer {
    constructor() {
        this.locations = {};
        this.initializeLocations();
    }

    /* Load all the locations into memory. */
    initializeLocations() {
        logger.logWarning("Loading locations into RAM...");

        for (let locationName in db.locations) {
            let node = db.locations[locationName];
            let location = json.parse(json.read(node.base));

            // set infill locations
            for (let entry in node.entries) {
                location.SpawnAreas.push(json.parse(json.read(node.entries[entry])));
            }

            // set exfill locations
            for (let exit in node.exits) {
                location.exits.push(json.parse(json.read(node.exits[exit])));
            }

            // set scav locations
            for (let wave in node.waves) {
                location.waves.push(json.parse(json.read(node.waves[wave])));
            }

            // set boss locations
            for (let spawn in node.bosses) {
                location.BossLocationSpawn.push(json.parse(json.read(node.bosses[spawn])));
            }

            this.locations[locationName] = location;
        }
    }

    /* generates a random location preset to use for local session */
    generate(locationName) {
        let output = this.locations[locationName];
        let ids = {};
        let base = {};

        // don't generate loot on hideout
        if (locationName === "hideout") {
            return output;
        }

        // forced loot
        base = db.locations[locationName].loot.forced;

        for (let dir in base) {
            for (let loot in base[dir]) {
                let data = json.parse(json.read(base[dir][loot]));

                if (data.Id in ids) {
                    continue;
                } else {
                    ids[data.Id] = true;
                }

                output.Loot.push(data);
            }
        }

        // static loot
        base = db.locations[locationName].loot.static;

        for (let dir in base) {
            let node = base[dir];
            let keys = Object.keys(node);
            let data = json.parse(json.read(node[keys[utility.getRandomInt(0, keys.length - 1)]]));

            if (data.Id in ids) {
                continue;
            } else {
                ids[data.Id] = true;
            }

            output.Loot.push(data);
        }

        // dyanmic loot
        let dirs = Object.keys(db.locations[locationName].loot.dynamic);
        let max = output.Loot.length + dirs.length;

        if (gameplayConfig.locationloot[locationName] < max) {
            max = gameplayConfig.locationloot[locationName];
        }

        base = db.locations[locationName].loot.dynamic;

        while (output.Loot.length < max) {
            let node = base[dirs[utility.getRandomInt(0, dirs.length - 1)]];
            let keys = Object.keys(node);
            let data = json.parse(json.read(node[keys[utility.getRandomInt(0, keys.length - 1)]]));

            if (data.Id in ids) {
                continue;
            } else {
                ids[data.Id] = true;
            }

            output.Loot.push(data);
        }
        
        // done generating
        logger.logSuccess("Generated location " + locationName);
        return output;
    }

    /* get a location with generated loot data */
    get(location) {
        let locationName = location.toLowerCase().replace(" ", "");
        return json.stringify(this.generate(locationName));
    }

    /* get all locations without loot data */
    generateAll() {
        let base = json.parse(json.read("db/cache/locations.json"));
        let data = {};

        // use right id's and strip loot
        for (let locationName in this.locations) {
            let map = this.locations[locationName];

            map.Loot = [];
            data[this.locations[locationName]._Id] = map;
        }

        base.data.locations = data;
        return base.data;
    }
}

module.exports.locationServer = new LocationServer();