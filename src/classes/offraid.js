"use strict";

class InraidServer {
    constructor() {
        this.players = {};
        this.keycard = "5c94bbff86f7747ee735c08f"
    }

    addPlayer(sessionID, info) {
        this.players[sessionID] = info;
    }

    removePlayer(sessionID) {
        delete this.players[sessionID];
    }

    removeLabKeyCard(offraidData, sessionID) {
        if (this.players[sessionID] !== "Common") {
            return;
        }
    
        for (let item of offraidData.profile.Inventory.items) {
            if (item._tpl === this.keycard && item.slotId !== "Hideout") {
                //this will not correctly 
                let usages = ("upd" in item && "Key" in item.upd) ? item.upd.Key.NumberOfUsages : -1;
    
                if (usages === -1) {
                    item.upd = {"Key": {"NumberOfUsages": 1 }};
                } else {
                    item.upd.Key.NumberOfUsages += 1;
                }
    
                if (item.upd.Key.NumberOfUsages >= itm_hf.getItem(this.keycard)[1]._props.MaximumNumberOfUsage) {
                    move_f.removeItemFromProfile(offraidData.profile, item._id);
                }
    
                break;
            }
        }
    }
}

/* adds SpawnedInSession property to items found in a raid */
function markFoundItems(pmcData, offraidData, isPlayerScav) {
    // mark items found in raid
    for (let offraidItem of offraidData.Inventory.items) {
        let found = false;

        // mark new items for PMC, mark all items for scavs
        if (!isPlayerScav) {
            // check if the item exists
            for (let item of pmcData.Inventory.items) {
                if (offraidItem._id === item._id) {
                    found = true;
                    break;
                }
            }

            if (found) {
                // if the item exists and is taken inside the raid, remove the taken in raid status
                if ("upd" in offraidItem && "SpawnedInSession" in offraidItem.upd) {
                    delete offraidItem.upd.SpawnedInSession;
                }

                continue;
            }
        }

        // mark item found in raid
        if ("upd" in offraidItem) {
            offraidItem.upd.SpawnedInSession = true;
        } else {
            offraidItem.upd = {"SpawnedInSession": true};
        }
    }

    return offraidData;
}

function RemoveFoundItems(offraidData) {
    for (let offraidItem of offraidData.Inventory.items) {
        // Remove the FIR status if the player died and the item marked FIR
        if ("upd" in offraidItem && "SpawnedInSession" in offraidItem.upd) {
            delete offraidItem.upd.SpawnedInSession;
        }

        continue;
    }

    return offraidData;
}

function setInventory(pmcData, offraidData) {
    move_f.removeItemFromProfile(pmcData, pmcData.Inventory.equipment);
    move_f.removeItemFromProfile(pmcData, pmcData.Inventory.questRaidItems);
    move_f.removeItemFromProfile(pmcData, pmcData.Inventory.questStashItems);

    for (let item of offraidData.Inventory.items) {
        pmcData.Inventory.items.push(item);
    }

    return pmcData;
}

function deleteInventory(pmcData, sessionID) {
    let toDelete = [];

    for (let item of pmcData.Inventory.items) {
        // remove normal item
        if (item.parentId === pmcData.Inventory.equipment
            && item.slotId !== "SecuredContainer"
            && item.slotId !== "Scabbard"
            && item.slotId !== "Pockets"
            || item.parentId === pmcData.Inventory.questRaidItems) {
            toDelete.push(item._id);
        }

        // remove pocket insides
        if (item.slotId === "Pockets") {
            for (let pocket of pmcData.Inventory.items) {
                if (pocket.parentId === item._id) {
                    toDelete.push(pocket._id);
                }
            }
        }
    }

    // delete items
    for (let item of toDelete) {
        move_f.removeItemFromProfile(pmcData, item);
    }

    pmcData.Inventory.fastPanel = {}
    return pmcData;
}

function getPlayerGear(items) {
    // Player Slots we care about
    const inventorySlots = [
        'FirstPrimaryWeapon',
        'SecondPrimaryWeapon',
        'Holster',
        'Headwear',
        'Earpiece',
        'Eyewear',
        'FaceCover',
        'ArmorVest',
        'TacticalVest',
        'Backpack',
        'pocket1',
        'pocket2',
        'pocket3',
        'pocket4',
        "SecuredContainer"
    ];

    let inventoryItems = [];

    // Get an array of root player items
    for (let item of items) {
        if (inventorySlots.includes(item.slotId)) {
            inventoryItems.push(item);
        }
    }

    // Loop through these items and get all of their children
    let newItems = inventoryItems;
    while (newItems.length > 0) {
        let foundItems = [];

        for (let item of newItems) {
            // Find children of this item
            for (let newItem of items) {
                if (newItem.parentId === item._id) {
                    foundItems.push(newItem);
                }
            }
        }

        // Add these new found items to our list of inventory items
        inventoryItems = [
            ...inventoryItems,
            ...foundItems,
        ];

        // Now find the children of these items
        newItems = foundItems;
    }

    return inventoryItems;
}

