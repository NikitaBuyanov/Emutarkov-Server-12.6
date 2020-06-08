"use strict";

function foldItem(pmcData, body, sessionID) {
    for (let item of pmcData.Inventory.items) {
        if (item._id && item._id === body.item) {
            item.upd.Foldable = {"Folded": body.value};
            return item_f.itemServer.getOutput();
        }
    }

    return "";
}

function toggleItem(pmcData, body, sessionID) {
    for (let item of pmcData.Inventory.items) {
        if (item._id && item._id === body.item) {
            item.upd.Togglable = {"On": body.value};
            return item_f.itemServer.getOutput();
        }
    }

    return "";
}

function tagItem(pmcData, body, sessionID) {
    for (let item of pmcData.Inventory.items) {
        if (item._id === body.item) {
            if (item.upd !== null &&
                item.upd !== undefined &&
                item.upd !== "undefined") {
                item.upd.Tag = {"Color": body.TagColor, "Name": body.TagName};
            } else { //if object doesn't have upd create and add it
                let myobject = {
                    "_id": item._id,
                    "_tpl": item._tpl,
                    "parentId": item.parentId,
                    "slotId": item.slotId,
                    "location": item.location,
                    "upd": {"Tag": {"Color": body.TagColor, "Name": body.TagName}}
                };
                Object.assign(item, myobject); // merge myobject into item -- overwrite same properties and add missings
            }

            return item_f.itemServer.getOutput();
        }
    }

    return "";
}

function bindItem(pmcData, body, sessionID) {
    for (let index in pmcData.Inventory.fastPanel) {
        if (pmcData.Inventory.fastPanel[index] === body.item) {
            pmcData.Inventory.fastPanel[index] = "";
        }
    }

    pmcData.Inventory.fastPanel[body.index] = body.item;
    return item_f.itemServer.getOutput();
}

function examineItem(pmcData, body, sessionID) {
    let itemID = "";
    let items = pmcData.Inventory.items;

    // outside player profile
    if ("fromOwner" in body) {
        // scan ragfair as a trader
        if (body.fromOwner.type === "RagFair") {
            body.item = body.fromOwner.id;
            body.fromOwner.type = "Trader";
            body.fromOwner.id = "ragfair";
        }
    
        // get trader assort
        if (body.fromOwner.type === "Trader") {
            items = trader_f.traderServer.getAssort(body.fromOwner.id).items;
        }
    }

    // player inventory
    for (let item of items) {
        if (item._id === body.item) {
            itemID = item._tpl;
            break;
        }
    }

    if (preset_f.itemPresets.isPreset(itemID)) {
        itemID = preset_f.itemPresets.getBaseItemTpl(itemID);
    }

    // item not found
    if (itemID === "") {
        logger.logError("Cannot find item to examine");
        return "";
    }

    // item found
    let item = json.parse(json.read(db.items[itemID]));
    pmcData.Info.Experience += item._props.ExamineExperience;
    pmcData.Encyclopedia[itemID] = true;

    logger.logSuccess("EXAMINED: " + itemID);
    return item_f.itemServer.getOutput();
}

function readEncyclopedia(pmcData, body, sessionID) {
    for (let id of body.ids) {
        pmcData.Encyclopedia[id] = true;
    }
    return item_f.itemServer.getOutput();
}

module.exports.foldItem = foldItem;
module.exports.toggleItem = toggleItem;
module.exports.tagItem = tagItem;
module.exports.bindItem = bindItem;
module.exports.examineItem = examineItem;
module.exports.readEncyclopedia = readEncyclopedia;