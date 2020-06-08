"use strict";

function getLanguages() {
    return json.read(db.user.cache.languages);
}

function getMenu(lang = "en") {
    return json.read(db.locales[lang.toLowerCase()].menu);
}

function getGlobal(lang = "en") {
    return json.read(db.user.cache["locale_" + lang.toLowerCase()]);
}

module.exports.getLanguages = getLanguages;
module.exports.getMenu = getMenu;
module.exports.getGlobal = getGlobal;