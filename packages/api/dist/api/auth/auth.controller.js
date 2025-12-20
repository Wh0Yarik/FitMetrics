"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.registerTrainer = void 0;
const auth_service_1 = require("./auth.service");
const registerTrainer = async (req, res) => {
    try {
        const result = await (0, auth_service_1.registerTrainerService)(req.body);
        res.status(201).json(result);
    }
    catch (error) {
        res.status(400).json({ message: error.message });
    }
};
exports.registerTrainer = registerTrainer;
