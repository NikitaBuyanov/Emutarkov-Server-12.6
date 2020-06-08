/* launcher.js
 * contains responses for launcher requests
 * dependencies: EmuTarkov-Launcher
 */

"use strict";

function connect() {
    return json.stringify({
        "backendUrl": server.getBackendUrl(),
        "name": server.getName(),
        "editions": Object.keys(db.profile)
    });
}

function login(url, info, sessionID) {
    let output = account_f.accountServer.login(info);
    return (output === "") ? "FAILED" : output;
}

function register(url, info, sessionID) {
    let output = account_f.accountServer.register(info);
    return (output !== "") ? "FAILED" : "OK";
}

function remove(url, info, sessionID) {
    let output = account_f.accountServer.remove(info);
    return (output === "") ? "FAILED" : "OK";
}

function get(url, info, sessionID) {
    let accountId = account_f.accountServer.login(info);
    let output = account_f.accountServer.find(accountId);
    return json.stringify(output);
}

function changeEmail(url, info, sessionID) {
    let output = account_f.accountServer.changeEmail(info);
    return (output === "") ? "FAILED" : "OK";
}

function changePassword(url, info, sessionID) {
    let output = account_f.accountServer.changePassword(info);
    return (output === "") ? "FAILED" : "OK";
}

function wipe(url, info, sessionID) {
    let output = account_f.accountServer.wipe(info);
    return (output === "") ? "FAILED" : "OK";
}

router.addStaticRoute("/launcher/server/connect", connect);
router.addStaticRoute("/launcher/profile/login", login);
router.addStaticRoute("/launcher/profile/register", register);
router.addStaticRoute("/launcher/profile/remove", remove);
router.addStaticRoute("/launcher/profile/get", get);
router.addStaticRoute("/launcher/profile/change/email", changeEmail);
router.addStaticRoute("/launcher/profile/change/password", changePassword);
router.addStaticRoute("/launcher/profile/change/wipe", wipe);
