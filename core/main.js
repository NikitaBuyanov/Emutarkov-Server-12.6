"use strict";

/* show name in window */
process.stdout.setEncoding('utf8');
process.title = "EmuTarkov Server";

/* load server components */
require('./initializer.js');
watermark.show();
server.start();
