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

    // Plaid's initial extraction in production can take up to 15 seconds.
    // We will poll transactionsSync or transactionsGet.
    let addedTransactions: any[] = [];
    let attempts = 0;
    const maxAttempts = 5;

    while (attempts < maxAttempts && addedTransactions.length === 0) {
      if (attempts > 0) {
        await new Promise(resolve => setTimeout(resolve, 3000)); // Wait 3s between retries
      }
      
      try {
        let hasMore = true;
        let cursor = undefined;
        let batchAdded: any[] = [];

        // Try transactionsSync first
        while (hasMore) {
          const syncResponse = await plaidClient.transactionsSync({
            access_token: access_token,
            cursor: cursor,
          });
          batchAdded = batchAdded.concat(syncResponse.data.added);
          hasMore = syncResponse.data.has_more;
          cursor = syncResponse.data.next_cursor;
        }

        if (batchAdded.length > 0) {
          addedTransactions = batchAdded;
          break;
        }

        // Fallback to transactionsGet if sync returns 0
        const endDate = new Date().toISOString().split('T')[0];
        const startDate = new Date(Date.now() - 90 * 24 * 60 * 60 * 1000).toISOString().split('T')[0];
        
        const getResponse = await plaidClient.transactionsGet({
          access_token: access_token,
          start_date: startDate,
          end_date: endDate,
          options: { count: 250, offset: 0 }
        });
        
        if (getResponse.data.transactions.length > 0) {
          addedTransactions = getResponse.data.transactions;
          break;
        }

      } catch (err: any) {
        console.log(`Attempt ${attempts + 1} failed:`, err.response?.data?.error_code || err.message);
        // If PRODUCT_NOT_READY, we just loop and try again
      }
      
      attempts++;
    }

    // Sort transactions by date descending
    addedTransactions.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());

    return NextResponse.json({
      success: true,
      accounts: accounts,
      transactions: addedTransactions,
      attempts: attempts
    });

  } catch (error: any) {
    console.error('Error syncing plaid data:', error.response?.data || error.message);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
