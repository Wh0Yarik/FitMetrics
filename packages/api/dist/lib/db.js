"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
require("dotenv/config");
const edge_1 = require("@prisma/client/edge");
const extension_accelerate_1 = require("@prisma/extension-accelerate");
// Stripping this down to the absolute bare minimum.
// If this fails, the problem is outside the scope of the project's code.
const prisma = new edge_1.PrismaClient({
    log: [
        {
            emit: 'event',
            level: 'query',
        },
        'error',
        'warn',
    ],
});
const extendedPrisma = prisma.$extends((0, extension_accelerate_1.withAccelerate)());
exports.default = extendedPrisma;
