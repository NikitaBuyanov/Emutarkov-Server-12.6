"use strict";

/* Based on the item action, determine whose inventories we should be looking at for from and to. */
function getOwnerInventoryItems(body, sessionID) {
    let isSameInventory = false;
    let pmcItems = profile_f.profileServer.getPmcProfile(sessionID).Inventory.items;
    let scavData = profile_f.profileServer.getScavProfile(sessionID);
    let fromInventoryItems = pmcItems;
    let fromType = "pmc";

    if ("fromOwner" in body) {
        if (body.fromOwner.id === scavData._id) {
            fromInventoryItems = scavData.Inventory.items;
            fromType = "scav";
        } else if (body.fromOwner.type === "Mail") {
            fromInventoryItems = dialogue_f.dialogueServer.getMessageItemContents(body.fromOwner.id, sessionID);
            fromType = "mail";
        }
    }

    // Don't need to worry about mail for destination because client doesn't allow
    // users to move items back into the mail stash.
    let toInventoryItems = pmcItems;
    let toType = "pmc";

    if ("toOwner" in body && body.toOwner.id === scavData._id) {
        toInventoryItems = scavData.Inventory.items;
        toType = "scav";
    }

    if (fromType === toType) {
        isSameInventory = true;
    }

    return {
        from: fromInventoryItems,
        to: toInventoryItems,
        sameInventory: isSameInventory,
        isMail: fromType === "mail"
    };
}

/* Move Item
* change location of item with parentId and slotId
* transfers items from one profile to another if fromOwner/toOwner is set in the body.
* otherwise, move is contained within the same profile_f.
* */
function moveItem(pmcData, body, sessionID) {
    let output = item_f.itemServer.getOutput();

    let items = getOwnerInventoryItems(body, sessionID);
    if (items.isMail) {
        let idsToMove = dialogue_f.findAndReturnChildren(items.from, body.item);
        for (let itemId of idsToMove) {
            for (let messageItem of items.from) {
                if (messageItem._id === itemId) {
                    items.to.push(messageItem);
                }
            }
        }
        moveItemInternal(items.to, body);
    } else if (items.sameInventory) {
        moveItemInternal(items.from, body);
    } else {
        moveItemToProfile(items.from, items.to, body);
    }

    return output;
}

/* Internal helper function to transfer an item from one profile to another.
* fromProfileData: Profile of the source.
* toProfileData: Profile of the destination.
* body: Move request
*/
function moveItemToProfile(fromItems, toItems, body) {
    handleCartridges(fromItems, body);

    let idsToMove = itm_hf.findAndReturnChildrenByItems(fromItems, body.item);

    for (let itemId of idsToMove) {
        for (let itemIndex in fromItems) {
            if (fromItems[itemIndex]._id && fromItems[itemIndex]._id === itemId) {
                if (itemId === body.item) {
                    fromItems[itemIndex].parentId = body.to.id;
                    fromItems[itemIndex].slotId = body.to.container;

                    if ("location" in body.to) {
                        fromItems[itemIndex].location = body.to.location;
                    } else {
                        if (fromItems[itemIndex].location) {
                            delete fromItems[itemIndex].location;
                        }
                    }
                }

                toItems.push(fromItems[itemIndex]);
                fromItems.splice(itemIndex, 1);
            }
        }
    }
}

/* Internal helper function to move item within the same profile_f.
* items: Items
* body: Move request
*/
function moveItemInternal(items, body) {
    handleCartridges(items, body);

    for (let item of items) {
        if (item._id && item._id === body.item) {
            item.parentId = body.to.id;
            item.slotId = body.to.container;

            if ("location" in body.to) {
                item.location = body.to.location;
            } else {
                if (item.location) {
                    delete item.location;
                }
            }

            return;
        }
    }
}

/* Internal helper function to handle cartridges in inventory if any of them exist.
* items: Items
* body: Move request
*/
function handleCartridges(items, body) {
    // -> Move item to diffrent place - counts with equiping filling magazine etc
    if (body.to.container === 'cartridges') {
        let tmp_counter = 0;

        for (let item_ammo in items) {
            if (body.to.id === items[item_ammo].parentId) {
                tmp_counter++;
            }
        }

        body.to.location = tmp_counter;//wrong location for first cartrige
    }
}

