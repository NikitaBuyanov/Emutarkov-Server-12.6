"use strict";

item_f.itemServer.addRoute("Move", move_f.moveItem);
item_f.itemServer.addRoute("Remove", move_f.discardItem);
item_f.itemServer.addRoute("Split", move_f.splitItem);
item_f.itemServer.addRoute("Merge", move_f.mergeItem);
item_f.itemServer.addRoute("Transfer", move_f.transferItem);
item_f.itemServer.addRoute("Swap", move_f.swapItem);