"use strict";

/* TraderServer class maintains list of traders for each sessionID in memory. */
class TraderServer {
    constructor() {
        this.traders = {};
        this.assorts = {};

        this.initializeTraders();
    }

    /* Load all the traders into memory. */
    initializeTraders() {
        for (let traderID in db.assort) {
            this.traders[traderID] = json.parse(json.read(db.assort[traderID].base));
            this.traders[traderID].sell_category = json.parse(json.read(db.assort[traderID].categories));
        }
    }

    getTrader(traderID) {
        return this.traders[traderID];
    }

    changeTraderDisplay(traderID, status, sessionID) {
        let pmcData = profile_f.profileServer.getPmcProfile(sessionID);
        pmcData.TraderStandings[traderID].display = status;
    }

    getAllTraders(sessionID) {
        let pmcData = profile_f.profileServer.getPmcProfile(sessionID);
        let traders = [];

        for (let traderID in this.traders) {
            if (traderID === "ragfair") {
                continue;
            }

            if (!(traderID in pmcData.TraderStandings)) {
                this.resetTrader(sessionID, traderID);
            }

            let trader = this.traders[traderID];

            trader.display = pmcData.TraderStandings[traderID].display;
            trader.loyalty.currentLevel = pmcData.TraderStandings[traderID].currentLevel;
            trader.loyalty.currentStanding = pmcData.TraderStandings[traderID].currentStanding;
            trader.loyalty.currentSalesSum = pmcData.TraderStandings[traderID].currentSalesSum;
            traders.push(trader);
        }

        return traders;
    }

    lvlUp(traderID, sessionID) {
        let pmcData = profile_f.profileServer.getPmcProfile(sessionID);
        let loyaltyLevels = this.traders[traderID].loyalty.loyaltyLevels;

        // level up player
        pmcData.Info.Level = profile_f.calculateLevel(pmcData);

        // level up traders
        let targetLevel = 0;
        
        for (let level in loyaltyLevels) {
            if ((loyaltyLevels[level].minLevel <= pmcData.Info.Level
            && loyaltyLevels[level].minSalesSum <= pmcData.TraderStandings[traderID].currentSalesSum
            && loyaltyLevels[level].minStanding <= pmcData.TraderStandings[traderID].currentStanding)
            && targetLevel < 4) {
                // level reached
                targetLevel++;
            }
        }
        
        // set level
        pmcData.TraderStandings[traderID].currentLevel = targetLevel;
        this.traders[traderID].loyalty.currentLevel = targetLevel;
    }

    resetTrader(sessionID, traderID) {
        let account = account_f.accountServer.find(sessionID);
        let pmcData = profile_f.profileServer.getPmcProfile(sessionID); 
        let traderWipe = json.parse(json.read(db.profile[account.edition]["trader_" + pmcData.Info.Side.toLowerCase()]));
    
        pmcData.TraderStandings[traderID] = {
            "currentLevel": 1,
            "currentSalesSum": traderWipe.initialSalesSum,
            "currentStanding": traderWipe.initialStanding,
            "NextLoyalty": null,
            "loyaltyLevels": this.traders[traderID].loyalty.loyaltyLevels,
            "display": this.traders[traderID].display
        };

        this.lvlUp(traderID, sessionID);
    }

    getAssort(sessionID, traderID) {
        if (!(traderID in this.assorts)) {
            if (traderID === "579dc571d53a0658a154fbec") {
                logger.logWarning("generating fence");
                this.generateFenceAssort();
            } else {
                this.assorts[traderID] = (json.parse(json.read(db.user.cache["assort_" + traderID]))).data;
            }
        }
        
        // 1 is min level, 4 is max level
        let base = this.assorts[traderID];
        let questassort = json.parse(json.read(db.assort[traderID].questassort));
        let pmcData = profile_f.profileServer.getPmcProfile(sessionID);

        if (traderID !== "ragfair") {
            let level = this.traders[traderID].loyalty.currentLevel;

            for (let i = 1; i < 4; i++) {
                for (let key in base.loyal_level_items) {
                    if (base.loyal_level_items[key] > level) {
                        base = this.removeItemFromAssort(base, key);
                    }

                    if (key in questassort.started && questassort.getQuestStatus(pmcData, questassort.started[key]) !== "Started") {
                        base = this.removeItemFromAssort(base, key);
                    }

                    if (key in questassort.success && questassort.getQuestStatus(pmcData, questassort.success[key]) !== "Success") {
                        base = this.removeItemFromAssort(base, key);
                    }

                    if (key in questassort.fail && questassort.getQuestStatus(pmcData, questassort.fail[key]) !== "Fail") {
                        base = this.removeItemFromAssort(base, key);
                    }
                }
            }
        }

        return base;
    }

    generateFenceAssort() {
        let base = json.parse(json.read("db/cache/assort.json"));
        let names = Object.keys(db.assort["579dc571d53a0658a154fbec"].loyal_level_items);
        let added = [];

        for (let i = 0; i < gameplayConfig.trading.fenceAssortSize; i++) {
            let traderID = names[utility.getRandomInt(0, names.length - 1)];

            if (added.includes(traderID)) {
                i--;
                continue;
            }

            added.push(traderID);
            base.data.items.push(json.parse(json.read(db.assort["579dc571d53a0658a154fbec"].items[traderID])));
            base.data.barter_scheme[traderID] = json.parse(json.read(db.assort["579dc571d53a0658a154fbec"].barter_scheme[traderID]));
            base.data.loyal_level_items[traderID] = json.parse(json.read(db.assort["579dc571d53a0658a154fbec"].loyal_level_items[traderID]));
        }

        this.assorts['579dc571d53a0658a154fbec'] = base.data;
    }