/* Remove item of itemId and all of its descendants from profile. */
function removeItemFromProfile(profileData, itemId, output = null) {
    // get items to remove
    let ids_toremove = itm_hf.findAndReturnChildren(profileData, itemId);

     //remove one by one all related items and itself
    for (let i in ids_toremove) {
        if (output !== null) {
            output.items.del.push({"_id": ids_toremove[i]});
        }

        for (let a in profileData.Inventory.items) {
            if (profileData.Inventory.items[a]._id === ids_toremove[i]) {
                profileData.Inventory.items.splice(a, 1);
            }
        }
    }
}

/*
* Remove Item
* Deep tree item deletion / Delets main item and all sub items with sub items ... and so on.
*/
function removeItem(profileData, body, output, sessionID) {
    let toDo = [body];

    //Find the item and all of it's relates
    if (toDo[0] === undefined || toDo[0] === null || toDo[0] === "undefined") {
        logger.logError("item id is not valid");
        return "";
    }

    removeItemFromProfile(profileData, toDo[0], output);
    return output;
}

function discardItem(pmcData, body, sessionID) {
    insurance_f.insuranceServer.remove(pmcData, body.item, sessionID);
    return removeItem(pmcData, body.item, item_f.itemServer.getOutput(), sessionID);
}

/* Split Item
* spliting 1 item into 2 separate items ...
* */
function splitItem(pmcData, body, sessionID) {
    let output = item_f.itemServer.getOutput();
    let location = body.container.location;

    let items = getOwnerInventoryItems(body, sessionID);

    if (!("location" in body.container) && body.container.container === "cartridges") {
        let tmp_counter = 0;

        for (let item_ammo in items.to) {
            if (items.to[item_ammo].parentId === body.container.id) {
                tmp_counter++;
            }
        }

        location = tmp_counter;//wrong location for first cartrige
    }


    // The item being merged is possible from three different sources: pmc, scav, or mail.
    for (let item of items.from) {
        if (item._id && item._id === body.item) {
            item.upd.StackObjectsCount -= body.count;

            let newItem = utility.generateNewItemId();

            output.items.new.push({
                "_id": newItem,
                "_tpl": item._tpl,
                "parentId": body.container.id,
                "slotId": body.container.container,
                "location": location,
                "upd": {"StackObjectsCount": body.count}
            });

            items.to.push({
                "_id": newItem,
                "_tpl": item._tpl,
                "parentId": body.container.id,
                "slotId": body.container.container,
                "location": location,
                "upd": {"StackObjectsCount": body.count}
            });

            return output;
        }
    }

    return "";
}

/* Merge Item
* merges 2 items into one, deletes item from body.item and adding number of stacks into body.with
* */
function mergeItem(pmcData, body, sessionID) {
    let output = item_f.itemServer.getOutput();
    let items = getOwnerInventoryItems(body, sessionID);

    for (let key in items.to) {
        if (items.to[key]._id && items.to[key]._id === body.with) {
            for (let key2 in items.from) {
                if (items.from[key2]._id && items.from[key2]._id === body.item) {
                    let stackItem0 = 1;
                    let stackItem1 = 1;
                    
                    if(!items.to[key].upd.StackObjectsCount){
                        items.to[key].upd.StackObjectsCount = 1
                    } else if (!items.from[key2].upd.StackObjectsCount){
                        items.from[key2].upd.StackObjectsCount = 1
                    }
                    
                    if ("upd" in items.to[key]) {
                        stackItem0 = items.to[key].upd.StackObjectsCount;
                    }

                    if ("upd" in items.from[key2]) {
                        stackItem1 = items.from[key2].upd.StackObjectsCount;
                    }

                    if (stackItem0 === 1) {
                        Object.assign(items.to[key], {"upd": {"StackObjectsCount": 1}});
                    }

                    items.to[key].upd.StackObjectsCount = stackItem0 + stackItem1;
                    output.items.del.push({"_id": items.from[key2]._id});
                    items.from.splice(key2, 1);
                    return output;
                }
            }
        }
    }

    return "";
}

