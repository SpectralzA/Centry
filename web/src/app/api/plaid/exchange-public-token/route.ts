import { NextResponse } from 'next/server';
import { Configuration, PlaidApi, PlaidEnvironments } from 'plaid';

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
    const { public_token } = await request.json();

    if (!public_token) {
      return NextResponse.json({ error: 'public_token is required' }, { status: 400 });
    }

    const exchangeResponse = await plaidClient.itemPublicTokenExchange({
      public_token: public_token,
    });
    
    const accessToken = exchangeResponse.data.access_token;
    const itemId = exchangeResponse.data.item_id;

    // In a real app, securely save the access_token and item_id to your database here.
    // We will return it for the mobile client to use for this MVP.

    return NextResponse.json({ success: true, item_id: itemId, access_token: accessToken });
  } catch (error: any) {
    console.error('Error exchanging public token:', error.response?.data || error.message);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