    // delete assort keys
    removeItemFromAssort(assort, itemID) {
        let ids_toremove = itm_hf.findAndReturnChildrenByItems(assort.items, itemID);

        delete assort.barter_scheme[itemID];
        delete assort.loyal_level_items[itemID];

        for (let i in ids_toremove) {
            for (let a in assort.items) {
                if (assort.items[a]._id === ids_toremove[i]) {
                    assort.items.splice(a, 1);
                }
            }
        }

        return assort;
    }

    getCustomization(traderID, sessionID) {
        let pmcData = profile_f.profileServer.getPmcProfile(sessionID);
        let allSuits = customization_f.getCustomization();
        let suitArray = json.parse(json.read(db.user.cache["customization_" + traderID]));
        let suitList = [];

        for (let suit of suitArray) {
            if (suit.suiteId in allSuits) {
                for (var i = 0; i < allSuits[suit.suiteId]._props.Side.length; i++) {
                    let side = allSuits[suit.suiteId]._props.Side[i];

                    if (side === pmcData.Info.Side) {
                     suitList.push(suit);
                    }
                }
            }
        }
        
        return suitList;
    }

    getAllCustomization(sessionID) {
        let output = [];
        
		for (let traderID in this.traders) {
			if(db.user.cache["customization_" + traderID] !== undefined) {
				output = output.concat(this.getCustomization(traderID, sessionID));
			}
        }

        return output;
    }

    getPurchasesData(traderID, sessionID) {
        let pmcData = profile_f.profileServer.getPmcProfile(sessionID);
        let trader = this.traders[traderID];
        let currency = itm_hf.getCurrency(trader.currency);
        let output = {};

        // get sellable items
        for (let item of pmcData.Inventory.items) {
            let price = 0;

            if (item._id === pmcData.Inventory.equipment
            || item._id === pmcData.Inventory.stash
            || item._id === pmcData.Inventory.questRaidItems
            || item._id === pmcData.Inventory.questStashItems
            || itm_hf.isNotSellable(item._tpl) 
            || traderFilter(trader.sell_category, item._tpl) === false) {
                continue;
            }
    
            // find all child of the item and sum the price 
            for (let childItemId of itm_hf.findAndReturnChildren(pmcData, item._id)) {
                let childitem = itm_hf.findInventoryItemById(pmcData, childItemId);
                
                if (childitem === false) {
                    // root item
                    let count = ("upd" in item && "StackObjectsCount" in item.upd) ? childitem.upd.StackObjectsCount : 1;
                    price = ((items.data[item._tpl]._props.CreditsPrice >= 1) ? items.data[item._tpl]._props.CreditsPrice : 1) * count;
                } else {
                    // child item
                    let tempPrice = (items.data[childitem._tpl]._props.CreditsPrice >= 1) ? items.data[childitem._tpl]._props.CreditsPrice : 1;
                    let count = ("upd" in childitem && "StackObjectsCount" in childitem.upd) ? childitem.upd.StackObjectsCount : 1;
                    price = price + (tempPrice * count);
                }
            }
    
            // dogtag calculation
            if ("upd" in item && "Dogtag" in item.upd && itm_hf.isDogtag(item._tpl)) {
                price *= item.upd.Dogtag.Level;
            }
    
            // meds calculation
            let hpresource = ("upd" in item && "Medkit" in item.upd) ? item.upd.MedKit.HpResource : 0;  
    
            if (hpresource > 0) {
                let maxHp = itm_hf.getItem(item._tpl)[1]._props.MaxHpResource;
                price *= (hpresourc / maxHp);
            }
    
            // weapons and armor calculation
            let repairable = ("upd" in item && "Repairable" in item.upd) ? item.upd.Repairable : 1;
    
            if (repairable !== 1 ) {
                price *= (repairable.Durability / repairable.MaxDurability)
            }
    
            // get real price
            if(trader.discount > 0 ) { price = (trader.discount / 100) * price }
            price = itm_hf.fromRUB(price, currency);
            price = (price > 0 && price !== "NaN") ? price : 1;
            
            output[item._id] = [[{"_tpl": currency, "count": price.toFixed(0)}]];
        }
    
        return output;
    }
}

/*
check if an item is allowed to be sold to a trader
input : array of allowed categories, itemTpl of inventory
output : boolean
*/
function traderFilter(traderFilters, tplToCheck) {

    for (let filter of traderFilters){
        for (let iaaaaa of itm_hf.templatesWithParent(filter)){
            if (iaaaaa == tplToCheck){
                return true;
            }
        }
        
        for (let subcateg of itm_hf.childrenCategories(filter)) {
            for (let itemFromSubcateg of itm_hf.templatesWithParent(subcateg)) {
                if (itemFromSubcateg === tplToCheck) {
                    return true;
                }
            }
        }
    }

    return false;
}

module.exports.traderServer = new TraderServer();