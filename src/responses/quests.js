"use strict";

router.addStaticRoute("/client/quest/list", quest_f.getQuestsCache);
item_f.itemServer.addRoute("QuestAccept", quest_f.acceptQuest);
item_f.itemServer.addRoute("QuestComplete", quest_f.completeQuest);
item_f.itemServer.addRoute("QuestHandover", quest_f.handoverQuest);