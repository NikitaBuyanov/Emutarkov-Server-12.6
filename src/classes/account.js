"use strict";

/**
* AccountServer class maintains list of accounts in memory. All account information should be 
* loaded during server init.
*/
class AccountServer {
    constructor() {
        this.accounts = {};
    }

    initialize() {
        this.accounts = json.parse(json.read(db.user.configs.accounts));
    }

    saveToDisk() {
        json.write(db.user.configs.accounts, this.accounts);
    }

    find(sessionID) {
        for (let accountID in this.accounts) {
            let account = this.accounts[accountID];

            if (account.id === sessionID) {
                return account;
            }
        }

        return undefined;
    }

    isWiped(sessionID) {
        return this.accounts[sessionID].wipe;
    }

    setWipe(sessionID, state) {
        this.accounts[sessionID].wipe = state;
    }

    login(info) {
        for (let accountID in this.accounts) {
            let account = this.accounts[accountID];

            if (info.email === account.email && info.password === account.password) {
				return accountID;
            }
        }

        return "";
    }

    register(info) {
        for (let accountID in this.accounts) {
            if (info.email === this.accounts[accountID].email) {
				return accountID;
            }
        }
        
        let accountID = utility.generateNewAccountId();

        this.accounts[accountID] = {
            "id": accountID,
            "nickname": "",
            "email": info.email,
            "password": info.password,
            "wipe": true,
            "edition": info.edition
        }
        
        this.saveToDisk();
        return "";
    }
    
    remove(info) {
        let accountID = this.login(info);  

        if (accountID !== "") {
            delete this.accounts[accountID];
            utility.removeDir("user/profiles/" + accountID + "/");
            this.saveToDisk();
        }

        return accountID;
    }

    changeEmail(info) {
        let accountID = this.login(info);

        if (accountID !== "") {
            this.accounts[accountID].email = info.change;
            this.saveToDisk();
        }

        return accountID;
    }

    changePassword(info) {
        let accountID = this.login(info);  

        if (accountID !== "") {
            this.accounts[accountID].password = info.change;
            this.saveToDisk();
        }

        return accountID;
    }

    wipe(info) {
        let accountID = this.login(info);  

        if (accountID !== "") {
            this.accounts[accountID].edition = info.edition;
            this.setWipe(accountID, true);
            this.saveToDisk();
        }

        return accountID;
    }

    getReservedNickname(sessionID) {
        return this.accounts[sessionID].nickname;
    }

    nicknameTaken(info) {
        for (let accountID in this.accounts) {
            if (info.nickname.toLowerCase() === this.accounts[accountID].nickname.toLowerCase()) {
				return true;
            }
        }

        return false;
    }
}

function getPath(sessionID) {
    return "user/profiles/" + sessionID + "/";
}

module.exports.accountServer = new AccountServer();
module.exports.getPath = getPath;
