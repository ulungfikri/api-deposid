module.exports = (app) => {
	let v1 = require("../v1/index");
	app.use("/api/v1", v1);
};
