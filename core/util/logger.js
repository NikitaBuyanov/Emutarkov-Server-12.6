"use strict";

const fs = require('fs');
const util = require('util');

// colorData[0] -> front, colorData[1] -> back
const colorData = [
    {
        black: "\x1b[30m",
        red: "\x1b[31m",
        green: "\x1b[32m",
        yellow: "\x1b[33m",
        blue: "\x1b[34m",
        magenta: "\x1b[35m",
        cyan: "\x1b[36m",
        white: "\x1b[37m"
    },
    {
        black: "\x1b[40m",
        red: "\x1b[41m",
        green: "\x1b[42m",
        yellow: "\x1b[43m",
        blue: "\x1b[44m",
        magenta: "\x1b[45m",
        cyan: "\x1b[46m",
        white: "\x1b[47m"
    }
];

class Logger {
    constructor() {
        let file = utility.getDate() + "_" + utility.getTime() + ".log";
        let folder = "user/logs/";
        let filepath = folder +file;

        // create log folder
        if (!fs.existsSync(folder)) { +
            fs.mkdirSync(folder);
        }

        // create log file
        if (!fs.existsSync(filepath)) {
            fs.writeFileSync(filepath);
        }

        this.fileStream = fs.createWriteStream(filepath, {flags: 'w'});
    }

    log(data, colorFront = "", colorBack = "") {
        let setColors = "";
        let colors = ["", ""];

        if (colorFront !== "") {
            colors[0] = colorFront;
        }

        if (colorBack !== "") {
            colors[1] = colorBack;
        }

        // properly set colorString indicator
        for (let i = 0; i < colors.length; i++) {
            if (colors[i] !== "") {
                setColors += colorData[i][colors[i]];
            }
        }

        // print data
        if (colors[0] !== "" || colors[1] !== "") {
            console.log(setColors + data + "\x1b[0m");
        } else {
            console.log(data);
        }

        // write the logged data to the file
        this.fileStream.write(util.format(data) + '\n');
    }

    logError(text) {
        this.log("[ERROR] " + text, "white", "red");
    }

    logWarning(text) {
        this.log("[WARNING] " + text, "white", "yellow");
    }

    logSuccess(text) {
        this.log("[SUCCESS] " + text, "white", "green");
    }

    logInfo(text) {
        this.log("[INFO] " + text, "cyan", "black");
    }

    logRequest(text) {
        this.log(text, "cyan", "black");
    }

    logData(data) {
        this.log(data);
    }
}

module.exports.logger = new Logger();
