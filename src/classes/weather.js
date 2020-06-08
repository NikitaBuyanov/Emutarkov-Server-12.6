"use strict";

let weather = undefined;

function initialize() {
    weather = json.parse(json.read(db.user.cache.weather));
}

function generate() {
    let output = {};

    // set weather
    if (gameplayConfig.location.forceWeatherEnabled) {
        output = weather.data[gameplayConfig.location.forceWeatherId];
    } else {
        output = weather.data[utility.getRandomInt(0, weather.data.length - 1)];
    }

    // replace date and time
    if (gameplayConfig.location.realTimeEnabled) {
        let time = utility.getTime().replace("-", ":").replace("-", ":");
        let date = utility.getDate();
        let datetime = date + " " + time;

        output.weather = {};
        output.weather.timestamp = Math.floor(new Date() / 1000);
        output.weather.date = date;
        output.weather.time = datetime;
        output.date = date;
        output.time = time;
    }

    return output;
}

module.exports.initialize = initialize;
module.exports.generate = generate;