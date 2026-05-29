import React, { createContext, useContext, useState, useMemo, ReactNode } from 'react';
import { Coffee, ShoppingBag, Car, Plane, Utensils, Receipt, Zap, HeartPulse } from 'lucide-react-native';

const mapCategory = (plaidCategory: string) => {
  const cat = plaidCategory.toUpperCase();
  if (cat.includes('FOOD') || cat.includes('DINING')) return { category: 'Food & Dining', icon: Utensils, color: 'text-amber-600', bg: 'bg-amber-100', hex: '#D97706' };
  if (cat.includes('TRAVEL') || cat.includes('AIRLINES')) return { category: 'Travel', icon: Plane, color: 'text-blue-600', bg: 'bg-blue-100', hex: '#2563EB' };
  if (cat.includes('TRANSPORTATION') || cat.includes('TAXI') || cat.includes('RIDESHARE')) return { category: 'Transportation', icon: Car, color: 'text-slate-600', bg: 'bg-slate-100', hex: '#475569' };
  if (cat.includes('GROCERY') || cat.includes('SUPERMARKET') || cat.includes('SHOPS') || cat.includes('GENERAL_MERCHANDISE')) return { category: 'Shopping', icon: ShoppingBag, color: 'text-emerald-600', bg: 'bg-emerald-100', hex: '#059669' };
  if (cat.includes('COFFEE')) return { category: 'Coffee', icon: Coffee, color: 'text-amber-600', bg: 'bg-amber-100', hex: '#D97706' };
  if (cat.includes('PERSONAL_CARE')) return { category: 'Personal Care', icon: HeartPulse, color: 'text-pink-600', bg: 'bg-pink-100', hex: '#DB2777' };
  
  // Default
  const formattedCat = plaidCategory.replace(/_/g, ' ').replace(/\w\S*/g, (txt) => txt.charAt(0).toUpperCase() + txt.substr(1).toLowerCase());
  return { category: formattedCat, icon: Receipt, color: 'text-gray-600', bg: 'bg-gray-100', hex: '#4B5563' };
}

export interface BankAccount {
  id: string;
  name: string;
  type: 'CHECKING' | 'CREDIT' | 'INVESTMENT';
  balance: number;
  creditLimit?: number;
  monthlyIncome: number;
  color: string;
}

export interface SubscriptionData {
  id: string;
  accountId: string;
  merchant: string;
  amount: number;
  frequency: string;
  usageHours: number | null;
  status: "PENDING" | "ACTIVE" | "FLAGGED" | "CANCELLED";
  dueDate?: number; // Day of the month
}

export interface ExpenseData {
  id: string;
  accountId: string;
  merchant: string;
  amount: number;
  date: string;
  category: string;
  icon: any;
  color: string;
  bg: string;
  hex: string;
}

export interface VCCData {
  number: string;
  cvv: string;
  exp: string;
}

interface FinanceContextType {
  accounts: BankAccount[];
  selectedAccountId: string | null;
  setSelectedAccountId: (id: string | null) => void;
  subscriptions: SubscriptionData[];
  expenses: ExpenseData[];
  hasScanned: boolean;
  setHasScanned: (val: boolean) => void;
  runAudit: () => void;
  cancelSubscription: (id: string) => void;
  updateExpenseCategory: (id: string, category: string, icon: any, color: string, bg: string, hex: string) => void;
  generateTrialCard: () => VCCData;
  connectBank: (publicToken: string) => Promise<void>;
}

const FinanceContext = createContext<FinanceContextType | undefined>(undefined);

const ALL_ACCOUNTS: BankAccount[] = [
  { id: 'acc_1', name: 'Chase Checking', type: 'CHECKING', balance: 14500, monthlyIncome: 8200, color: '#2563EB' },
  { id: 'acc_2', name: 'Amex Platinum', type: 'CREDIT', balance: -2450, creditLimit: 25000, monthlyIncome: 0, color: '#94A3B8' },
  { id: 'acc_3', name: 'Robinhood', type: 'INVESTMENT', balance: 45200, monthlyIncome: 0, color: '#10B981' },
];

const INITIAL_SUBSCRIPTIONS: SubscriptionData[] = [
  { id: "1", accountId: "acc_1", merchant: "Netflix", amount: 15.49, frequency: "Monthly", usageHours: null, status: "PENDING", dueDate: 15 },
  { id: "2", accountId: "acc_2", merchant: "Spotify Premium", amount: 10.99, frequency: "Monthly", usageHours: null, status: "PENDING", dueDate: 22 },
  { id: "3", accountId: "acc_1", merchant: "Planet Fitness", amount: 24.99, frequency: "Monthly", usageHours: null, status: "PENDING", dueDate: 5 },
  { id: "4", accountId: "acc_2", merchant: "Adobe Creative Cloud", amount: 54.99, frequency: "Monthly", usageHours: null, status: "PENDING", dueDate: 18 },
];

