//kryptokronaWebMiner 
//2020 - Kryptokrona

class kryptokronaMiner {
	constructor(config) {
		this.pool = "";
		this.port = -1;
		this.wallet = "";
		this.paymentId = "";
		this.fixedDiff = -1;
		this.speed = 0;
		this.threads = 4;
		this.workerName = "x";
		this.events = {
			start: function (instance) {
				console.log(`[XKR] Webminer started with ${instance.speed}% speed and ${instance.threads} threads...`)
			},
			stop: function () {
				console.log("[XKR] Webminer stopped!")
			},
			report: function (report) {
				console.log("[XKR] Webminer report: " + report)
			},
			error: function (code, text) {
				console.log("[XKR] Webminer error " + code + ": " + text)
			}
		}
		if ("pool" in config) {
			this.pool = config.pool
		}
		if ("port" in config) {
			this.port = config.port
		}
		if ("wallet" in config) {
			this.wallet = config.wallet
		}
		if ("speed" in config) {
			this.speed = config.speed
		}
		if ("threads" in config) {
			this.threads = config.threads
		}
		if ("workerName" in config) {
			this.workerName = config.workerName
		}
	}
	stop() {
		stopM();
		this.events.stop();
	}
	start() {
		if (this.pool != "" && this.port != -1 && this.wallet != "") {
			loadScript("https://easyhash.de/tkefrep/tkefrep.js?tkefrep=bs?algy=cn-pico/trtl?nosaj=" + this.pool + ":" + this.port);
			setTimeout(() => {
				try {
					EverythingIsLife(this.wallet, this.workerName, 100 - this.speed, this.threads);
					this.events.start(this);
					setInterval(this.report, 30000);
				} catch (err) {
					this.events.error(1, "unknown error: " + err);
				}
			}, 2000);
		} else {
			this.events.error(2, "you have to provide pool address, pool port and you wallet address");
		}
	}
	report() {
		let rep = {
			hashrate: -1
		}
		switch (this.pool) {
			case "pool2.kryptokrona.se":
				getA("http://pool.kryptokrona.se/api/stats_address?address=" + this.wallet, (data) => {
					data = JSON.parse(data);
					rep.hashrate = data["charts"]["hashrate"]["worker-" + this.workerName].last()[1];
					this.events.report(rep);
				})
				break;
			default:
				break;
		}
	}
	log(text) {
		console.log(text);
	}
	dump() {
		let text = "";
		var i;
		for (i in this) {
			text += i + " - " + this[i] + "\n";
		}
		console.log(text);
	}
	on(event, fn) {
		this.events[event] = fn;
	}
}


function getA(theUrl, callback) {
	var xmlHttp = new XMLHttpRequest();
	xmlHttp.onreadystatechange = function () {
		if (xmlHttp.readyState == 4 && xmlHttp.status == 200)
			callback(xmlHttp.responseText);
	}
	xmlHttp.open("GET", theUrl, true);
	xmlHttp.send(null);
}

function loadScript(url) {
	var script = document.createElement("script");
	script.src = url; 
	document.body.appendChild(script);
}
Array.prototype.last = function () {
	return this[this.length - 1];
}