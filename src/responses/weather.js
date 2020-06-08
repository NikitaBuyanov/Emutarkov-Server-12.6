"use strict";

function getWeather(url, info, sessionID) {
    return response_f.getBody(weather_f.generate());
}

router.addStaticRoute("/client/weather", getWeather);