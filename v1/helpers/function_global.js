const fs = require("fs");
const path = require("path");
const zlib = require("zlib");
const archiver = require("archiver");
archiver.registerFormat("zip-encrypted", require("archiver-zip-encrypted"));
const pool_mariadb = require("../models/index.js");

function extractApiKey(req) {
	if (req.headers["x-api-key"] !== undefined) {
		return req.headers["x-api-key"];
	}
	return null;
}

exports.RunCreateJSON = async function (req, res, arrJSON) {
	return new Promise((resolve, reject) => {
		var DirPath = arrJSON.DirPath;
		var file_name = arrJSON.file_name;
		let data = arrJSON.jsonData;

		ensureExists(DirPath, 0755, function (err) {
			if (err) {
				console.log(err);
			}
		});

		var json_file = DirPath + file_name;
		fs.writeFileSync(json_file, JSON.stringify(data));

		//return json_file;
		resolve(json_file);
	});
};

exports.RunCreateGZIP = async function (req, res, arrGzip) {
	var password = extractApiKey(req);

	console.log(password.slice(10));

	let promise = new Promise((resolve, reject) => {
		var DirPath = arrGzip.DirPath;
		var file_source = arrGzip.file_source;
		let file_json = arrGzip.file_json;
		let file_name = arrGzip.file_name;

		var gzip_file = DirPath + file_name;

		console.log(password.substr(password.length - 10));
		const output = fs.createWriteStream(gzip_file);
		const archive = archiver.create("zip-encrypted", {
			zlib: { level: 9 },
			encryptionMethod: "aes256",
			password: password.substr(password.length - 10),
		});
		output.on("close", function () {
			//console.log(archive.pointer() + ' total bytes');
			//console.log('archiver has been finalized and the output file descriptor has closed.');
		});

		output.on("end", function () {
			//console.log('Data has been drained');
		});

		archive.on("warning", function (err) {
			if (err.code === "ENOENT") {
				// log warning
			} else {
				// throw error
				//throw err;
			}
		});

		archive.on("error", function (err) {
			//console.log('error');
		});

		archive.pipe(output);

		const file1 = DirPath + file_json;
		const fileContents = fs.createReadStream(file1);
		archive.append(fileContents, { name: file_json });

		archive.finalize();

		// return gzip_file;
		resolve(gzip_file);
	});

	let result = await promise;

	return result;
};

exports.RunCreateGZIPALL = async function (req, res, arrGzip) {
	var password = extractApiKey(req);

	//console.log(password.slice(0,6));

	let promise = new Promise((resolve, reject) => {
		var DirPath = arrGzip.DirPath;
		//var file_source = arrGzip.file_source;
		//let file_json   = arrGzip.file_json;
		let file_name = arrGzip.file_name;

		var gzip_file = DirPath + file_name;

		const output = fs.createWriteStream(gzip_file);
		const archive = archiver.create("zip-encrypted", {
			zlib: { level: 9 },
			encryptionMethod: "aes256",
			password: password.substr(password.length - 10),
		});
		output.on("close", function () {
			//console.log(archive.pointer() + ' total bytes');
			//console.log('archiver has been finalized and the output file descriptor has closed.');
		});

		output.on("end", function () {
			//console.log('Data has been drained');
		});

		archive.on("warning", function (err) {
			if (err.code === "ENOENT") {
				// log warning
			} else {
				// throw error
				//throw err;
			}
		});

		archive.on("error", function (err) {
			//console.log('error');
		});

		archive.pipe(output);

		// const file1 = DirPath + file_json;
		// const fileContents = fs.createReadStream(file1);
		// archive.append(fileContents, { name: file_json });

		archive.directory(DirPath + "json/", false);

		archive.finalize();

		// return gzip_file;
		resolve(gzip_file);
	});

	let result = await promise;

	return result;
};

exports.generate_json_gz = async function (
	req,
	res,
	file_name,
	dir_path,
	data
) {
	let arrJSON = {
		DirPath: dir_path,
		file_name: file_name + ".json",
		jsonData: data,
	};

	return new Promise(function (resolve, reject) {
		exports.RunCreateJSON(req, res, arrJSON).then((rJs) => {
			//console.log("hasil dari json: " + rJs);

			let arrGzip = {
				DirPath: dir_path,
				file_json: file_name + ".json",
				file_name: file_name + ".gz",
				file_source: rJs,
			};

			exports.RunCreateGZIP(req, res, arrGzip).then((rGz) => {
				// console.log("hasil dari gz: " + rGz);
				resolve(rGz);
			});
		});
	});
};

exports.check_folder = async function (req, res, dir_path) {
	return new Promise((resolve, reject) => {
		ensureExists(dir_path, 0755, function (err) {
			if (err) {
				console.log(err);
			}
		});

		return dir_path;
	});
};

exports.save_log = async function (req, res, file_name, dir_path, data) {
	let arrJSON = {
		DirPath: dir_path,
		file_name: file_name + ".json",
		jsonData: data,
	};

	return new Promise(function (resolve, reject) {
		exports.RunCreateJSON(req, res, arrJSON).then((rJs) => {
			resolve(rJs);
		});
	});
};

// FUNCTION

function ensureExists(path, mask, cb) {
	if (typeof mask == "function") {
		// allow the `mask` parameter to be optional
		cb = mask;
		mask = 0777;
	}
	fs.mkdir(path, mask, function (err) {
		if (err) {
			if (err.code == "EEXIST") cb(null);
			// ignore the error if the folder already exists
			else cb(err); // something else went wrong
		} else cb(null); // successfully created folder
	});
}

exports.checkPeriod = function (statusProposal) {
	return pool_mariadb.getConnection().then((conn) => {
		return conn.query("CALL SP_CHECK_STATUS_PROPOSAL_CALENDER(" + statusProposal + ")");
	});
};

exports.getCounterNumber = function (field, db, id) {
	return pool_mariadb.getConnection().then((conn) => {
		var sql = "SELECT " + field + " FROM " + db + " ORDER BY " + id + " DESC LIMIT 1";
		return conn.query(sql, function (error, rows, fields) {
			if (error) {
				console.log(error);
			}
			resolve(rows);
		});
	});
};

exports.buildUpdateQuery = function (table_name, json_data, whereCondition) {
	let column = Object.keys(json_data);
	let values = Object.values(json_data);

	let vals = [];
	values.forEach((val) => {
		let v = val === "" ? "null" : "'" + val + "'";
		vals.push(v);
	});

	let tempColumn = [];

	column.forEach((col, i) => {
		tempColumn.push(col + "=" + vals[i]);
	});

	let SQL = "UPDATE " + table_name + " SET " + tempColumn.join(",") + " WHERE " + whereCondition;
	return SQL;
};

exports.buildInsertQuery = function (table_name, json_data) {
	let column = Object.keys(json_data);
	let values = Object.values(json_data);

	let vals = [];
	values.forEach((val) => {
		let v = val === "" ? "null" : "'" + val + "'";
		vals.push(v);
	});

	let tempColumn = [];

	column.forEach((col, i) => {
		tempColumn.push(col);
	});

	let SQL = "INSERT INTO " + table_name + " (" + tempColumn.join(",") + ") " + " VALUES (" + vals.join(",") + " )";
	return SQL;
};

exports.buildDeleteQuery = function (table_name, whereCondition) {
	let SQL = "DELETE FROM " + table_name + " WHERE " + whereCondition;
	return SQL;
};
