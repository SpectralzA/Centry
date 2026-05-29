import React, { useState, useMemo } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, SafeAreaView } from 'react-native';
import { useRouter } from 'expo-router';
import { useFinance } from '../context/FinanceContext';
import { Settings, CreditCard, PieChart as PieChartIcon, Receipt, MoveUp, MoveDown, Lock, ArrowRight, ShieldCheck } from 'lucide-react-native';
import { PlaidLinkButton } from '../components/PlaidLinkButton';

const WIDGET_TYPES = {
  SUBSCRIPTIONS: 'SUBSCRIPTIONS',
  EXPENSES: 'EXPENSES',
  ANALYTICS: 'ANALYTICS',
  VCC: 'VCC'
};

export default function DashboardScreen() {
  const router = useRouter();
  const { accounts, subscriptions, expenses, generateTrialCard, hasScanned, connectBank } = useFinance();
  const [isEditMode, setIsEditMode] = useState(false);
  const [widgetOrder, setWidgetOrder] = useState([
    WIDGET_TYPES.SUBSCRIPTIONS,
    WIDGET_TYPES.EXPENSES,
    WIDGET_TYPES.ANALYTICS,
    WIDGET_TYPES.VCC
  ]);
  const [vcc, setVcc] = useState<{ number: string, cvv: string, exp: string } | null>(null);

  const totalBalance = useMemo(() => accounts.reduce((acc, curr) => acc + curr.balance, 0), [accounts]);
  
  const activeSubs = subscriptions.filter(s => s.status === 'ACTIVE' || s.status === 'FLAGGED');
  const totalSubCost = activeSubs.reduce((acc, curr) => acc + curr.amount, 0);
  
  const currentMonth = "2026-05";
  const monthlyExpenses = expenses.filter(e => e.date.startsWith(currentMonth));
  const totalExpenses = monthlyExpenses.reduce((acc, curr) => acc + curr.amount, 0);

  const moveWidget = (index: number, direction: 'up' | 'down') => {
    const newOrder = [...widgetOrder];
    if (direction === 'up' && index > 0) {
      [newOrder[index], newOrder[index - 1]] = [newOrder[index - 1], newOrder[index]];
    } else if (direction === 'down' && index < newOrder.length - 1) {
      [newOrder[index], newOrder[index + 1]] = [newOrder[index + 1], newOrder[index]];
    }
    setWidgetOrder(newOrder);
  };

  const renderWidgetWrapper = (id: string, index: number, content: React.ReactNode, onPress?: () => void) => {
    return (
      <View key={id} style={styles.widgetWrapper}>
        <TouchableOpacity 
          style={styles.widgetCard} 
          onPress={onPress} 
          disabled={isEditMode || !onPress}
          activeOpacity={0.8}
        >
          {content}
        </TouchableOpacity>
        
        {isEditMode && (
          <View style={styles.editControls}>
            <TouchableOpacity 
              style={[styles.editBtn, index === 0 && styles.editBtnDisabled]} 
              onPress={() => moveWidget(index, 'up')}
              disabled={index === 0}
            >
              <MoveUp size={20} color={index === 0 ? "#CBD5E1" : "#475569"} />
            </TouchableOpacity>
            <TouchableOpacity 
              style={[styles.editBtn, index === widgetOrder.length - 1 && styles.editBtnDisabled]} 
              onPress={() => moveWidget(index, 'down')}
              disabled={index === widgetOrder.length - 1}
            >
              <MoveDown size={20} color={index === widgetOrder.length - 1 ? "#CBD5E1" : "#475569"} />
            </TouchableOpacity>
          </View>
        )}
      </View>
    );
  };

  const renderSubscriptionsWidget = () => (
    <View style={styles.widgetContent}>
      <View style={styles.widgetHeader}>
        <View style={styles.widgetHeaderLeft}>
          <CreditCard color="#3B82F6" size={20} />
          <Text style={styles.widgetTitle}>Active Subscriptions</Text>
        </View>
        {!isEditMode && <ArrowRight size={16} color="#94A3B8" />}
      </View>
      <View style={styles.widgetBody}>
        <Text style={styles.widgetBigNumber}>${totalSubCost.toFixed(2)}<Text style={styles.widgetBigNumberSub}>/mo</Text></Text>
        <Text style={styles.widgetSubText}>{activeSubs.length} Active Services</Text>
        
        <View style={styles.miniList}>
          {activeSubs.slice(0, 2).map(sub => (
            <View key={sub.id} style={styles.miniListItem}>
              <Text style={styles.miniListText}>{sub.merchant}</Text>
              <Text style={styles.miniListAmount}>${sub.amount.toFixed(2)}</Text>
            </View>
          ))}
          {activeSubs.length > 2 && (
            <Text style={styles.miniListMore}>+ {activeSubs.length - 2} more</Text>
          )}
        </View>
      </View>
    </View>
  );

  const renderExpensesWidget = () => (
    <View style={styles.widgetContent}>
      <View style={styles.widgetHeader}>
        <View style={styles.widgetHeaderLeft}>
          <Receipt color="#F59E0B" size={20} />
          <Text style={styles.widgetTitle}>Recent Expenses</Text>
        </View>
        {!isEditMode && <ArrowRight size={16} color="#94A3B8" />}
      </View>
      <View style={styles.widgetBody}>
        <Text style={styles.widgetBigNumber}>${totalExpenses.toFixed(2)}</Text>
        <Text style={styles.widgetSubText}>Spent this month</Text>
        
        <View style={styles.miniList}>
          {monthlyExpenses.slice(0, 2).map(exp => (
            <View key={exp.id} style={styles.miniListItem}>
              <Text style={styles.miniListText}>{exp.merchant}</Text>
              <Text style={styles.miniListAmount}>${exp.amount.toFixed(2)}</Text>
            </View>
          ))}
        </View>
      </View>
    </View>
  );

  const renderAnalyticsWidget = () => (
    <View style={styles.widgetContent}>
      <View style={styles.widgetHeader}>
        <View style={styles.widgetHeaderLeft}>
          <PieChartIcon color="#A855F7" size={20} />
          <Text style={styles.widgetTitle}>Analytics</Text>
        </View>
        {!isEditMode && <ArrowRight size={16} color="#94A3B8" />}
      </View>
      <View style={styles.widgetBody}>
        <Text style={styles.widgetSubText}>Tap to view your category breakdown and cashflow trends.</Text>
        <View style={styles.fakeChart}>
          <View style={[styles.fakeBar, { height: 30, backgroundColor: '#E2E8F0' }]} />
          <View style={[styles.fakeBar, { height: 50, backgroundColor: '#E2E8F0' }]} />
          <View style={[styles.fakeBar, { height: 40, backgroundColor: '#E2E8F0' }]} />
          <View style={[styles.fakeBar, { height: 70, backgroundColor: '#A855F7' }]} />
          <View style={[styles.fakeBar, { height: 60, backgroundColor: '#E2E8F0' }]} />
        </View>
      </View>
    </View>
  );

  const renderVccWidget = () => (
    <View style={styles.widgetContent}>
      <View style={styles.widgetHeader}>
        <View style={styles.widgetHeaderLeft}>
          <Lock color="#10B981" size={20} />
          <Text style={styles.widgetTitle}>Trial Sentinel Card</Text>
        </View>
      </View>
      <View style={styles.widgetBody}>
        {vcc ? (
          <View style={styles.vccDisplay}>
            <Text style={styles.vccNumber}>{vcc.number}</Text>
            <View style={styles.vccDetails}>
              <Text style={styles.vccDetailText}>EXP: {vcc.exp}</Text>
              <Text style={styles.vccDetailText}>CVV: {vcc.cvv}</Text>
            </View>
          </View>
        ) : (
          <View>
            <Text style={styles.widgetSubText}>Generate a secure virtual card for your next free trial. It auto-locks to prevent surprise charges.</Text>
            <TouchableOpacity 
              style={styles.actionBtn}
              onPress={() => setVcc(generateTrialCard())}
              disabled={isEditMode}
            >
              <Text style={styles.actionBtnText}>Generate Trial Card</Text>
            </TouchableOpacity>
          </View>
        )}
      </View>
    </View>
  );

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <View>
          <Text style={styles.greeting}>Welcome back,</Text>
          <Text style={styles.totalBalance}>${totalBalance.toLocaleString()}</Text>
        </View>
        <TouchableOpacity 
          style={styles.editModeBtn}
          onPress={() => setIsEditMode(!isEditMode)}
        >
          <Settings size={24} color={isEditMode ? "#3B82F6" : "#64748B"} />
        </TouchableOpacity>
      </View>

      <ScrollView style={styles.scrollContainer} contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
        {!hasScanned ? (
          <View style={styles.emptyStateContainer}>
            <View style={styles.emptyIconCircle}>
               <ShieldCheck color="#3B82F6" size={48} />
            </View>
            <Text style={styles.emptyStateTitle}>Connect Your Bank</Text>
            <Text style={styles.emptyStateText}>
              Securely link your bank account to automatically discover subscriptions, track expenses, and view your net worth.
            </Text>
            <PlaidLinkButton 
              onSuccess={async (token) => {
                await connectBank(token);
              }}
              style={{ width: '100%', marginTop: 12 }}
            />
          </View>
        ) : (
          <>
            {isEditMode && (
              <View style={styles.editModeBanner}>
                <Text style={styles.editModeBannerText}>Edit Mode Active. Use arrows to reorder.</Text>
              </View>
            )}

            {widgetOrder.map((widget, index) => {
              if (widget === WIDGET_TYPES.SUBSCRIPTIONS) {
                return renderWidgetWrapper(widget, index, renderSubscriptionsWidget(), () => router.push('/subscriptions_modal'));
              }
              if (widget === WIDGET_TYPES.EXPENSES) {
                return renderWidgetWrapper(widget, index, renderExpensesWidget(), () => router.push('/expenses_modal'));
              }
              if (widget === WIDGET_TYPES.ANALYTICS) {
                return renderWidgetWrapper(widget, index, renderAnalyticsWidget(), () => router.push('/analytics_modal'));
              }
              if (widget === WIDGET_TYPES.VCC) {
                return renderWidgetWrapper(widget, index, renderVccWidget(), undefined);
              }
              return null;
            })}
          </>
        )}
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#F8FAFC' },
  header: { padding: 24, paddingTop: 20, flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  greeting: { fontSize: 16, color: '#64748B', fontWeight: '500' },
  totalBalance: { fontSize: 36, fontWeight: '800', color: '#0F172A', marginTop: 4 },
  editModeBtn: { width: 44, height: 44, borderRadius: 22, backgroundColor: '#fff', alignItems: 'center', justifyContent: 'center', borderWidth: 1, borderColor: '#E2E8F0' },
  scrollContainer: { flex: 1 },
  scrollContent: { paddingHorizontal: 24, paddingBottom: 40, gap: 16 },
  editModeBanner: { backgroundColor: '#DBEAFE', padding: 12, borderRadius: 12, marginBottom: 8 },
  editModeBannerText: { color: '#2563EB', fontSize: 14, fontWeight: '600', textAlign: 'center' },
  widgetWrapper: { flexDirection: 'row', alignItems: 'center', gap: 12 },
  widgetCard: { flex: 1, backgroundColor: '#fff', borderRadius: 24, borderWidth: 1, borderColor: '#E2E8F0', shadowColor: '#000', shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.05, shadowRadius: 12, elevation: 4 },
  editControls: { width: 48, gap: 8 },
  editBtn: { width: 48, height: 48, borderRadius: 24, backgroundColor: '#fff', alignItems: 'center', justifyContent: 'center', borderWidth: 1, borderColor: '#E2E8F0' },
  editBtnDisabled: { backgroundColor: '#F8FAFC', borderColor: '#F1F5F9' },
  widgetContent: { padding: 24 },
  widgetHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 },
  widgetHeaderLeft: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  widgetTitle: { fontSize: 16, fontWeight: '700', color: '#0F172A' },
  widgetBody: {},
  widgetBigNumber: { fontSize: 28, fontWeight: '800', color: '#0F172A' },
  widgetBigNumberSub: { fontSize: 16, color: '#64748B', fontWeight: '600' },
  widgetSubText: { fontSize: 14, color: '#64748B', marginTop: 4, lineHeight: 20 },
  miniList: { marginTop: 16, gap: 12, borderTopWidth: 1, borderTopColor: '#F1F5F9', paddingTop: 16 },
  miniListItem: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  miniListText: { fontSize: 15, color: '#334155', fontWeight: '500' },
  miniListAmount: { fontSize: 15, color: '#0F172A', fontWeight: '700' },
  miniListMore: { fontSize: 13, color: '#94A3B8', fontStyle: 'italic', marginTop: 4 },
  fakeChart: { flexDirection: 'row', alignItems: 'flex-end', justifyContent: 'space-between', height: 80, marginTop: 16, paddingHorizontal: 8 },
  fakeBar: { width: '15%', borderRadius: 4 },
  actionBtn: { marginTop: 16, backgroundColor: '#10B981', paddingVertical: 14, borderRadius: 12, alignItems: 'center' },
  actionBtnText: { color: '#fff', fontWeight: '700', fontSize: 15 },
  vccDisplay: { marginTop: 16, backgroundColor: '#0F172A', padding: 20, borderRadius: 16 },
  vccNumber: { color: '#fff', fontSize: 20, fontWeight: '600', letterSpacing: 2, marginBottom: 16 },
  vccDetails: { flexDirection: 'row', justifyContent: 'space-between' },
  vccDetailText: { color: '#94A3B8', fontSize: 14, fontWeight: '500' },
  emptyStateContainer: { alignItems: 'center', justifyContent: 'center', paddingVertical: 40, paddingHorizontal: 16 },
  emptyIconCircle: { width: 96, height: 96, borderRadius: 48, backgroundColor: '#EFF6FF', alignItems: 'center', justifyContent: 'center', marginBottom: 24 },
  emptyStateTitle: { fontSize: 24, fontWeight: '800', color: '#0F172A', marginBottom: 12 },
  emptyStateText: { fontSize: 16, color: '#64748B', textAlign: 'center', lineHeight: 24, marginBottom: 32 }
});
