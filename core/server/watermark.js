"use strict";

function show() {
    let text_1 = "EmuTarkov " + server.version;
    let text_2 = "https://www.discord.gg/jv7X8wC";
    let diffrence = Math.abs(text_1.length - text_2.length);
    let whichIsLonger = ((text_1.length >= text_2.length) ? text_1.length : text_2.length);
    let box_spacing_between_1 = "";
    let box_spacing_between_2 = "";
    let box_width = "";

    /* calculate space */
    if (text_1.length >= text_2.length) {
        for (let i = 0; i < diffrence; i++) {
            box_spacing_between_2 += " ";
        }
    } else {
        for (let i = 0; i < diffrence; i++) {
            box_spacing_between_1 += " ";
        }
    }

    for (let i = 0; i < whichIsLonger; i++) {
        box_width += "═";
    }

    /* reset cursor to begin */
    process.stdout.write('\u001B[2J\u001B[0;0f');

    /* show watermark */
    logger.logRequest("╔═" + box_width + "═╗");
    logger.logRequest("║ " + text_1 + box_spacing_between_1 + " ║");
    logger.logRequest("║ " + text_2 + box_spacing_between_2 + " ║");
    logger.logRequest("╚═" + box_width + "═╝");

    /* set window name */
    process.title = text_1;
}

module.exports.show = show;
