"use strict";

const fs = require("fs");
const json = require("./json.js");

const inputDir = "input/maps/";
const outputDir = "output/locations/";
const questLootTypes = [
  "quest",
  "giroscope",
  "controller",
  "case_0060",
  "loot_letter",
  "blood_probe",
  "loot_letter",
  "009_2_doc",
  "010_4_flash",
  "009_1_nout",
  "008_5_key",
  "010_5_drive",
  "loot 56(28)",
  "loot_case",
  "SAS",
  "chem_container",
  "huntsman_001_message2284354",
  "loot_shop_goshan_vedodmost5861492",
  "loot_shop_oli_vedodmost5860728",
  "loot_shop_idea_vedodmost5868202",
  "loot_shop_oli_vedodmost_part25862028",
  "loot_book_venskiy5864616",
  "loot_book_osnovu5868064",
  "Loot 56 (28)6937524",
  "loot_flash_"
];

function getDirList(path) {
  return fs.readdirSync(path).filter(function(file) {
    return fs.statSync(path + "/" + file).isDirectory();
  });
}

function getMapName(mapName) {
  if (mapName.includes("bigmap")) {
    return "bigmap";
  } else if (mapName.includes("develop")) {
    return "develop";
  } else if (mapName.includes("factory4_day")) {
    return "factory4_day";
  } else if (mapName.includes("factory4_night")) {
    return "factory4_night";
  } else if (mapName.includes("interchange")) {
    return "interchange";
  } else if (mapName.includes("laboratory")) {
    return "laboratory";
  } else if (mapName.includes("rezervbase")) {
    return "rezervbase";
  } else if (mapName.includes("shoreline")) {
    return "shoreline";
  } else if (mapName.includes("woods")) {
    return "woods";
  } else if (mapName.includes("hideout")) {
    return "hideout";
  } else {
    // ERROR
    return "";
  }
}

function getMapLoot() {
  let inputFiles = fs.readdirSync(inputDir + "all/");
  let i = 0;

  for (let file of inputFiles) {
    let filePath = inputDir + "all/" + file;
    let fileName = file.replace(".json", "");
    let fileData = json.parse(json.read(filePath));
    let mapName = getMapName(fileName.toLowerCase());

    console.log("Splitting: " + filePath);
    let node = ("Location" in fileData) ? fileData.Location.Loot : fileData.Loot;

    for (let item in node) {
      let savePath = outputDir + mapName + "/loot/" + i++ + ".json";
      console.log("Loot." + fileName + ": " + item);
      json.write(savePath, node[item]);
    }
  }
}

function stripMapLootDuplicates() {
  for (let mapName of getDirList(outputDir)) {
    let dirName = outputDir + mapName + "/loot/";

    if (!fs.existsSync(dirName)) {
      continue;
    }

    let inputFiles = fs.readdirSync(dirName);
    let mapLoot = {};
    let emptyLoot = {};
    let multipleLoot = {};
    let questLoot = {};
    let mapkeys = {};

    console.log("Checking " + mapName);

    // get all map keys
    for (let file of fs.readdirSync(inputDir + "source/")) {
      let filePath = inputDir + "source/" + file;
      let fileName = file.replace(".json", "");
      let fileData = json.parse(json.read(filePath));
      let map = getMapName(fileName.toLowerCase());
  
      if (map === mapName) {
        let node = ("Location" in fileData) ? fileData.Location.Loot : fileData.Loot;

        for (let item in node) {
          mapkeys[node[item].Id] = true;
        }
      }
    }

    // get all items
    for (let file of inputFiles) {
      let filePath = dirName + file;
      let fileName = file.replace(".json", "");
      let fileData = json.parse(json.read(filePath));

      mapLoot[fileName] = json.stringify(fileData.Items);

      // check empty containers separately
      if (fileData.Items.length === 1) {
        emptyLoot[fileName] = fileData.Id;
      }

      // check multiple tpl
      if (fileData.Items.length > 1) {
        let tmp = [];

        for (let item of fileData.Items) {
          tmp.push(item._tpl);
        }

        tmp.splice(0, 1);
        multipleLoot[fileName] = json.stringify(tmp);
      }

      // check quest items separately
      for (let type of questLootTypes) {
        if (fileData.Id.includes(type)) {
          questLoot[fileName] = json.stringify(fileData.Position);	
        }
      }
    }

    // check for items to remove
    for (let loot in mapLoot) {
      let data = json.parse(json.read(dirName + loot + ".json"));
      
      // if key doesn't exist
      if (!(data.Id in mapkeys) && (data.IsStatic === true || loot in questLoot)) {
        let target = dirName + loot + ".json";

        console.log(mapName + ".duplicate: " + loot + ", " + data.Id);
        fs.unlinkSync(target);
        delete mapLoot[loot];

        if (loot in emptyLoot) {
          delete emptyLoot[loot];
        }

        if (loot in multipleLoot) {
          delete multipleLoot[loot];
        }

        if (loot in questLoot) {	
          delete questLoot[loot];	
        }

        continue;
      }

      for (let file in mapLoot) {
        if (!(loot) in mapLoot) {
          continue;
        }

        // don't check the same file
        if (loot === file) {
          continue;
        }

        // loot already exists
        if (mapLoot[loot] === mapLoot[file]
        || (loot in emptyLoot && file in emptyLoot && emptyLoot[loot] === emptyLoot[file])
        || (loot in multipleLoot && file in multipleLoot && multipleLoot[loot] === multipleLoot[file])
        || (loot in questLoot && file in questLoot && questLoot[loot] === questLoot[file])) {
          let target = dirName + file + ".json";

          console.log(mapName + ".duplicate: " + loot + ", " + file);
          fs.unlinkSync(target);
          delete mapLoot[file];

          if (file in emptyLoot) {
            delete emptyLoot[file];
          }

          if (file in multipleLoot) {
            delete multipleLoot[file];
          }

          if (file in questLoot) {	
            delete questLoot[file];	
          }
        }
      }
    }
  }
}