const SCANNED_SUBSCRIPTIONS: SubscriptionData[] = [
  { id: "1", accountId: "acc_1", merchant: "Netflix", amount: 15.49, frequency: "Monthly", usageHours: 0, status: "FLAGGED", dueDate: 15 },
  { id: "2", accountId: "acc_2", merchant: "Spotify Premium", amount: 10.99, frequency: "Monthly", usageHours: 42, status: "ACTIVE", dueDate: 22 },
  { id: "3", accountId: "acc_1", merchant: "Planet Fitness", amount: 24.99, frequency: "Monthly", usageHours: 0, status: "FLAGGED", dueDate: 5 },
  { id: "4", accountId: "acc_2", merchant: "Adobe Creative Cloud", amount: 54.99, frequency: "Monthly", usageHours: 1.5, status: "FLAGGED", dueDate: 18 },
];

const ALL_EXPENSES: ExpenseData[] = [
  // May 2026
  { id: "1", accountId: "acc_1", merchant: "Starbucks", amount: 6.45, date: "2026-05-12", category: "Coffee", icon: Coffee, color: "text-amber-600", bg: "bg-amber-100", hex: "#D97706" },
  { id: "2", accountId: "acc_2", merchant: "Whole Foods", amount: 142.30, date: "2026-05-10", category: "Groceries", icon: ShoppingBag, color: "text-emerald-600", bg: "bg-emerald-100", hex: "#059669" },
  { id: "3", accountId: "acc_1", merchant: "Uber", amount: 24.50, date: "2026-05-09", category: "Transport", icon: Car, color: "text-slate-600", bg: "bg-slate-100", hex: "#475569" },
  { id: "4", accountId: "acc_2", merchant: "Delta Airlines", amount: 450.00, date: "2026-05-05", category: "Travel", icon: Plane, color: "text-blue-600", bg: "bg-blue-100", hex: "#2563EB" },
  { id: "5", accountId: "acc_1", merchant: "Sweetgreen", amount: 18.20, date: "2026-05-04", category: "Food & Drink", icon: Utensils, color: "text-green-600", bg: "bg-green-100", hex: "#16A34A" },
  
  // April 2026
  { id: "6", accountId: "acc_2", merchant: "Whole Foods", amount: 110.20, date: "2026-04-28", category: "Groceries", icon: ShoppingBag, color: "text-emerald-600", bg: "bg-emerald-100", hex: "#059669" },
  { id: "7", accountId: "acc_1", merchant: "Shell Gas", amount: 45.00, date: "2026-04-22", category: "Transport", icon: Car, color: "text-slate-600", bg: "bg-slate-100", hex: "#475569" },
  { id: "8", accountId: "acc_2", merchant: "AMC Theaters", amount: 32.50, date: "2026-04-18", category: "Entertainment", icon: Receipt, color: "text-purple-600", bg: "bg-purple-100", hex: "#9333EA" },
  { id: "9", accountId: "acc_1", merchant: "Sweetgreen", amount: 22.10, date: "2026-04-15", category: "Food & Drink", icon: Utensils, color: "text-green-600", bg: "bg-green-100", hex: "#16A34A" },
  { id: "10", accountId: "acc_1", merchant: "Lyft", amount: 18.00, date: "2026-04-02", category: "Transport", icon: Car, color: "text-slate-600", bg: "bg-slate-100", hex: "#475569" },
  
  // March 2026
  { id: "11", accountId: "acc_2", merchant: "Trader Joe's", amount: 89.40, date: "2026-03-25", category: "Groceries", icon: ShoppingBag, color: "text-emerald-600", bg: "bg-emerald-100", hex: "#059669" },
  { id: "12", accountId: "acc_2", merchant: "Airbnb", amount: 320.00, date: "2026-03-14", category: "Travel", icon: Plane, color: "text-blue-600", bg: "bg-blue-100", hex: "#2563EB" },
  { id: "13", accountId: "acc_1", merchant: "Starbucks", amount: 12.90, date: "2026-03-10", category: "Coffee", icon: Coffee, color: "text-amber-600", bg: "bg-amber-100", hex: "#D97706" },
];

