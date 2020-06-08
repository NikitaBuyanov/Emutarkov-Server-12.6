"use strict"

// If we don't have anything to send, it's ok to not send anything back
// because notification requests are long-polling. In fact, we SHOULD wait
// until we actually have something to send because otherwise we'd spam the client
// and the client would abort the connection due to spam.
async function sendNotification(sessionID, req, resp, data) {
    let splittedUrl = req.url.split('/');
    
    sessionID = splittedUrl[splittedUrl.length - 1].split("?last_id")[0];
    server.sendTextJson(resp, (await notifier_f.notifierService.notificationWaitAsync(resp, sessionID)));
}

server.addRespondCallback("NOTIFY", sendNotification);