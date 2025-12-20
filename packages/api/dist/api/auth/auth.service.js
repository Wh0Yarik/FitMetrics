"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.registerTrainerService = void 0;
const bcrypt_1 = __importDefault(require("bcrypt"));
const db_1 = __importDefault(require("../../lib/db"));
const auth_validation_1 = require("./auth.validation");
const client_1 = require("@prisma/client");
const registerTrainerService = async (data) => {
    const validatedData = auth_validation_1.trainerRegistrationSchema.parse(data);
    const { email, password, name } = validatedData;
    const existingUser = await db_1.default.user.findUnique({
        where: { email },
    });
    if (existingUser) {
        throw new Error('User with this email already exists');
    }
    const hashedPassword = await bcrypt_1.default.hash(password, 10);
    const user = await db_1.default.user.create({
        data: {
            email,
            password_hash: hashedPassword,
            role: client_1.Role.trainer,
            status: client_1.UserStatus.pending, // Trainers need admin approval
            trainer: {
                create: {
                    name,
                    moderation_status: client_1.ModerationStatus.pending,
                },
            },
        },
        select: {
            id: true,
            email: true,
            role: true,
            status: true,
            trainer: {
                select: {
                    id: true,
                    name: true,
                    moderation_status: true,
                }
            }
        }
    });
    // In a real app, you would not return the full user object like this
    // But for now, it's good for debugging.
    // We'll replace this with JWT generation later.
    return {
        message: 'Trainer registered successfully. Awaiting admin approval.',
        user,
    };
};
exports.registerTrainerService = registerTrainerService;
