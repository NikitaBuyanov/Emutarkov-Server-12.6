"use strict";

function load() {
    weather_f.initialize();
}

server.addStartCallback("loadWeather", load);