/* Transfer item
* Used to take items from scav inventory into stash or to insert ammo into mags (shotgun ones) and reloading weapon by clicking "Reload"
* */
function transferItem(pmcData, body, sessionID) {
    let output = item_f.itemServer.getOutput();

    let itemFrom = null, itemTo = null;

    for (let iterItem of pmcData.Inventory.items) {
        if (iterItem._id === body.item) {
            itemFrom = iterItem;
        }
        else if (iterItem._id === body.with) {
            itemTo = iterItem;
        }
        if (itemFrom !== null && itemTo !== null) break;
    }

    if (itemFrom !== null && itemTo !== null)
    {
        let stackFrom = 1;

        if ("upd" in itemFrom) {
            stackFrom = itemFrom.upd.StackObjectsCount;
        } else {
            Object.assign(itemFrom, {"upd": {"StackObjectsCount": 1}});
        }

        if (stackFrom > body.count) {
            itemFrom.upd.StackObjectsCount = stackFrom - body.count;
        } else {
            // Moving a full stack onto a smaller stack
            itemFrom.upd.StackObjectsCount = stackFrom - 1;
        }

        let stackTo = 1;

        if ("upd" in itemTo) {
            stackTo = itemTo.upd.StackObjectsCount;
        } else {
            Object.assign(itemTo, {"upd": {"StackObjectsCount": 1}});
        }

        itemTo.upd.StackObjectsCount = stackTo + body.count;
    }

    return output;
}

/* Swap Item
* its used for "reload" if you have weapon in hands and magazine is somewhere else in rig or backpack in equipment
* */
function swapItem(pmcData, body, sessionID) {
    let output = item_f.itemServer.getOutput();

    for (let iterItem of pmcData.Inventory.items) {
        if (iterItem._id === body.item) {
            iterItem.parentId = body.to.id;         // parentId
            iterItem.slotId = body.to.container;    // slotId
            iterItem.location = body.to.location    // location
        }

        if (iterItem._id === body.item2) {
            iterItem.parentId = body.to2.id;
            iterItem.slotId = body.to2.container;
            delete iterItem.location;
        }
    }

    return output;
}

