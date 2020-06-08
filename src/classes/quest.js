"use strict";

/*
* Quest status values
* 0 - Locked
* 1 - AvailableForStart
* 2 - Started
* 3 - AvailableForFinish
* 4 - Success
* 5 - Fail
* 6 - FailRestartable
* 7 - MarkedAsFailed
*/

let questsCache = undefined;

function initialize() {
    questsCache = json.read(db.user.cache.quests);
}

function getQuestsCache() {
    return questsCache;
}

function getCachedQuest(qid) {
    let quests = json.parse(questsCache);

    for (let quest of quests.data) {
        if (quest._id === qid) {
            return quest;
        }
    }

    return null;
}

function processReward(reward) {
    let rewardItems = [];
    let targets;
    let mods = [];

    // separate base item and mods, fix stacks
    for (let item of reward.items) {
        if (item._id === reward.target) {
            targets = itm_hf.splitStack(item);
        }
        else {
            mods.push(item);
        }
    }

    // add mods to the base items, fix ids
    for (let target of targets) {
        let items = [target];

        for (let mod of mods) {
            items.push(itm_hf.clone(mod));
        }

        rewardItems = rewardItems.concat(itm_hf.replaceIDs(null, items));
    }

    return rewardItems;
}

/* Gets a flat list of reward items for the given quest and state
* input: quest, a quest object
* input: state, the quest status that holds the items (Started, Success, Fail)
* output: an array of items with the correct maxStack
*/
function getQuestRewardItems(quest, state) {
    let questRewards = [];

    for (let reward of quest.rewards[state]) {
        if ("Item" === reward.type) {
            questRewards = questRewards.concat(processReward(reward));
        }
    }

    return questRewards;
}

function acceptQuest(pmcData, body, sessionID) {
    let state = "Started";
    let found = false;

    // If the quest already exists, update its status
    for (const quest of pmcData.Quests) {
        if (quest.qid === body.qid) {
            quest.startTime = utility.getTimestamp();
            quest.status = state;
            found = true;
            break;
        }
    }

    // Otherwise, add it
    if (!found) {
        pmcData.Quests.push({
            "qid": body.qid,
            "startTime": utility.getTimestamp(),
            "status": state
        });
    }

    // Create a dialog message for starting the quest.
    // Note that for starting quests, the correct locale field is "description", not "startedMessageText".
    let quest = getCachedQuest(body.qid);
    let questLocale = json.parse(json.read(db.locales["en"].quest[body.qid]));
    let questRewards = getQuestRewardItems(quest, state);
    let messageContent = {
        "templateId": questLocale.startedMessageText,
        "type": dialogue_f.getMessageTypeValue('questStart'),
        "maxStorageTime": gameplayConfig.other.RedeemTime *3600

    };

    if (questLocale.startedMessageText === "") {
        messageContent = {
            "templateId": questLocale.description,
            "type": dialogue_f.getMessageTypeValue('questStart'),
            "maxStorageTime": gameplayConfig.other.RedeemTime *3600
        };
    }

    dialogue_f.dialogueServer.addDialogueMessage(quest.traderId, messageContent, sessionID, questRewards);
    
    return item_f.itemServer.getOutput();
}

function completeQuest(pmcData, body, sessionID) {
    let state = "Success";
    let intelCenterBonus = 0;//percentage of money reward

    //find if player has money reward boost 
    for (let area of pmcData.Hideout.Areas) {
        if (area.type === 11) {
            if (area.level === 1) {
                intelCenterBonus = 5;
            }
            
            if (area.level > 1) {
                intelCenterBonus = 15;
            }
        }
    }

    for (let quest in pmcData.Quests) {
        if (pmcData.Quests[quest].qid === body.qid) {
            pmcData.Quests[quest].status = state;
            break;
        }
    }

    // give reward
    let quest = getCachedQuest(body.qid);

    if(intelCenterBonus > 0) { 
        quest = applyMoneyBoost(quest,intelCenterBonus);    //money = money + (money*intelCenterBonus/100)
    }

    let questRewards = getQuestRewardItems(quest, state);

    for (let reward of quest.rewards.Success) {
        switch (reward.type) {
            case "Skill":
                pmcData = profile_f.profileServer.getPmcProfile(sessionID);

                for (let skill of pmcData.Skills.Common) {
                    if (skill.Id === reward.target) {
                        skill.Progress += parseInt(reward.value);
                        break;
                    }
                }
                break;

            case "Experience":
                pmcData = profile_f.profileServer.getPmcProfile(sessionID);
                pmcData.Info.Experience += parseInt(reward.value);
                break;

            case "TraderStanding":
                pmcData = profile_f.profileServer.getPmcProfile(sessionID);
                pmcData.TraderStandings[reward.target].currentStanding += parseFloat(reward.value);
                trader_f.traderServer.lvlUp(reward.target, sessionID);
                break;
                
            case "TraderUnlock":
                trader_f.traderServer.changeTraderDisplay(reward.target, true, sessionID);
                break;
        }
    }

    // Create a dialog message for completing the quest.
    let questDb = getCachedQuest(body.qid);
    let questLocale = json.parse(json.read(db.locales["en"].quest[body.qid]));
    let messageContent = {
        "templateId": questLocale.successMessageText,
        "type": dialogue_f.getMessageTypeValue('questSuccess'),
        "maxStorageTime": gameplayConfig.other.RedeemTime * 3600
    }

    dialogue_f.dialogueServer.addDialogueMessage(questDb.traderId, messageContent, sessionID, questRewards);
    return item_f.itemServer.getOutput();
}

