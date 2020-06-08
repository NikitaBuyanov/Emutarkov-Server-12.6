"use strict";

/* HealthServer class maintains list of health for each sessionID in memory. */
class HealthServer {
    constructor() {
        this.healths = {};
        this.effects = {};
    }

    /* resets the healh response */
    initializeHealth(sessionID) {
        this.healths[sessionID] = {
            "Hydration": 0,
            "Energy": 0,
            "Head": 0,
            "Chest": 0,
            "Stomach": 0,
            "LeftArm": 0,
            "RightArm": 0,
            "LeftLeg": 0,
            "RightLeg": 0
        };
        this.effects[sessionID] = {
            "Head": {},
            "Chest": {},
            "Stomach": {},
            "LeftArm": {},
            "RightArm": {},
            "LeftLeg": {},
            "RightLeg": {}
        };

        return this.healths[sessionID];
    }

    // setHealth(sessionID) {
    //     return this.health[sessionID] || this.initializeHealth(sessionID);
    // }

    offraidHeal(pmcData, body, sessionID) {
        let output = item_f.itemServer.getOutput();
    
        // update medkit used (hpresource)
        for (let item of pmcData.Inventory.items) {
            if (item._id === body.item) {
                let itemProps = itm_hf.getItem(item._tpl)[1]._props;
                let maxHpResource = itemProps.MaxHpResource;

                // todo: change output
                // added checks for splint and non medkit items
                if (item.upd != undefined && "MedKit" in item.upd) {
                    item.upd.MedKit.HpResource -= body.count;
                } else if (maxHpResource > 0) {
                    if (item.upd == undefined)
                        item.upd = {};
                        console.log(item.upd.MedKit.HpResource)
                        console.log(itemProps.MaxHpResource)
                    item.upd.MedKit = {"HpResource": MaxHpResource - body.count};
                }
    
                if (maxHpResource === 0 || item.upd.MedKit.HpResource === 0) {
                    output = move_f.removeItem(pmcData, body.item, output, sessionID);
                }
            }
        }

        return output;
    }

    offraidEat(pmcData, body, sessionID) {        
        let output = item_f.itemServer.getOutput();
        let resourceLeft;
        let maxResource = {};
    
        for (let item of pmcData.Inventory.items) {
            if (item._id === body.item) {
                let itemProps = itm_hf.getItem(item._tpl)[1]._props;
                maxResource = itemProps.MaxResource;

                if (maxResource > 1) {   
                    if ("FoodDrink" in item.upd) {
                        item.upd.FoodDrink.HpPercent -= body.count; 
                    } else {
                        item.upd.FoodDrink = {"HpPercent" : maxResource - body.count};
                    }
                    
                    resourceLeft = item.upd.FoodDrink.HpPercent;
                }
            }
        }

        if (maxResource === 1 || resourceLeft < 1) {
            output = move_f.removeItem(pmcData, body.item, output, sessionID);
        }

        return output;
    }

    /* stores in-raid player health */
    saveHealth(pmcData, info, sessionID) {
        let nodeHealth = this.healths[sessionID];
        let nodeEffects = this.effects[sessionID];
        let BodyPartsList = null;

        if(info.IsAlive){
            BodyPartsList = info.Health;
            nodeHealth.Hydration = info.Hydration;
            nodeHealth.Energy = info.Energy;
        } else {
            BodyPartsList = info.BodyParts;
            nodeHealth.Hydration = info.Hydration.Current;
            nodeHealth.Energy = info.Energy.Current;
        }

        console.log(info)

        for (let bodyPart of Object.keys(BodyPartsList)) {
            if (BodyPartsList[bodyPart].Effects != undefined) { 
                nodeEffects[bodyPart] = BodyPartsList[bodyPart].Effects;
            }

            if (info.IsAlive === true) {
                nodeHealth[bodyPart] = BodyPartsList[bodyPart].Current;
            } else {
                nodeHealth[bodyPart] = -1;
            }
        }

        this.applyHealth(pmcData, sessionID);
    }

    /* stores the player health changes */
    updateHealth(info, sessionID) {
        let node = this.healths[sessionID];

        switch (info.type) {
            /* store difference from infill */
            case "HydrationChanged":
            case "EnergyChanged":
                node[(info.type).replace("Changed", "")] += parseInt(info.diff);
                break;
    
            /* difference is already applies */
            case "HealthChanged":
                node[info.bodyPart] = info.value;
                break;
       
            /* store state and make server aware to kill all body parts */
            case "Died":
                node = {
                    "Hydration": this.healths[sessionID].Hydration,
                    "Energy": this.healths[sessionID].Energy,
                    "Head": -1,
                    "Chest": -1,
                    "Stomach": -1,
                    "LeftArm": -1,
                    "RightArm": -1,
                    "LeftLeg": -1,
                    "RightLeg": -1
                };
                break;
        }

        this.healths[sessionID] = node;
    }

    addEffect(pmcData, sessionID, info) {
        let bodyPart = pmcData.Health.BodyParts[info.bodyPart];

        if (bodyPart.Effects == undefined) {
            bodyPart.Effects = {};
        }

        switch (info.effectType) {
            case "BreakPart":
                bodyPart.Effects.BreakPart = { "Time": -1 };
                break;
        }

        // delete empty property to prevent client bugs
        if (this.isEmpty(bodyPart.Effects))
            delete bodyPart.Effects;
    }

    removeEffect(pmcData, sessionID, info) {
        let bodyPart = pmcData.Health.BodyParts[info.bodyPart];
        if (!bodyPart.hasOwnProperty("Effects")) {
            return;
        }

        switch (info.effectType) {
            case "BreakPart":
                if (bodyPart.Effects.hasOwnProperty("BreakPart")) {
                    delete bodyPart.Effects.BreakPart;
                }
        }

        // delete empty property to prevent client bugs
        if (this.isEmpty(bodyPart.Effects))
            delete bodyPart.Effects;
    }

    /* apply the health changes to the profile */
    applyHealth(pmcData, sessionID) {
        if (!gameplayConfig.inraid.saveHealthEnabled) {
            return;
        }

        let nodeHealth = this.healths[sessionID];
        let keys = Object.keys(nodeHealth);

        for (let item of keys) {
            if (item !== "Hydration" && item !== "Energy") {
                /* set body part health */
                pmcData.Health.BodyParts[item].Health.Current = (nodeHealth[item] <= 0)
                    ? Math.round((pmcData.Health.BodyParts[item].Health.Maximum * gameplayConfig.inraid.saveHealthMultiplier))
                    : nodeHealth[item];
            } else {
                /* set resources */
                pmcData.Health[item].Current = nodeHealth[item];

                if (pmcData.Health[item].Current > pmcData.Health[item].Maximum) {
                    pmcData.Health[item].Current = pmcData.Health[item].Maximum;
                }
            }
        }

        let nodeEffects = this.effects[sessionID];
        Object.keys(nodeEffects).forEach(bodyPart => {
            // clear effects
            delete pmcData.Health.BodyParts[bodyPart].Effects;

            // add new
            Object.keys(nodeEffects[bodyPart]).forEach(effect => {
                switch (effect) {
                    case "BreakPart":
                        this.addEffect(pmcData, sessionID, {bodyPart: bodyPart, effectType: "BreakPart"});
                        break;
                }
            });
        });

        pmcData.Health.UpdateTime = Math.round(Date.now() / 1000);

        this.initializeHealth(sessionID);
    }

    isEmpty(map) {
        for(var key in map) {
            if (map.hasOwnProperty(key)) {
                return false;
            }
        }
        return true;
    }
}

module.exports.healthServer = new HealthServer();
