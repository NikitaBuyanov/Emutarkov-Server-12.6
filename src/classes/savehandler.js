"use strict";

function initialize() {
	if (gameplayConfig.autosave.saveOnExit) {
		process.on('exit', (code) => {
			saveHandler.saveOpenSessions();
		});

		process.on('SIGINT', (code) => {
			saveHandler.saveOpenSessions();
			logger.logInfo("Ctrl-C, exiting ...");
			process.exit(1);
		});
	}
	
	if (gameplayConfig.autosave.saveIntervalSec > 0) {
        setInterval(function() {
            saveHandler.saveOpenSessions();
            logger.logSuccess("Player progress autosaved!");
        }, gameplayConfig.autosave.saveIntervalSec * 1000);
    }
}

function saveOpenSessions() {
	account_f.accountServer.saveToDisk();
	events.scheduledEventHandler.saveToDisk();

	for (let sessionId of profile_f.profileServer.getOpenSessions()) {
		profile_f.profileServer.saveToDisk(sessionId);
		dialogue_f.dialogueServer.saveToDisk(sessionId);
	}
}

module.exports.initialize = initialize;
module.exports.saveOpenSessions = saveOpenSessions;