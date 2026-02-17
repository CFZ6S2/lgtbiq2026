"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || function (mod) {
    if (mod && mod.__esModule) return mod;
    var result = {};
    if (mod != null) for (var k in mod) if (k !== "default" && Object.prototype.hasOwnProperty.call(mod, k)) __createBinding(result, mod, k);
    __setModuleDefault(result, mod);
    return result;
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.validateInitDataDemo = exports.validateInitData = void 0;
const crypto = __importStar(require("crypto"));
function validateInitData(initData, botToken) {
    if (!initData || !botToken) {
        return { valid: false, error: 'Missing initData or botToken' };
    }
    try {
        // Parse the initData
        const params = new URLSearchParams(initData);
        // Get hash and remove it from params
        const receivedHash = params.get('hash');
        if (!receivedHash) {
            return { valid: false, error: 'Missing hash' };
        }
        params.delete('hash');
        // Sort the remaining parameters alphabetically
        const sortedParams = [];
        for (const [key, value] of params.entries()) {
            sortedParams.push(`${key}=${value}`);
        }
        sortedParams.sort();
        // Create data check string
        const dataCheckString = sortedParams.join('\n');
        // Create secret key using HMAC-SHA256 with bot token and "WebAppData"
        const secretKey = crypto.createHmac('sha256', 'WebAppData').update(botToken).digest();
        // Calculate hash using HMAC-SHA256 with secret key and data check string
        const calculatedHash = crypto.createHmac('sha256', secretKey).update(dataCheckString).digest('hex');
        // Compare hashes
        if (receivedHash !== calculatedHash) {
            return { valid: false, error: 'Invalid hash' };
        }
        // Check if data is too old (more than 1 day)
        const authDate = parseInt(params.get('auth_date') || '0');
        const currentTime = Math.floor(Date.now() / 1000);
        if (currentTime - authDate > 86400) { // 24 hours
            return { valid: false, error: 'Data too old' };
        }
        // Parse user data
        const userParam = params.get('user');
        if (!userParam) {
            return { valid: false, error: 'Missing user data' };
        }
        let user;
        try {
            user = JSON.parse(userParam);
        }
        catch (e) {
            return { valid: false, error: 'Invalid user data format' };
        }
        // Validate required user fields
        if (!user.id || !user.first_name) {
            return { valid: false, error: 'Missing required user fields' };
        }
        return { valid: true, user };
    }
    catch (error) {
        return { valid: false, error: `Validation error: ${error}` };
    }
}
exports.validateInitData = validateInitData;
// For demo/testing purposes
function validateInitDataDemo(initData) {
    if (initData === 'demo_init_data') {
        return {
            valid: true,
            user: {
                id: 123456789,
                first_name: 'Demo',
                last_name: 'User',
                username: 'demo_user',
                language_code: 'es'
            }
        };
    }
    return { valid: false, error: 'Invalid demo data' };
}
exports.validateInitDataDemo = validateInitDataDemo;
//# sourceMappingURL=validateInitData.js.map