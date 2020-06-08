"use strict";

let areas = undefined;
let production = undefined;
let scavcase = undefined;

function initialize() {
	areas = json.parse(json.read(db.user.cache.hideout_areas));
	production = json.parse(json.read(db.user.cache.hideout_production));
	scavcase = json.parse(json.read(db.user.cache.hideout_scavcase));
}

function upgrade(pmcData, body, sessionID) {
	for (let itemToPay of body.items) {
		for (let inventoryItem in pmcData.Inventory.items) {
			if (pmcData.Inventory.items[inventoryItem]._id !== itemToPay.id) {
				continue;
			}

			// if it's not money, its construction / barter items
			if (pmcData.Inventory.items[inventoryItem]._tpl === "5449016a4bdc2d6f028b456f") {
				pmcData.Inventory.items[inventoryItem].upd.StackObjectsCount -= itemToPay.count;
			} else {	
				move_f.removeItem(pmcData, pmcData.Inventory.items[inventoryItem]._id, item_f.itemServer.getOutput(), sessionID);
			}	
		}
	}

	// time construction management
	for (let hideoutArea in pmcData.Hideout.Areas) {
		if (pmcData.Hideout.Areas[hideoutArea].type !== body.areaType) {
			continue;
		}

		for (let hideout_stage in areas.data) {	
			if (areas.data[hideout_stage].type === body.areaType) {
				let ctime = areas.data[hideout_stage].stages[pmcData.Hideout.Areas[hideoutArea].level + 1].constructionTime;
			
				if (ctime > 0) {	
					let timestamp = Math.floor(Date.now() / 1000);

					pmcData.Hideout.Areas[hideoutArea].completeTime = timestamp + ctime;
					pmcData.Hideout.Areas[hideoutArea].constructing = true;
				}
			}
		}
	}
	
	return item_f.itemServer.getOutput();
}

// validating the upgrade
function upgradeComplete(pmcData, body, sessionID) {
	for (let hideoutArea in pmcData.Hideout.Areas) {
		if (pmcData.Hideout.Areas[hideoutArea].type !== body.areaType) {
			continue;
		}

		// upgrade area
		pmcData.Hideout.Areas[hideoutArea].level++;	
		pmcData.Hideout.Areas[hideoutArea].completeTime = 0;
		pmcData.Hideout.Areas[hideoutArea].constructing = false;
		
		//go to apply bonuses
		for (let area_bonus of areas.data) {
			if (area_bonus.type !== pmcData.Hideout.Areas[hideoutArea].type) {
				continue;
			}

			let bonuses = area_bonus.stages[pmcData.Hideout.Areas[hideoutArea].level].bonuses;

			if (bonuses.length > 0) {
				for (let bonus of bonuses) {
					applyPlayerUpgradesBonuses(pmcData, bonus);
				}
			}
		}
	}

	return item_f.itemServer.getOutput();
}

// move items from hideout
function putItemsInAreaSlots(pmcData, body, sessionID) {
	let output = item_f.itemServer.getOutput();

	for (let itemToMove in body.items) {
		for (let inventoryItem of pmcData.Inventory.items) {
			if (body.items[itemToMove].id !== inventoryItem._id) {
				continue;
			}

			for (let area of pmcData.Hideout.Areas) {
				if (area.type !== body.areaType) {
					continue;
				}

				let slot_position = parseInt(itemToMove);
				let slot_to_add = {
					"item": [
						{
							"_id": inventoryItem._id,
							"_tpl": inventoryItem._tpl,
							"upd": inventoryItem.upd
						}
					]
				}
				
				if (!(slot_position in area.slots)) {
					area.slots.push(slot_to_add);
				} else {
					area.slots.splice(slot_position, 1, slot_to_add);
				}

				output = move_f.removeItem(pmcData, inventoryItem._id, output, sessionID);
			}
		}
	}

	return output;
}

