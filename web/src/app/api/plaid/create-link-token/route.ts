import { NextResponse } from 'next/server';
import { Configuration, PlaidApi, PlaidEnvironments, Products, CountryCode } from 'plaid';

const configuration = new Configuration({
  basePath: PlaidEnvironments[process.env.PLAID_ENV || 'sandbox'],
  baseOptions: {
    headers: {
      'PLAID-CLIENT-ID': process.env.PLAID_CLIENT_ID,
      'PLAID-SECRET': process.env.PLAID_SECRET,
    },
  },
});

const plaidClient = new PlaidApi(configuration);

export async function POST(request: Request) {
  try {
    // In a real app, you would verify the user session and use their distinct user_id
    const body = await request.json().catch(() => ({}));
    const platform = body.platform || 'web';

    const requestArgs: any = {
      user: {
        client_user_id: crypto.randomUUID(),
      },
      client_name: 'Centry',
      products: [Products.Transactions],
      country_codes: [CountryCode.Us],
      language: 'en',
    };

    // Only strictly require the OAuth redirect URI for iOS mobile devices
    if (platform === 'ios') {
      requestArgs.redirect_uri = 'https://centryus.com/oauth';
    }

    const createTokenResponse = await plaidClient.linkTokenCreate(requestArgs);
    
    return NextResponse.json(createTokenResponse.data);
  } catch (error: any) {
    console.error('Error creating Plaid link token:', error.response?.data || error.message);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
