let crypto = require("crypto");
let aesEcb = require('aes-ecb');

let GetDecrypt = function (privateKey, encryptedContentWithBase64) {
	return new Promise((resolve,
		reject) => {
		try {
			// 1. Generate SHA-512 from Private Key
			// creating hash object 
			var hash = crypto.createHash('sha512');
			// passing the data to be hashed
			data = hash.update(privateKey, 'utf-8');
			// creating the hash in the required format
			str = data.digest('hex');

			// 2. Take byte 17-32 from result of SHA-512
			var sha512 = str.substring(32, str.length - 64);

			// 3. Decrypt
			var decrypt = aesEcb.decrypt(sha512, encryptedContentWithBase64)
			resolve(decrypt);

			// 4. Printing the output on the console (TEST)
			// console.log("hash : " + gen_hash);
			// console.log("SHA-512 : " + str.substring(32, str.length - 64));
			// console.log(sha512);
			// console.log(decrypt);

		} catch (e) {
			reject(JSON.stringify(e));
		}
	});
};

exports.Decrypt = (req, res) => {
	// get params
	// let apiKey = req.body.apiKey;
	var privateKey = req.body.privateKey;
	var encryptedContentWithBase64 = req.body.encryptedContentWithBase64;

	GetDecrypt(privateKey, encryptedContentWithBase64).then((r) => {
		if (r != null) {
			res.status(200).send({
				success: true,
				code: 200,
				message: "Success",
				data: r
			});
		}
		else {
			res.status(401).send({
				success: false,
				code: 401,
				message: "Invalid privateKey/ encryptedContentWithBase64",
			});
		}
	}).catch((e) => {
		console.error(e);
		res.status(500).send({
			success: true,
			code: 500,
			message: JSON.stringify(e)
		});
	});

};

