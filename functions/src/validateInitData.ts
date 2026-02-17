import * as crypto from 'crypto';

export interface TelegramUser {
  id: number;
  first_name: string;
  last_name?: string;
  username?: string;
  language_code?: string;
  is_premium?: boolean;
}

export interface InitDataValidation {
  valid: boolean;
  user?: TelegramUser;
  error?: string;
}

export function validateInitData(initData: string, botToken: string): InitDataValidation {
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
    const sortedParams: string[] = [];
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

    let user: TelegramUser;
    try {
      user = JSON.parse(userParam);
    } catch (e) {
      return { valid: false, error: 'Invalid user data format' };
    }

    // Validate required user fields
    if (!user.id || !user.first_name) {
      return { valid: false, error: 'Missing required user fields' };
    }

    return { valid: true, user };
  } catch (error) {
    return { valid: false, error: `Validation error: ${error}` };
  }
}

// For demo/testing purposes
export function validateInitDataDemo(initData: string): InitDataValidation {
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