function renameMapLoot() {
  for (let mapName of getDirList(outputDir)) {
    let dirName = outputDir + mapName + "/loot/";

    if (!fs.existsSync(dirName)) {
      continue;
    }

    let inputFiles = fs.readdirSync(dirName);

    console.log("Renaming " + mapName);

    for (let file in inputFiles) {
      let filePath = dirName + inputFiles[file];
      let fileData = json.parse(json.read(filePath));
      let target = "";

      // set target directory
      if (fileData.IsStatic) {
        target = dirName + "static/" + fileData.Id + "/" + "loot_" + file + ".json";
      } else {
        let found = false;

        for (let type of questLootTypes) {
          if (fileData.Id.includes(type)) {
            target = dirName + "forced/" + fileData.Id + "/" + "loot_" + file + ".json";
            found = true;
            break;
          }
        }

        if (!found) {
          target = dirName + "dynamic/" + fileData.Id + "/" + "loot_" + file + ".json";
        }
      }

      // create missing dir
      let checkPath = target.substr(0, target.lastIndexOf('/'));

      if (!fs.existsSync(checkPath)) {
          fs.mkdirSync(checkPath, { recursive: true });
      }

      // move files
      fs.renameSync(dirName + inputFiles[file], target);
    }
  }
}

function getMapLootCount() {
  let inputFiles = fs.readdirSync(inputDir + "all/");

  for (let file of inputFiles) {
    let filePath = inputDir + "all/" + file;
    let fileName = file.replace(".json", "");
    let fileData = json.parse(json.read(filePath));
    let mapName = getMapName(fileName.toLowerCase());
    let count = typeof fileData["Location"] === "undefined" ? fileData.Loot.length : fileData.Location.Loot.length;
    
    console.log(mapName + ".count: " + count);
  }
}

function getMapEntries() {
  let inputFiles = fs.readdirSync(inputDir + "all/");
  let i = 0;

  for (let file of inputFiles) {
    let filePath = inputDir + "all/" + file;
    let fileName = file.replace(".json", "");
    let fileData = json.parse(json.read(filePath));
    let mapName = getMapName(fileName.toLowerCase());

    console.log("Splitting: " + filePath);
    let node = ("Location" in fileData) ? fileData.Location.SpawnAreas : fileData.SpawnAreas;

    for (let item in node) {
      let savePath = outputDir + mapName + "/entries/" + i++ + ".json";
      console.log("entry." + fileName + ": " + item);
      json.write(savePath, node[item]);
    }
  }
}

function stripMapEntryDuplicates() {
  for (let mapName of getDirList(outputDir)) {
    let dirName = outputDir + mapName + "/entries/";

    if (!fs.existsSync(dirName)) {
      continue;
    }

    let inputFiles = fs.readdirSync(dirName);
    let mapkeys = {};

    console.log("Checking " + mapName);

    // get all items
    for (let file of inputFiles) {
      let filePath = dirName + file;
      let fileData = json.parse(json.read(filePath));

      if (fileData.Id in mapkeys) {
        console.log(mapName + ".duplicate: " + fileData.Id + ", " + file);
        fs.unlinkSync(filePath);
      } else {
        mapkeys[fileData.Id] = true;
      }
    }
  }
}

function renameMapEntries() {
  for (let mapName of getDirList(outputDir)) {
    let dirName = outputDir + mapName + "/entries/";

    if (!fs.existsSync(dirName)) {
      continue;
    }
    
    let inputFiles = fs.readdirSync(dirName);

    console.log("Renaming " + mapName);

    for (let file in inputFiles) {
      fs.renameSync(dirName + inputFiles[file], dirName + "infill_" + file + ".json");
    }
  }
}

function maploot() {
  getMapLoot();
  stripMapLootDuplicates();
  renameMapLoot();
  getMapLootCount();
}

function mapentries() {
  getMapEntries();
  stripMapEntryDuplicates();
  renameMapEntries();
}

maploot();
mapentries();