function takeItemsFromAreaSlots(pmcData, body, sessionID) {
	let output = item_f.itemServer.getOutput();

	for (let area of pmcData.Hideout.Areas) {
		if (area.type !== body.areaType) {
			continue;
		}

		if (area.type === 4) {	
			let itemToMove = area.slots[body.slots[0]].item[0];
			let newReq = {
				"item_id": itemToMove._tpl,
				"count": 1,
				"tid": "ragfair"
			};

			output = move_f.addItem(pmcData, newReq, output, sessionID);
			pmcData = profile_f.profileServer.getPmcProfile(sessionID);
			output.items.new[0].upd = itemToMove.upd;

			for (let item of pmcData.Inventory.items) {
				if (item._id == output.items.new[0]._id) {
					item.upd = itemToMove.upd;
				}
			}

			area.slots[body.slots[0]] = {"item" : null};			
		} else {
			let newReq = {
				"item_id": area.slots[0].item[0]._tpl,
				"count": 1,
				"tid": "ragfair"
			};
			
			output = move_f.addItem(pmcData, newReq, output, sessionID);
			pmcData = profile_f.profileServer.getPmcProfile(sessionID);
			area.slots.splice(0, 1);
		}
	}

	return output;
}

function toggleArea(pmcData, body, sessionID) {
	for (let area in pmcData.Hideout.Areas) {
		if (pmcData.Hideout.Areas[area].type == body.areaType) {	
			pmcData.Hideout.Areas[area].active = body.enabled;
		}
	}
		
	return item_f.itemServer.getOutput();
}

function singleProductionStart(pmcData, body, sessionID) {
	registerProduction(pmcData, body, sessionID);

	let output = item_f.itemServer.getOutput();

	for (let itemToDelete of body.items) {
		output = move_f.removeItem(pmcData, itemToDelete.id, output, sessionID);
	}

	return output;
}

function scavCaseProductionStart(pmcData, body, sessionID) {
	for (let moneyToEdit of body.items) {
		for (let inventoryItem in pmcData.Inventory.items) {
			if (pmcData.Inventory.items[inventoryItem]._id === moneyToEdit.id) {
				pmcData.Inventory.items[inventoryItem].upd.StackObjectsCount -= moneyToEdit.count;
			}
		}
	}

	let scavcase = json.parse(json.read(db.user.cache.hideout_scavcase));

	for (let receipe in scavcase.data) {	
		if (body.recipeId == scavcase.data[receipe]._id) {
			let rarityItemCounter = {};
			let products = [];

			for (let rarity in scavcase.data[receipe].EndProducts) {
				if (scavcase.data[receipe].EndProducts[rarity].max > 0) {
					rarityItemCounter[rarity] = scavcase.data[receipe].EndProducts[rarity].max;
				}
			}
			
			for (let rarityType in rarityItemCounter) {
				while (rarityItemCounter[rarityType] !== 0) {	
					let random = utility.getRandomIntEx(Object.keys(items.data).length)
					let randomKey = Object.keys(items.data)[random];
					let tempItem = items.data[randomKey];
					
					// products are not registered correctly
					if (tempItem._props.Rarity === rarityType) {
						products.push({ 
							"_id" : utility.generateNewItemId(),
							"_tpl": tempItem._id
						});

						rarityItemCounter[rarityType] -= 1;
					}
				}
			}

			pmcData.Hideout.Production["14"] = { 
				"Progress": 0,
				"inProgress": true,
           		"RecipeId": body.recipeId,
        		"Products": products,
        		"StartTime":  Math.floor(Date.now() / 1000)
        	};
		}
	}

	return item_f.itemServer.getOutput();
}

function continuousProductionStart(pmcData, body, sessionID) {
	registerProduction(pmcData, body, sessionID);
	return item_f.itemServer.getOutput();
}

function getBTC(pmcData, body, sessionID) {
	let output = item_f.itemServer.getOutput();

	let newBTC = {
		"item_id": "59faff1d86f7746c51718c9c",
		"count": 1,
		"tid": "ragfair"
	};

	for (let bitcoin in pmcData.Hideout.Production["20"].Products) {
		output = move_f.addItem(pmcData, newBTC, output, sessionID, true);
	}

	pmcData.Hideout.Production["20"].Products = [];
	return output;
}