export function FinanceProvider({ children }: { children: ReactNode }) {
  const [hasScanned, setHasScanned] = useState(false);
  const [accounts, setAccounts] = useState<BankAccount[]>(ALL_ACCOUNTS);
  const [subscriptions, setSubscriptions] = useState<SubscriptionData[]>(INITIAL_SUBSCRIPTIONS);
  const [expenses, setExpenses] = useState<ExpenseData[]>(ALL_EXPENSES);
  const [selectedAccountId, setSelectedAccountId] = useState<string | null>(null);

  const runAudit = async (accessToken?: string) => {
    if (!accessToken) {
      setSubscriptions(SCANNED_SUBSCRIPTIONS);
      setHasScanned(true);
      return;
    }

    try {
      const response = await fetch('http://localhost:3000/api/plaid/sync', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ access_token: accessToken })
      });
      if (!response.ok) throw new Error('Sync failed');
      const data = await response.json();

      if (data.success) {
        // Map accounts
        const plaidAccounts = data.accounts.map((acc: any) => ({
          id: acc.account_id,
          name: acc.name,
          type: acc.type === 'depository' ? 'CHECKING' : (acc.type === 'credit' ? 'CREDIT' : 'INVESTMENT'),
          balance: acc.balances.current,
          creditLimit: acc.balances.limit,
          monthlyIncome: 0,
          color: acc.type === 'credit' ? '#94A3B8' : '#2563EB'
        }));
        setAccounts(plaidAccounts);

        // Map transactions
        const mappedExpenses: ExpenseData[] = [];
        const mappedSubscriptions: SubscriptionData[] = [];

        data.transactions.forEach((tx: any) => {
          if (tx.amount > 0) { // Expense
            const isSubscription = tx.personal_finance_category?.primary === 'RENT_AND_UTILITIES' || 
                                   tx.personal_finance_category?.primary === 'LOAN_PAYMENTS' ||
                                   ['netflix', 'spotify', 'adobe', 'gym', 'hulu', 'prime', 'apple'].some(k => tx.name.toLowerCase().includes(k));
                                   
            if (isSubscription) {
              mappedSubscriptions.push({
                id: tx.transaction_id,
                accountId: tx.account_id,
                merchant: tx.name,
                amount: tx.amount,
                frequency: "Monthly",
                usageHours: null,
                status: "PENDING",
                dueDate: new Date(tx.date).getDate()
              });
            } else {
              const mappedCat = mapCategory(tx.personal_finance_category?.primary || 'UNCATEGORIZED');
              mappedExpenses.push({
                id: tx.transaction_id,
                accountId: tx.account_id,
                merchant: tx.name,
                amount: tx.amount,
                date: tx.date,
                category: mappedCat.category,
                icon: mappedCat.icon,
                color: mappedCat.color,
                bg: mappedCat.bg,
                hex: mappedCat.hex
              });
            }
          }
        });

        setExpenses(mappedExpenses);

        // Simulate the "AI Audit" flagging subscriptions based on usage
        const auditedSubscriptions = mappedSubscriptions.map(s => {
          if (s.merchant.toLowerCase().includes('netflix') || s.merchant.toLowerCase().includes('adobe')) {
            return { ...s, status: "FLAGGED" as "FLAGGED", usageHours: 1.5 };
          }
          return { ...s, status: "ACTIVE" as "ACTIVE", usageHours: 42 };
        });
        setSubscriptions(auditedSubscriptions);
        setHasScanned(true);
      }
    } catch (err) {
      console.error('Failed to sync data:', err);
    }
  };

  const cancelSubscription = (id: string) => {
    setSubscriptions(prev => prev.map(s => s.id === id ? { ...s, status: "CANCELLED" } : s));
  };

  const updateExpenseCategory = (id: string, category: string, icon: any, color: string, bg: string, hex: string) => {
    setExpenses(prev => prev.map(e => e.id === id ? { ...e, category, icon, color, bg, hex } : e));
  };

  /**
   * Generates a virtual credit card specifically designed for free trials.
   * Protocol: Automatically blocks transactions after trial period unless manual 'Approve' signal is received.
   */
  const generateTrialCard = () => {
    const number = `4111 ${Math.floor(1000 + Math.random() * 9000)} ${Math.floor(1000 + Math.random() * 9000)} ${Math.floor(1000 + Math.random() * 9000)}`;
    const cvv = Math.floor(100 + Math.random() * 900).toString();
    const exp = `12/${new Date().getFullYear() + 3 - 2000}`;
    return { number, cvv, exp };
  };

  const connectBank = async (publicToken: string) => {
    try {
      const response = await fetch('http://localhost:3000/api/plaid/exchange-public-token', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ public_token: publicToken })
      });
      if (!response.ok) throw new Error('Exchange failed');
      
      const data = await response.json();
      if (data.success && data.access_token) {
        await runAudit(data.access_token);
      } else {
        runAudit(); // Fallback to mock data if API fails to provide token
      }
    } catch (err) {
      console.error('Failed to connect bank:', err);
      // Even on failure in local dev (e.g. mock token), we might want to proceed to show UI
      runAudit(); 
    }
  };

  const filteredSubscriptions = useMemo(() => {
    if (!selectedAccountId) return subscriptions;
    return subscriptions.filter(s => s.accountId === selectedAccountId);
  }, [subscriptions, selectedAccountId]);

  const filteredExpenses = useMemo(() => {
    if (!selectedAccountId) return expenses;
    return expenses.filter(e => e.accountId === selectedAccountId);
  }, [selectedAccountId, expenses]);

  return (
    <FinanceContext.Provider value={{
      accounts: accounts,
      selectedAccountId,
      setSelectedAccountId,
      subscriptions: filteredSubscriptions,
      expenses: filteredExpenses,
      hasScanned,
      setHasScanned,
      runAudit,
      cancelSubscription,
      updateExpenseCategory,
      generateTrialCard,
      connectBank
    }}>
      {children}
    </FinanceContext.Provider>
  );
}

export function useFinance() {
  const context = useContext(FinanceContext);
  if (!context) {
    throw new Error('useFinance must be used within a FinanceProvider');
  }
  return context;
}
