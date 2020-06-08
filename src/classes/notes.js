"use strict";

function addNote(pmcData, body, sessionID) {
    pmcData.Notes.Notes.push({
		"Time": body.note.Time, 
		"Text": body.note.Text
    });
    
    return item_f.itemServer.getOutput();
}

function editNode(pmcData, body, sessionID) {
    pmcData.Notes.Notes[body.index] = {
		"Time": body.note.Time, 
		"Text": body.note.Text
    };
    
    return item_f.itemServer.getOutput();
}

function deleteNote(pmcData, body, sessionID) {
    pmcData.Notes.Notes.splice(body.index, 1);
    return item_f.itemServer.getOutput();
}

module.exports.addNote = addNote;
module.exports.editNode = editNode;
module.exports.deleteNote = deleteNote;