const fs = require ("fs");
const request = require ("request");     
const utils = require ("daveutils");
const opml = require ("opml");
const chokidar = require ("chokidar");
const s3 = require ("daves3");

var myChokidarWatcher = undefined;

var config = {
	watchFolder: "/Users/davewiner/publicFolder/"
	};

const fnameConfig = "config.json";


function nowString () {
	return (new Date ().toLocaleTimeString ());
	}
function readConfig (callback) {
	utils.sureFilePath (fnameConfig, function () {
		fs.readFile (fnameConfig, function (err, data) {
			if (!err) {
				try {
					var jstruct = JSON.parse (data.toString ());
					for (var x in jstruct) {
						config [x] = jstruct [x];
						}
					}
				catch (err) {
					console.log ("readStats: err == " + err.message);
					}
				}
			if (callback !== undefined) {
				callback ();
				}
			});
		});
	}
function httpRequest (url, callback) {
	request (url, function (err, response, data) {
		if (err) {
			callback (err);
			}
		else {
			var code = response.statusCode;
			if ((code < 200) || (code > 299)) {
				const message = "The request returned a status code of " + response.statusCode + ".";
				callback ({message});
				}
			else {
				callback (undefined, data) 
				}
			}
		});
	}
function opmlCloudPing (urlOpmlFile, callback) {
	const urlPing = config.urlForPing + encodeURIComponent (urlOpmlFile);
	httpRequest (urlPing, function (err, data) {
		if (err) {
			console.log ("opmlCloudPing: err.message == " + err.message);
			}
		callback (err);
		});
	}
function processDavesOutline (f, callback) {
	const whenstart = new Date ();
	fs.readFile (f, function (err, opmltext) {
		if (err) {
			console.log ("processDavesOutline: err.message == " + err.message + ", f == " + f);  //5/13/23 by DW
			if (callback !== undefined) { //5/13/23 by DW
				callback (err);
				}
			}
		else {
			opml.parse (opmltext, function (err, theOutline) { 
				if (err) {
					if (callback !== undefined) { //5/13/23 by DW
						callback (err);
						}
					}
				else {
					var head = theOutline.opml.head;
					delete head.ownerName;
					delete head.ownerId;
					delete head.urlJson;
					delete head.ownerTwitterScreenName;
					head.urlUpdateSocket = config.urlUpdateSocket;
					head.urlPublic = config.urlInstantOutline;
					s3.newObject (config.s3PathInstantOutline, opml.stringify (theOutline), config.s3OutlineType, config.s3DefaultAcl, function (err, data) {
						if (err) {
							console.log ("processDavesOutline: err.message == " + err.message);
							}
						else {
							opmlCloudPing (config.urlInstantOutline, function (err) {
								console.log (nowString () + ": url == " + config.urlInstantOutline + ", " + utils.secondsSince (whenstart) + " secs.");
								});
							}
						});
					}
				});
			}
		});
	}
function startChokidar () {
	if (myChokidarWatcher !== undefined) { //the watchfolder changed -- 9/8/17 by DW
		myChokidarWatcher.close ();
		}
	myChokidarWatcher = chokidar.watch (config.watchFolder, {
		ignoreInitial: true,
		awaitWriteFinish: true
		});
	myChokidarWatcher.on ("all", function (event, f) {
		let relpath = utils.stringDelete (f, 1, config.watchFolder.length), whenstart = new Date ();
		switch (event) {
			case "add":
			case "change":
				switch (f) {
					case config.pathFileToWatch:
						processDavesOutline (f);
						break;
					}
				break;
			}
		});
	}
function startup () {
	readConfig (function () {
		console.log ("\n\nconfig == " + utils.jsonStringify (config) + "\n\n");
		startChokidar ();
		});
	}
startup ();