function handoverQuest(pmcData, body, sessionID) {
    const quest = getCachedQuest(body.qid);
    let output = item_f.itemServer.getOutput();
    let types = ["HandoverItem", "WeaponAssembly"];
    let handoverMode = true;
    let value = 0;
    let counter = 0;
    let amount;

    for (let condition of quest.conditions.AvailableForFinish) {
        if (condition._props.id === body.conditionId && types.includes(condition._parent)) {
            value = parseInt(condition._props.value);
            handoverMode = condition._parent === types[0];
            break;
        }
    }

    if (handoverMode && value === 0) {
        logger.logError("Quest handover error: condition not found or incorrect value. qid=" + body.qid + ", condition=" + body.conditionId);
        return output;
    }

    for (let itemHandover of body.items) {
        if (handoverMode) {
            // remove the right quantity of given items
            amount = Math.min(itemHandover.count, value - counter);
            counter += amount;
            changeItemStack(pmcData, itemHandover.id, itemHandover.count - amount, output);

            if (counter === value) {
                break;
            }
        } else {
            // for weapon assembly quests, remove the item and its children
            let toRemove = itm_hf.findAndReturnChildren(pmcData, itemHandover.id);
            let index = pmcData.Inventory.items.length;

            // important: don't tell the client to remove the attachments, it will handle it
            output.items.del.push({ "_id": itemHandover.id });
            counter = 1;

            // important: loop backward when removing items from the array we're looping on
            while (index-- > 0) {
                if (toRemove.includes(pmcData.Inventory.items[index]._id)) {
                    pmcData.Inventory.items.splice(index, 1);
                }
            }
        }
    }

    if (body.conditionId in pmcData.BackendCounters) {
        pmcData.BackendCounters[body.conditionId].value += counter;
    } else {
        pmcData.BackendCounters[body.conditionId] = {"id": body.conditionId, "qid": body.qid, "value": counter};
    }

    return output;
}

function applyMoneyBoost(quest, moneyBoost) {
    for (let reward of quest.rewards.Success) {
        if (reward.type === "Item") {
            if (itm_hf.isMoneyTpl(reward.items[0]._tpl)) {
                reward.items[0].upd.StackObjectsCount += reward.items[0].upd.StackObjectsCount * moneyBoost / 100;
            }
        }
    }

    return quest;
}

/* Sets the item stack to value, or delete the item if value <= 0 */
// TODO maybe merge this function and the one from customization
function changeItemStack(pmcData, id, value, output) {
    for (let inventoryItem in pmcData.Inventory.items) {
        if (pmcData.Inventory.items[inventoryItem]._id === id) {
            if (value > 0) {
                let item = pmcData.Inventory.items[inventoryItem];

                item.upd.StackObjectsCount = value;

                output.items.change.push({
                    "_id": item._id,
                    "_tpl": item._tpl,
                    "parentId": item.parentId,
                    "slotId": item.slotId,
                    "location": item.location,
                    "upd": { "StackObjectsCount": item.upd.StackObjectsCount }
                });
            } else {
                output.items.del.push({ "_id": id });
                pmcData.Inventory.items.splice(inventoryItem, 1);
            }

            break;
        }
    }
}

function getQuestStatus(pmcData, questID) {
    for (let quest of pmcData.Quests) {
        if (quest.qid === questID) {
            return quest.status;
        }
    }

    return "Locked";
}

module.exports.initialize = initialize;
module.exports.getQuestsCache = getQuestsCache;
module.exports.acceptQuest = acceptQuest;
module.exports.completeQuest = completeQuest;
module.exports.handoverQuest = handoverQuest;
module.exports.getQuestStatus = getQuestStatus;