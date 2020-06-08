"use strict";

function getLocale(url, info, sessionID) {
    return locale_f.getLanguages();
}

function getMenuLocale(url, info, sessionID) {
    return locale_f.getMenu(url.replace("/client/menu/locale/", ''));
}

function getGlobalLocale(url, info, sessionID) {
    return locale_f.getGlobal(url.replace("/client/locale/", ''));
}

router.addStaticRoute("/client/languages", getLocale);
router.addDynamicRoute("/client/menu/locale/", getMenuLocale);
router.addDynamicRoute("/client/locale/", getGlobalLocale);