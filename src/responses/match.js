"use strict";

function getProfile(url, info, sessionID) {
    return response_f.getBody(match_f.matchServer.getProfile(info));
}

function serverAvailable(url, info, sessionID) {
    return response_f.getBody(match_f.matchServer.getEnabled());
}

function joinMatch(url, info, sessionID) {
    return response_f.getBody(match_f.matchServer.joinMatch(info, sessionID));
}

function getMetrics(url, info, sessionID) {
	return json.read(db.match.metrics);
}

function getGroupStatus(url, info, sessionID) {
    return response_f.getBody(match_f.matchServer.getGroupStatus(info));
}

function createGroup(url, info, sessionID) {
    return response_f.getBody(match_f.matchServer.createGroup(sessionID, info));
}

function deleteGroup(url, info, sessionID) {
    match_f.matchServer.deleteGroup(info);
    return response_f.nullResponse();
}

router.addStaticRoute("/raid/profile/list", getProfile);
router.addStaticRoute("/client/match/available", serverAvailable);
router.addStaticRoute("/client/match/updatePing", response_f.nullResponse);
router.addStaticRoute("/client/match/join", joinMatch);
router.addStaticRoute("/client/match/exit", response_f.nullResponse);
router.addStaticRoute("/client/match/group/create", createGroup);
router.addStaticRoute("/client/match/group/delete", deleteGroup);
router.addStaticRoute("/client/match/group/status", getGroupStatus);
router.addStaticRoute("/client/match/group/start_game", joinMatch);
router.addStaticRoute("/client/match/group/exit_from_menu", response_f.nullResponse);
router.addStaticRoute("/client/match/group/looking/start", response_f.nullResponse);
router.addStaticRoute("/client/match/group/looking/stop", response_f.nullResponse);
router.addStaticRoute("/client/match/group/invite/send", response_f.nullResponse);
router.addStaticRoute("/client/match/group/invite/accept", response_f.nullResponse);
router.addStaticRoute("/client/match/group/invite/cancel", response_f.nullResponse);
router.addStaticRoute("/client/putMetrics", response_f.nullResponse);
router.addStaticRoute("/client/getMetricsConfig", getMetrics);