"use strict";

/* Adding item to wishlist
*  input: playerProfileData, Request body
*  output: OK (saved profile)
* */
function addToWishList(pmcData, body, sessionID) {
    for (let item in pmcData['Wishlist']) {
        // don't add the item
        if (pmcData.WishList[item] === body['templateId']) {
            return item_f.itemServer.getOutput();
        }
    }

    // add the item to the wishlist
    pmcData.WishList.push(body['templateId']);
    return item_f.itemServer.getOutput();
}

/* Removing item to wishlist
*  input: playerProfileData, Request body
*  output: OK (saved profile)
* */
function removeFromWishList(pmcData, body, sessionID) {

    for (let i = 0; i < pmcData.WishList.length; i++) 
    {
        if (pmcData.WishList[i] === body['templateId']) { pmcData.WishList.splice(i, 1); }
    }

    return item_f.itemServer.getOutput();
}

/* Reset wishlist to empty []
*  input: playerProfileData
*  output: none
* */
function resetWishList(pmcData) {
    pmcData.WishList = [];
}

module.exports.addToWishList = addToWishList;
module.exports.removeFromWishList = removeFromWishList;
module.exports.resetWishList = resetWishList;