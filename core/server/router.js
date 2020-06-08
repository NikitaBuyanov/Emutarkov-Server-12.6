"use strict";

class Router {
    constructor() {
        this.staticRoutes = {};
        this.dynamicRoutes = {};
    }

    /* sets static routes to check for */
    addStaticRoute(route, callback) {
        this.staticRoutes[route] = callback;
    }

    /* sets dynamic routes to check for */
    addDynamicRoute(route, callback) {
        this.dynamicRoutes[route] = callback;
    }

    getResponse(req, body, sessionID) {
        let output = "";
        let url = req.url;
        let info = {};
    
        /* parse body */
        if (body !== "") {
            info = json.parse(body);
        }
    
        /* remove retry from URL */
        if (url.includes("?retry=")) {
            url = url.split("?retry=")[0];
        }
        
        /* route request */
        if (url in this.staticRoutes) {
            output = this.staticRoutes[url](url, info, sessionID);
        } else {
            for (let key in this.dynamicRoutes) {
                if (url.includes(key)) {
                    output = this.dynamicRoutes[key](url, info, sessionID);
                }
            }
        }
    
        /* load files from game cache */
        if ("crc" in info) {
            let crctest = json.parse(output);
            
            if ("data" in crctest) {
                crctest.crc = utility.adlerGen(json.stringify(crctest.data));

                if (info.crc === crctest.crc) {
                    logger.logWarning("[CRC match]: loading from game cache files");
                    output = '{"err": 0, "errmsg": null, "data": null}';
                } else {
                    output = json.stringify(crctest);
                }
            }
        }
    
        return output;
    }
}

module.exports.router = new Router();