function takeProduction(pmcData, body, sessionID) {
	let output = item_f.itemServer.getOutput();

	if (body.recipeId === "5d5c205bd582a50d042a3c0e") {
		return getBTC(pmcData, body, sessionID);
	}

	for (let receipe in production.data) {	
		if (body.recipeId !== production.data[receipe]._id) {
			continue;
		}

		// delete the production in profile Hideout.Production
		for (let prod in pmcData.Hideout.Production) {
			if (pmcData.Hideout.Production[prod].RecipeId === body.recipeId) {
				delete pmcData.Hideout.Production[prod];
			}
		}

		// create item and throw it into profile
		let id = production.data[receipe].endProduct;
		
		// replace the base item with its main preset
        if (preset_f.itemPresets.hasPreset(id)) {
            id = preset_f.itemPresets.getStandardPreset(id)._id;
        }
		
		let newReq = {
			"item_id": id,
			"count": production.data[receipe].count,
			"tid": "ragfair"
		};
		
		return move_f.addItem(pmcData, newReq, output, sessionID, true);	
	}

	for (let receipe in scavcase.data) {
		if (body.recipeId !== scavcase.data[receipe]._id) {
			continue;
		}

		for (let prod in pmcData.Hideout.Production) {
			if (pmcData.Hideout.Production[prod].RecipeId !== body.recipeId) {
				continue;
			}

			// give items BEFORE deleting the production
			for (let itemProd of pmcData.Hideout.Production[prod].Products) {
				pmcData = profile_f.profileServer.getPmcProfile(sessionID);

				let newReq = {
					"item_id": itemProd._tpl,
					"count": 1,
					"tid": "ragfair"
				};

				output = move_f.addItem(pmcData, newReq, output, sessionID, true);
			}

			delete pmcData.Hideout.Production[prod];
			return output;
		}
	}

	return "";
}

function registerProduction(pmcData, body, sessionID) {
	for (let receipe in production.data) {
		if (body.recipeId === production.data[receipe]._id) {	
			pmcData.Hideout.Production[production.data[receipe].areaType] = { 
				"Progress": 0,
				"inProgress": true,
				"RecipeId": body.recipeId,
				"Products": [],
				"SkipTime": 0,
				"StartTime": Math.floor(Date.now() / 1000)
			};
		}
	}
}

// BALIST0N, I got bad news for you
// we do need to implement these after all
// ...
// with that I mean manual implementation
// RIP, GL whoever is going to do this
function applyPlayerUpgradesBonuses(pmcData, bonus) {
	switch (bonus.type) 
	{
		case "StashSize":

			for(let item in pmcData.Inventory.items )
			{
				if(pmcData.Inventory.items[item]._id == pmcData.Inventory.stash)
				{
					pmcData.Inventory.items[item]._tpl = bonus.templateId;
				}
			}
			break;

		case "MaximumEnergyReserve":
			pmcData.Health.Energy.Maximum = 110;
			break;

		case "EnergyRegeneration":
			break;

		case "HydrationRegeneration":
			break;

		case "HealthRegeneration":
			break;

		case "DebuffEndDelay":
			break;

		case "ScavCooldownTimer":
			break;

		case "QuestMoneyReward":
			break;

		case "InsuranceReturnTime":
			break;

		case "ExperienceRate":
			break;

		case "SkillGroupLevelingBoost":
			break;

		case "RagfairCommission":
			break;

		case "AdditionalSlots":
			break;

		case "UnlockWeaponModification":
			break;
		
		case "TextBonus":
			break;

		case "FuelConsumption":
			break;
	}

	pmcData.Bonuses.push(bonus);
}

module.exports.initialize = initialize;
module.exports.upgrade = upgrade;
module.exports.upgradeComplete = upgradeComplete;
module.exports.putItemsInAreaSlots = putItemsInAreaSlots;
module.exports.takeItemsFromAreaSlots = takeItemsFromAreaSlots;
module.exports.toggleArea = toggleArea;
module.exports.singleProductionStart  = singleProductionStart;
module.exports.continuousProductionStart = continuousProductionStart;
module.exports.scavCaseProductionStart = scavCaseProductionStart;
module.exports.takeProduction = takeProduction;
