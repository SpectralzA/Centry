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
    const { access_token } = await request.json();

    if (!access_token) {
      return NextResponse.json({ error: 'access_token is required' }, { status: 400 });
    }

    // Fetch accounts
    const accountsResponse = await plaidClient.accountsGet({
      access_token: access_token,
    });
    const accounts = accountsResponse.data.accounts;

    // Fetch transactions using transactionsSync (initial sync)
    let addedTransactions: any[] = [];
    let hasMore = true;
    let cursor = undefined;

    // Fetch all available transactions in the initial sync
    while (hasMore) {
      const transactionsResponse = await plaidClient.transactionsSync({
        access_token: access_token,
        cursor: cursor,
      });
      
      addedTransactions = addedTransactions.concat(transactionsResponse.data.added);
      hasMore = transactionsResponse.data.has_more;
      cursor = transactionsResponse.data.next_cursor;
    }

    // Sort transactions by date descending
    addedTransactions.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());

    return NextResponse.json({
      success: true,
      accounts: accounts,
      transactions: addedTransactions,
    });

  } catch (error: any) {
    console.error('Error syncing plaid data:', error.response?.data || error.message);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
