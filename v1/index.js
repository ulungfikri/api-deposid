let router = require("express").Router();
let deposController = require("./controllers/DeposController");

// DEPOSIT
router.post("/depos/decrypt", deposController.Decrypt);

module.exports = router;
