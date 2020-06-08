"use strict";

const fs = require('fs');
const path = require("path")
const json = require('./json.js');

const itemsBundlesPath = "D:/tarkov/EFT2/EscapeFromTarkov_Data/StreamingAssets/Windows/assets/content/items";
const itemsJSONPath = "D:/tarkov/Server/user/cache/items.json";

function Start() {

    getAllFiles(itemsBundlesPath)

}

function getAllFiles(dirPath, arrayOfFiles) 
{
    let itemsJSON = json.parse( json.read(itemsJSONPath) );
    let files = fs.readdirSync(dirPath)

    arrayOfFiles = arrayOfFiles || []

    for(let file of files) 
    {
        if (fs.statSync(dirPath + "/" + file).isDirectory()) 
        {
            arrayOfFiles = getAllFiles(dirPath + "/" + file, arrayOfFiles)
        } 
        else
        {
            if( file.search(".manifest") == -1 && file.search("_texture") == -1 && file.search(".bundle") != -1)
            {
                let found = false 
                for(let item in itemsJSON.data)
                {   
                    if(itemsJSON.data[item]._props.Prefab !== undefined && itemsJSON.data[item]._props.Prefab.path != "" )
                    {
                        let pathInJson = itemsJSON.data[item]._props.Prefab.path;
                        if(pathInJson.search(file) != -1)
                        {   
                            found = true;
                            break;
                        }

                    }   
                   
                }

                if (found == false)
                {
                    console.log(dirPath +"/"+file)
                    //console.log(dirPath + "/" + file);
                }
            }
            
        }
    }

    //console.log(arrayOfFiles);
} 


Start();