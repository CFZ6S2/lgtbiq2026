
import fetch from 'node-fetch';

async function testAuth() {
  try {
    const response = await fetch('https://us-central1-lgtbiq26.cloudfunctions.net/api/auth/telegram', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ initData: 'demo_init_data' })
    });

    const text = await response.text();
    console.log('Status:', response.status);
    console.log('Body:', text);
  } catch (error) {
    console.error('Error:', error);
  }
}

testAuth();