function getSecuredContainer(items) {
    // Player Slots we care about
    const inventorySlots = [
        'SecuredContainer',
    ];

    let inventoryItems = [];

    // Get an array of root player items
    for (let item of items) {
        if (inventorySlots.includes(item.slotId)) {
            inventoryItems.push(item);
        }
    }

    // Loop through these items and get all of their children
    let newItems = inventoryItems;

    while (newItems.length > 0) {
        let foundItems = [];

        for (let item of newItems) {
            for (let newItem of items) {
                if (newItem.parentId === item._id) {
                    foundItems.push(newItem);
                }
            }
        }

        // Add these new found items to our list of inventory items
        inventoryItems = [
            ...inventoryItems,
            ...foundItems,
        ];

        // Now find the children of these items
        newItems = foundItems;
    }

    return inventoryItems;
}

function saveProgress(offraidData, sessionID) {
    if (!gameplayConfig.inraid.saveLootEnabled) {
        return;
    }

    let pmcData = profile_f.profileServer.getPmcProfile(sessionID);
    let scavData = profile_f.profileServer.getScavProfile(sessionID);
    const isPlayerScav = offraidData.isPlayerScav;
    const isDead = (offraidData.exit !== "survived" && offraidData.exit !== "runner");
    const preRaidGear = (isPlayerScav) ? [] : getPlayerGear(pmcData.Inventory.items);

    // set pmc data
    if (!isPlayerScav) {
        pmcData.Info.Level = offraidData.profile.Info.Level;
        pmcData.Skills = offraidData.profile.Skills;
        pmcData.Stats = offraidData.profile.Stats;
        pmcData.Encyclopedia = offraidData.profile.Encyclopedia;
        pmcData.ConditionCounters = offraidData.profile.ConditionCounters;
        pmcData.Quests = offraidData.profile.Quests;

        // For some reason, offraidData seems to drop the latest insured items.
        // It makes more sense to use pmcData's insured items as the source of truth.
        offraidData.profile.InsuredItems = pmcData.InsuredItems;

        // add experience points
        pmcData.Info.Experience += pmcData.Stats.TotalSessionExperience;
        pmcData.Stats.TotalSessionExperience = 0;

        // level 69 cap to prevent visual bug occuring at level 70
        if (pmcData.Info.Experience > 13129881) {
            pmcData.Info.Experience = 13129881;
        }

        // Remove the Lab card
        offraid_f.inraidServer.removeLabKeyCard(offraidData, sessionID);
        offraid_f.inraidServer.removePlayer(sessionID);
    }

    //Check for exit status
    if (offraidData.exit === "survived") {
        // mark found items and replace item ID's if the player survived
        offraidData.profile = markFoundItems(pmcData, offraidData.profile, isPlayerScav);
    } else {
        //Or remove the FIR status if the player havn't survived
        offraidData.profile = RemoveFoundItems(offraidData.profile)
    }

    offraidData.profile.Inventory.items = itm_hf.replaceIDs(offraidData.profile, offraidData.profile.Inventory.items);

    // set profile equipment to the raid equipment
    if (isPlayerScav) {
        scavData = setInventory(scavData, offraidData.profile);
        health_f.healthServer.initializeHealth(sessionID);
        profile_f.profileServer.setScavProfile(sessionID, scavData);
        return;
    } else {
        pmcData = setInventory(pmcData, offraidData.profile);
        health_f.healthServer.saveHealth(pmcData, offraidData.profile.Health, sessionID);
    }

    // remove inventory if player died and send insurance items
    insurance_f.insuranceServer.storeLostGear(pmcData, offraidData, preRaidGear, sessionID);

    if (isDead) {
        insurance_f.insuranceServer.storeDeadGear(pmcData, offraidData, preRaidGear, sessionID);
        pmcData = deleteInventory(pmcData, sessionID);
        //Delete carried quests items
        offraidData.profile.Stats.CarriedQuestItems = []
    }

    insurance_f.insuranceServer.sendInsuredItems(pmcData, sessionID);
}

module.exports.inraidServer = new InraidServer();
module.exports.saveProgress = saveProgress;
module.exports.getSecuredContainer = getSecuredContainer;
module.exports.getPlayerGear = getPlayerGear;
