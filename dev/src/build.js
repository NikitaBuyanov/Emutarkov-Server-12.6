const fs = require('fs');
const childProcess = require('child_process');
const UPX = require('upx')('best')
const { compile } = require('nexe');

// compile the application
console.log(">>>STARTING BUILD...");
compile({
	input: 'core/main.js',
	output: 'EmuTarkov-Server-Uncompressed',
	build: false,
	ico: 'dev/res/icon.ico'
}).then(function(err) {
	console.log(">>>Changing ICON...");
	childProcess.execFile('dev/bin/ResourceHacker.exe', [
		'-open',
		'EmuTarkov-Server-Uncompressed.exe',
		'-save',
		'EmuTarkov-Server-Icon.exe',
		'-action',
		'addoverwrite',
		'-res',
		'dev/res/icon.ico',
		'-mask',
		'ICONGROUP,MAINICON,'
	], function(err) {
		fs.unlinkSync('EmuTarkov-Server-Uncompressed.exe');
		console.log(">>>Compressing Executable...");
		UPX('EmuTarkov-Server-Icon.exe')
		.output('EmuTarkov-Server.exe')
		.start().then(function(stats) {
			console.log(stats);
			fs.unlinkSync('EmuTarkov-Server-Icon.exe');			
		}).catch(function (err) {
			console.log(err);
		});
	});
});