/* Give Item
* its used for "add" item like gifts etc.
* */
function addItem(pmcData, body, output, sessionID, foundInRaid = false) {
    let PlayerStash = itm_hf.getPlayerStash(sessionID);
    let stashY = PlayerStash[1];
    let stashX = PlayerStash[0];
    let items;

    if (body.item_id in globals.data.ItemPresets) {
        items = globals.data.ItemPresets[body.item_id]._items;
        body.item_id = items[0]._id;
    } else if (body.tid === "579dc571d53a0658a154fbec") {
        items = [{_id: body.item_id, _tpl: body.item_id}];
    } else {
        items = trader_f.traderServer.getAssort(body.tid).items;
    }

    for (let item of items) {
        if (item._id === body.item_id) {
            let MaxStacks = 1;
            let StacksValue = [];
            let tmpItem = itm_hf.getItem(item._tpl)[1];

            // split stacks if the size is higher than allowed by StackMaxSize
            if (body.count > tmpItem._props.StackMaxSize) {
                let count = body.count;
                let calc = body.count - (Math.floor(body.count / tmpItem._props.StackMaxSize) * tmpItem._props.StackMaxSize);

                MaxStacks = (calc > 0) ? MaxStacks + Math.floor(count / tmpItem._props.StackMaxSize) : Math.floor(count / tmpItem._props.StackMaxSize);

                for (let sv = 0; sv < MaxStacks; sv++) {
                    if (count > 0) {
                        if (count > tmpItem._props.StackMaxSize) {
                            count = count - tmpItem._props.StackMaxSize;
                            StacksValue[sv] = tmpItem._props.StackMaxSize;
                        } else {
                            StacksValue[sv] = count;
                        }
                    }
                }
            } else {
                StacksValue[0] = body.count;
            }
            // stacks prepared

            for (let stacks = 0; stacks < MaxStacks; stacks++) {
                //update profile on each stack so stash recalculate will have new items
                pmcData = profile_f.profileServer.getPmcProfile(sessionID);

                let StashFS_2D = itm_hf.recheckInventoryFreeSpace(pmcData, sessionID);
                let ItemSize = itm_hf.getSize(item._tpl, item._id, items);
                let tmpSizeX = ItemSize[0];
                let tmpSizeY = ItemSize[1];

                addedProperly:
                    for (let y = 0; y <= stashY - tmpSizeY; y++) {
                        for (let x = 0; x <= stashX - tmpSizeX; x++) {
                            let badSlot = "no";

                            for (let itemY = 0; itemY < tmpSizeY; itemY++) {
                                for (let itemX = 0; itemX < tmpSizeX; itemX++) {
                                    if (StashFS_2D[y + itemY][x + itemX] !== 0) {
                                        badSlot = "yes";
                                        break;
                                    }
                                }

                                if (badSlot === "yes") {
                                    break;
                                }
                            }

                            if (badSlot === "yes") {
                                continue;
                            }

                            logger.logInfo("Item placed at position [" + x + "," + y + "]", "", "", true);
                            let newItem = utility.generateNewItemId();
                            let toDo = [[item._id, newItem]];
                            let upd = {"StackObjectsCount": StacksValue[stacks]};

                            // in case people want all items to be marked as found in raid
                            if (gameplayConfig.trading.buyItemsMarkedFound) {
                                foundInRaid = true;
                            }

                            // hideout items need to be marked as found in raid
                            if (foundInRaid) {
                                upd["SpawnedInSession"] = true;
                            }

                            output.items.new.push({
                                "_id": newItem,
                                "_tpl": item._tpl,
                                "parentId": pmcData.Inventory.stash,
                                "slotId": "hideout",
                                "location": {"x": x, "y": y, "r": 0},
                                "upd": upd
                            });

                            pmcData.Inventory.items.push({
                                "_id": newItem,
                                "_tpl": item._tpl,
                                "parentId": pmcData.Inventory.stash,
                                "slotId": "hideout",
                                "location": {"x": x, "y": y, "r": 0},
                                "upd": upd
                            });

                            while (true) {
                                if (toDo.length === 0) {
                                    break;
                                }

                                for (let tmpKey in items) {
                                    if (items[tmpKey].parentId && items[tmpKey].parentId === toDo[0][0]) {
                                        newItem = utility.generateNewItemId();

                                        let SlotID = items[tmpKey].slotId;

                                        if (SlotID === "hideout") {
                                            output.items.new.push({
                                                "_id": newItem,
                                                "_tpl": items[tmpKey]._tpl,
                                                "parentId": toDo[0][1],
                                                "slotId": SlotID,
                                                "location": {"x": x, "y": y, "r": "Horizontal"},
                                                "upd": upd
                                            });

                                            pmcData.Inventory.items.push({
                                                "_id": newItem,
                                                "_tpl": items[tmpKey]._tpl,
                                                "parentId": toDo[0][1],
                                                "slotId": items[tmpKey].slotId,
                                                "location": {"x": x, "y": y, "r": "Horizontal"},
                                                "upd": upd
                                            });
                                        } else {
                                            output.items.new.push({
                                                "_id": newItem,
                                                "_tpl": items[tmpKey]._tpl,
                                                "parentId": toDo[0][1],
                                                "slotId": SlotID,
                                                "upd": upd
                                            });

                                            pmcData.Inventory.items.push({
                                                "_id": newItem,
                                                "_tpl": items[tmpKey]._tpl,
                                                "parentId": toDo[0][1],
                                                "slotId": items[tmpKey].slotId,
                                                "upd": upd
                                            });
                                        }

                                        toDo.push([items[tmpKey]._id, newItem]);
                                    }
                                }

                                toDo.splice(0, 1);
                            }

                            break addedProperly;
                        }
                    }
            }

            return output;
        }
    }

    return "";
}

module.exports.moveItem = moveItem;
module.exports.removeItemFromProfile = removeItemFromProfile;
module.exports.removeItem = removeItem;
module.exports.discardItem = discardItem;
module.exports.splitItem = splitItem;
module.exports.mergeItem = mergeItem;
module.exports.transferItem = transferItem;
module.exports.swapItem = swapItem;
module.exports.addItem = addItem;
