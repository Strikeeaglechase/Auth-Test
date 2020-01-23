const fs = require('fs');
class Database {
	constructor() {
		this.fName = 'db.json';
		this.data = {};
	}
	read() {
		this.data = JSON.parse(fs.readFileSync(this.fName, 'utf8'))
	}
	write() {
		fs.writeFileSync(this.fName, JSON.stringify(this.data));
	}
	grabFromPath(path, cur) {
		cur = cur ? cur : this.data;
		if (!path || path.length == 0) {
			return cur;
		}
		if (typeof path == 'string') {
			path = path.split('.');
		}
		var nextProp = path.shift();
		return this.grabFromPath(path, cur[nextProp]);
	}
	get(path, prop, val) {
		this.read();
		var obj = this.grabFromPath(path);
		return obj.find(item => item[prop] == val);
	}
	removeLastFromPath(path) {
		var p = path.split('.');
		p.pop();
		return p.join('.');
	}
	getLastFromPath(path) {
		var p = path.split('.');
		return p.pop();
	}
	clear(path) {
		var obj = this.grabFromPath(this.removeLastFromPath(path));
		var objPath = this.getLastFromPath(path);

		if (objPath) {
			delete obj[objPath];
		}
		this.write();
	}
	init(defaults) {
		if (fs.existsSync('./' + this.fName)) {
			this.read();
		} else {
			this.write(defaults);
		}
		const currentKeys = Object.getOwnPropertyNames(this.data);
		for (var i in defaults) {
			if (!currentKeys.includes(i)) {
				this.data[i] = defaults[i];
			}
		}
		this.write();
	}
}
module.exports = Database;