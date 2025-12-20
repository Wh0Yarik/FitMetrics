"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.trainerRegistrationSchema = void 0;
const zod_1 = require("zod");
exports.trainerRegistrationSchema = zod_1.z.object({
    email: zod_1.z.string().email(),
    password: zod_1.z.string().min(8, 'Password must be at least 8 characters long'),
    name: zod_1.z.string().min(2, 'Name must be at least 2 characters long'),
});
