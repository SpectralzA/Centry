import { useState, useCallback, useRef } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, SafeAreaView, Dimensions, FlatList } from 'react-native';
import { GestureHandlerRootView, Swipeable } from 'react-native-gesture-handler';
import { PieChart as PieChartIcon, Receipt, ChevronDown, Utensils, Car, Plane, ShoppingBag, Coffee, ShoppingBasket, HeartPulse, Zap, BookOpen, ChevronRight, ChevronLeft, Lightbulb, CreditCard, X } from 'lucide-react-native';
import Svg, { Path, G } from 'react-native-svg';
import { useFinance } from '../context/FinanceContext';
import { useRouter } from 'expo-router';

const { width } = Dimensions.get('window');

const MONTHS = [
  { label: "May 2026", value: "2026-05" },
  { label: "April 2026", value: "2026-04" },
  { label: "March 2026", value: "2026-03" },
];

const ExpenseItem = ({ item, isLast, updateExpenseCategory }: { item: any, isLast: boolean, updateExpenseCategory: any }) => {
  const swipeableRef = useRef<Swipeable>(null);
  const [page, setPage] = useState(0);
  const Icon = item.icon;

  const handleCategorySelect = (category: string, icon: any, color: string, bg: string, hex: string) => {
    updateExpenseCategory(item.id, category, icon, color, bg, hex);
    swipeableRef.current?.close();
  };

  const renderRightActions = () => (
    <View style={styles.quickActionContainer}>
      {page === 0 ? (
        <>
          <TouchableOpacity style={styles.quickIconBtn} onPress={() => setPage(1)}>
            <ChevronRight size={18} color="#94A3B8" />
          </TouchableOpacity>
          <TouchableOpacity style={styles.quickIconBtn} onPress={() => handleCategorySelect('Food & Drink', Utensils, 'text-green-600', 'bg-green-100', '#16A34A')}>
            <Utensils size={18} color="#16A34A" />
          </TouchableOpacity>
          <TouchableOpacity style={styles.quickIconBtn} onPress={() => handleCategorySelect('Groceries', ShoppingBag, 'text-emerald-600', 'bg-emerald-100', '#059669')}>
            <ShoppingBag size={18} color="#059669" />
          </TouchableOpacity>
          <TouchableOpacity style={styles.quickIconBtn} onPress={() => handleCategorySelect('Transport', Car, 'text-slate-600', 'bg-slate-100', '#475569')}>
            <Car size={18} color="#475569" />
          </TouchableOpacity>
          <TouchableOpacity style={styles.quickIconBtn} onPress={() => handleCategorySelect('Travel', Plane, 'text-blue-600', 'bg-blue-100', '#2563EB')}>
            <Plane size={18} color="#2563EB" />
          </TouchableOpacity>
          <TouchableOpacity style={styles.quickIconBtn} onPress={() => handleCategorySelect('Entertainment', Receipt, 'text-purple-600', 'bg-purple-100', '#9333EA')}>
            <Receipt size={18} color="#9333EA" />
          </TouchableOpacity>
        </>
      ) : (
        <>
          <TouchableOpacity style={styles.quickIconBtn} onPress={() => setPage(0)}>
            <ChevronLeft size={18} color="#94A3B8" />
          </TouchableOpacity>
          <TouchableOpacity style={styles.quickIconBtn} onPress={() => handleCategorySelect('Coffee', Coffee, 'text-amber-600', 'bg-amber-100', '#D97706')}>
            <Coffee size={18} color="#D97706" />
          </TouchableOpacity>
          <TouchableOpacity style={styles.quickIconBtn} onPress={() => handleCategorySelect('Shopping', ShoppingBasket, 'text-pink-600', 'bg-pink-100', '#DB2777')}>
            <ShoppingBasket size={18} color="#DB2777" />
          </TouchableOpacity>
          <TouchableOpacity style={styles.quickIconBtn} onPress={() => handleCategorySelect('Health', HeartPulse, 'text-rose-600', 'bg-rose-100', '#E11D48')}>
            <HeartPulse size={18} color="#E11D48" />
          </TouchableOpacity>
          <TouchableOpacity style={styles.quickIconBtn} onPress={() => handleCategorySelect('Utilities', Zap, 'text-yellow-500', 'bg-yellow-100', '#EAB308')}>
            <Zap size={18} color="#EAB308" />
          </TouchableOpacity>
          <TouchableOpacity style={styles.quickIconBtn} onPress={() => handleCategorySelect('Education', BookOpen, 'text-indigo-600', 'bg-indigo-100', '#4F46E5')}>
            <BookOpen size={18} color="#4F46E5" />
          </TouchableOpacity>
        </>
      )}
    </View>
  );

  return (
    <View style={{ paddingHorizontal: 24 }}>
      <View style={{ backgroundColor: '#fff', paddingHorizontal: 24, borderWidth: 1, borderTopWidth: 0, borderBottomWidth: isLast ? 1 : 0, borderColor: '#E2E8F0', shadowColor: '#000', shadowOffset: { width: 0, height: 4 }, shadowOpacity: isLast ? 0.05 : 0, shadowRadius: isLast ? 12 : 0, elevation: isLast ? 4 : 0 }}>
        <Swipeable ref={swipeableRef} renderRightActions={renderRightActions} overshootRight={false} rightThreshold={40}>
          <View style={[styles.expenseRow, { backgroundColor: '#fff' }]}>
            <View style={styles.merchantInfo}>
              <View style={[styles.iconBox, { backgroundColor: `${item.color.replace('text-', '#').replace('-600', '')}20` }]}>
                <Icon color={item.hex} size={24} />
              </View>
              <View>
                <Text style={styles.merchantName}>{item.merchant}</Text>
                <Text style={styles.categoryName}>{item.category}</Text>
              </View>
            </View>
            <View style={{ alignItems: 'flex-end' }}>
              <Text style={styles.expenseAmount}>${item.amount.toFixed(2)}</Text>
              <Text style={styles.expenseDate}>{new Date(item.date).toLocaleDateString()}</Text>
            </View>
          </View>
        </Swipeable>
      </View>
    </View>
  );
};

export default function ExpensesScreen() {
  const { expenses, updateExpenseCategory, accounts, selectedAccountId, setSelectedAccountId } = useFinance();
  const router = useRouter();
  const [selectedMonth, setSelectedMonth] = useState(MONTHS[0].value);
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  const [isAccountDropdownOpen, setIsAccountDropdownOpen] = useState(false);

  const filteredExpenses = expenses.filter(e => e.date.startsWith(selectedMonth));
  const totalExpenses = filteredExpenses.reduce((acc, curr) => acc + curr.amount, 0);

  const categoryTotals = filteredExpenses.reduce((acc, curr) => {
    if (!acc[curr.category]) {
      acc[curr.category] = { name: curr.category, value: 0, color: curr.hex };
    }
    acc[curr.category].value += curr.amount;
    return acc;
  }, {} as Record<string, { name: string, value: number, color: string }>);

  const categoryData = Object.values(categoryTotals).sort((a, b) => b.value - a.value);
  const currentMonthLabel = MONTHS.find(m => m.value === selectedMonth)?.label;

  const currentIndex = MONTHS.findIndex(m => m.value === selectedMonth);
  const prevMonthValue = currentIndex < MONTHS.length - 1 ? MONTHS[currentIndex + 1].value : null;
  const prevExpenses = prevMonthValue ? expenses.filter(e => e.date.startsWith(prevMonthValue)) : [];
  
  const prevCategoryTotals = prevExpenses.reduce((acc, curr) => {
    if (!acc[curr.category]) acc[curr.category] = 0;
    acc[curr.category] += curr.amount;
    return acc;
  }, {} as Record<string, number>);

  const getTrend = (catName: string, currentValue: number) => {
    const prevValue = prevCategoryTotals[catName] || 0;
    if (prevValue === 0) return { text: '+100% vs last month', color: '#94A3B8' };
    
    const pctChange = ((currentValue - prevValue) / prevValue) * 100;
    const absPct = Math.abs(pctChange);
    const sign = pctChange > 0 ? '+' : '';
    
    let color = '#94A3B8';
    if (absPct > 15) {
      color = pctChange > 0 ? '#DC2626' : '#059669';
    }

    return { text: `${sign}${pctChange.toFixed(0)}% vs last month`, color };
  };

  const handleNextMonth = () => {
    if (currentIndex < MONTHS.length - 1) {
      setSelectedMonth(MONTHS[currentIndex + 1].value);
    }
  };

  const generateInsights = () => {
    const insights = [];
    
    // Spend Trend Insight
    const currentTotal = totalExpenses;
    const prevTotal = Object.values(prevCategoryTotals).reduce((a, b) => a + b, 0);
    
    if (prevTotal > 0) {
      if (currentTotal < prevTotal) {
        insights.push({
          icon: <HeartPulse color="#059669" size={18} />,
          text: `Great job! You've spent $${(prevTotal - currentTotal).toFixed(2)} less than last month.`,
          bgColor: '#D1FAE5',
          textColor: '#059669'
        });
      } else if (currentTotal > prevTotal) {
        insights.push({
          icon: <Zap color="#DC2626" size={18} />,
          text: `You've spent $${(currentTotal - prevTotal).toFixed(2)} more than last month.`,
          bgColor: '#FEE2E2',
          textColor: '#DC2626'
        });
      }
    }

    // Optimization Insight
    const checkingAccount = accounts.find(a => a.type === 'CHECKING');
    const amexAccount = accounts.find(a => a.name.includes('Amex'));
    const isCheckingSelected = selectedAccountId === checkingAccount?.id || selectedAccountId === null;

    if (isCheckingSelected && categoryTotals['Travel']?.value > 0) {
      insights.push({
        icon: <Plane color="#2563EB" size={18} />,
        text: `You have travel expenses. Use ${amexAccount?.name || 'rewards card'} for flights to earn 5x points!`,
        bgColor: '#DBEAFE',
        textColor: '#2563EB'
      });
    }

    if (selectedAccountId === amexAccount?.id && categoryTotals['Travel']?.value > 0) {
      insights.push({
        icon: <Lightbulb color="#D97706" size={18} />,
        text: `Maximizing travel rewards! Earned est. ${(categoryTotals['Travel'].value * 5).toFixed(0)} points.`,
        bgColor: '#FEF3C7',
        textColor: '#D97706'
      });
    }

    if (insights.length === 0) {
      insights.push({
        icon: <Lightbulb color="#7C3AED" size={18} />,
        text: "You're on track! Keep reviewing your expenses.",
        bgColor: '#EDE9FE',
        textColor: '#7C3AED'
      });
    }

    return insights;
  };

  const createPieSlices = () => {
    let cumulativeValue = 0;
    const cx = 100;
    const cy = 100;
    const r = 80;
    const innerR = 50;
    
    if (totalExpenses === 0) return null;

    return categoryData.map((slice, i) => {
      const startAngle = (cumulativeValue / totalExpenses) * 360;
      cumulativeValue += slice.value;
      const endAngle = (cumulativeValue / totalExpenses) * 360;
      
      const startRad = (startAngle - 90) * Math.PI / 180;
      const endRad = (endAngle - 90) * Math.PI / 180;
      
      const x1 = cx + r * Math.cos(startRad);
      const y1 = cy + r * Math.sin(startRad);
      const x2 = cx + r * Math.cos(endRad);
      const y2 = cy + r * Math.sin(endRad);
      
      const largeArcFlag = endAngle - startAngle > 180 ? 1 : 0;
      
      const ix1 = cx + innerR * Math.cos(endRad);
      const iy1 = cy + innerR * Math.sin(endRad);
      const ix2 = cx + innerR * Math.cos(startRad);
      const iy2 = cy + innerR * Math.sin(startRad);

      let d;
      if (endAngle - startAngle === 360) {
        d = `M ${cx} ${cy - r} A ${r} ${r} 0 1 1 ${cx} ${cy + r} A ${r} ${r} 0 1 1 ${cx} ${cy - r} Z`;
      } else {
        d = `M ${x1} ${y1} A ${r} ${r} 0 ${largeArcFlag} 1 ${x2} ${y2} L ${ix1} ${iy1} A ${innerR} ${innerR} 0 ${largeArcFlag} 0 ${ix2} ${iy2} Z`;
      }

      return <Path key={i} d={d} fill={slice.color} />;
    });
  };

  const renderHeader = () => {
    return (
    <View style={styles.scrollContent}>
      {/* Category Breakdown */}
      <View style={styles.card}>
        <View style={styles.cardHeader}>
          <PieChartIcon color="#A855F7" size={20} />
          <Text style={styles.cardTitle}>Category Breakdown</Text>
        </View>

        <View style={styles.chartContainer}>
          {totalExpenses > 0 ? (
            <View style={styles.pieWrapper}>
              <Svg width={200} height={200} viewBox="0 0 200 200">
                <G>{createPieSlices()}</G>
              </Svg>
              <View style={styles.pieCenterText}>
                <Text style={styles.totalValue}>${totalExpenses.toFixed(0)}</Text>
                <Text style={styles.totalLabel}>TOTAL</Text>
              </View>
            </View>
          ) : (
            <Text style={styles.emptyText}>No expenses this month.</Text>
          )}
        </View>

        <View style={styles.legendContainer}>
          {categoryData.map(cat => {
            const trend = getTrend(cat.name, cat.value);
            return (
              <View key={cat.name} style={styles.legendRow}>
                <View style={styles.legendLeft}>
                  <View style={[styles.legendColor, { backgroundColor: cat.color }]} />
                  <View>
                    <Text style={styles.legendName}>{cat.name}</Text>
                    <Text style={[styles.trendText, { color: trend.color }]}>{trend.text}</Text>
                  </View>
                </View>
                <Text style={styles.legendAmount}>${cat.value.toFixed(2)}</Text>
              </View>
            );
          })}
        </View>
      </View>

      <View style={[styles.card, { paddingBottom: 0, overflow: 'hidden' }]}>
        <View style={styles.cardHeader}>
          <Receipt color="#3B82F6" size={20} />
          <Text style={styles.cardTitle}>Transactions</Text>
        </View>
      </View>
    </View>
    );
  };

  const renderFooter = () => {
    const insights = generateInsights();
    
    return (
    <View style={{ paddingHorizontal: 24, paddingBottom: 24 }}>
      <View style={{ backgroundColor: '#fff', borderBottomLeftRadius: 24, borderBottomRightRadius: 24, padding: 24, paddingTop: 0, borderWidth: 1, borderTopWidth: 0, borderColor: '#E2E8F0', shadowColor: '#000', shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.05, shadowRadius: 12, elevation: 4 }}>
        {filteredExpenses.length === 0 && (
          <Text style={styles.emptyText}>No transactions found for {currentMonthLabel}.</Text>
        )}
        {currentIndex < MONTHS.length - 1 && (
          <TouchableOpacity style={styles.loadMoreBtn} onPress={handleNextMonth}>
            <Text style={styles.loadMoreText}>See previous month</Text>
          </TouchableOpacity>
        )}
      </View>

      {/* Smart Insights */}
      <View style={[styles.card, { marginTop: 20, marginBottom: 0 }]}>
        <View style={styles.cardHeader}>
          <Lightbulb color="#F59E0B" size={20} />
          <Text style={styles.cardTitle}>Smart Insights</Text>
        </View>
        <View style={{ gap: 12 }}>
          {insights.map((insight, idx) => (
            <View key={idx} style={{ flexDirection: 'row', alignItems: 'center', backgroundColor: insight.bgColor, padding: 16, borderRadius: 12, gap: 12 }}>
              <View style={{ width: 36, height: 36, borderRadius: 18, backgroundColor: '#ffffff80', alignItems: 'center', justifyContent: 'center' }}>
                {insight.icon}
              </View>
              <Text style={{ flex: 1, fontSize: 14, color: insight.textColor, fontWeight: '600', lineHeight: 20 }}>{insight.text}</Text>
            </View>
          ))}
        </View>
      </View>
    </View>
    );
  };

  const renderExpenseItem = useCallback(({ item, index }: { item: any, index: number }) => {
    return <ExpenseItem item={item} isLast={index === filteredExpenses.length - 1} updateExpenseCategory={updateExpenseCategory} />;
  }, [filteredExpenses.length, updateExpenseCategory]);

  return (
    <GestureHandlerRootView style={{ flex: 1 }}>
      <SafeAreaView style={styles.container}>
        <View style={styles.header}>
        <View style={styles.headerTop}>
          <Text style={styles.headerTitle}>Recent Expenses</Text>
          <TouchableOpacity style={styles.closeBtn} onPress={() => router.back()}>
             <X size={20} color="#0F172A" />
          </TouchableOpacity>
        </View>
        
        <View style={{ flexDirection: 'row', gap: 12, zIndex: 50 }}>
          {/* Account Dropdown */}
          <View style={{ flex: 1, zIndex: isAccountDropdownOpen ? 60 : 50 }}>
            <TouchableOpacity 
              style={styles.dropdownButton}
              onPress={() => {
                setIsAccountDropdownOpen(!isAccountDropdownOpen);
                setIsDropdownOpen(false);
              }}
            >
              <View style={{ flexDirection: 'row', alignItems: 'center', flex: 1 }}>
                <CreditCard size={16} color="#64748B" style={{ marginRight: 8 }} />
                <Text style={styles.dropdownText} numberOfLines={1}>
                  {selectedAccountId ? accounts.find(a => a.id === selectedAccountId)?.name : 'All Cards'}
                </Text>
              </View>
              <ChevronDown size={16} color="#64748B" />
            </TouchableOpacity>
            
            {isAccountDropdownOpen && (
              <View style={styles.dropdownMenu}>
                <TouchableOpacity
                  style={[styles.dropdownItem, selectedAccountId === null && styles.dropdownItemActive]}
                  onPress={() => {
                    setSelectedAccountId(null);
                    setIsAccountDropdownOpen(false);
                  }}
                >
                  <Text style={[styles.dropdownItemText, selectedAccountId === null && styles.dropdownItemTextActive]}>All Cards</Text>
                </TouchableOpacity>
                {accounts.map(account => (
                  <TouchableOpacity
                    key={account.id}
                    style={[styles.dropdownItem, selectedAccountId === account.id && styles.dropdownItemActive]}
                    onPress={() => {
                      setSelectedAccountId(account.id);
                      setIsAccountDropdownOpen(false);
                    }}
                  >
                    <Text style={[styles.dropdownItemText, selectedAccountId === account.id && styles.dropdownItemTextActive]}>
                      {account.name}
                    </Text>
                  </TouchableOpacity>
                ))}
              </View>
            )}
          </View>

          {/* Month Dropdown */}
          <View style={{ flex: 1, zIndex: isDropdownOpen ? 60 : 50 }}>
            <TouchableOpacity 
              style={styles.dropdownButton}
              onPress={() => {
                setIsDropdownOpen(!isDropdownOpen);
                setIsAccountDropdownOpen(false);
              }}
            >
              <Text style={styles.dropdownText} numberOfLines={1}>{currentMonthLabel}</Text>
              <ChevronDown size={16} color="#64748B" />
            </TouchableOpacity>
            
            {isDropdownOpen && (
              <View style={styles.dropdownMenu}>
                {MONTHS.map(month => (
                  <TouchableOpacity
                    key={month.value}
                    style={[styles.dropdownItem, selectedMonth === month.value && styles.dropdownItemActive]}
                    onPress={() => {
                      setSelectedMonth(month.value);
                      setIsDropdownOpen(false);
                    }}
                  >
                    <Text style={[styles.dropdownItemText, selectedMonth === month.value && styles.dropdownItemTextActive]}>
                      {month.label}
                    </Text>
                  </TouchableOpacity>
                ))}
              </View>
            )}
          </View>
        </View>
      </View>

      <FlatList
        data={filteredExpenses}
        keyExtractor={item => item.id}
        renderItem={renderExpenseItem}
        ListHeaderComponent={renderHeader}
        ListFooterComponent={renderFooter}
        showsVerticalScrollIndicator={false}
      />
      </SafeAreaView>
    </GestureHandlerRootView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#F8FAFC' },
  header: { padding: 24, paddingTop: 20, zIndex: 10 },
  headerTop: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 },
  headerTitle: { fontSize: 32, fontWeight: '800', color: '#0F172A' },
  closeBtn: { padding: 8, backgroundColor: '#E2E8F0', borderRadius: 20 },
  dropdownButton: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', backgroundColor: '#fff', paddingHorizontal: 16, paddingVertical: 12, borderRadius: 12, borderWidth: 1, borderColor: '#E2E8F0' },
  dropdownText: { fontSize: 16, fontWeight: '600', color: '#334155' },
  dropdownMenu: { position: 'absolute', top: 52, left: 0, right: 0, backgroundColor: '#fff', borderRadius: 12, borderWidth: 1, borderColor: '#E2E8F0', shadowColor: '#000', shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.1, shadowRadius: 12, elevation: 5 },
  dropdownItem: { paddingHorizontal: 16, paddingVertical: 14, borderBottomWidth: 1, borderBottomColor: '#F1F5F9' },
  dropdownItemActive: { backgroundColor: '#EFF6FF' },
  dropdownItemText: { fontSize: 15, color: '#475569' },
  dropdownItemTextActive: { color: '#2563EB', fontWeight: '600' },
  scrollContent: { paddingHorizontal: 24, paddingTop: 0 },
  card: { backgroundColor: '#fff', borderTopLeftRadius: 24, borderTopRightRadius: 24, borderRadius: 24, padding: 24, marginBottom: 20, borderWidth: 1, borderColor: '#E2E8F0', shadowColor: '#000', shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.05, shadowRadius: 12, elevation: 4 },
  cardHeader: { flexDirection: 'row', alignItems: 'center', marginBottom: 24 },
  cardTitle: { fontSize: 18, fontWeight: '700', color: '#0F172A', marginLeft: 8 },
  chartContainer: { alignItems: 'center', justifyContent: 'center', minHeight: 200 },
  pieWrapper: { width: 200, height: 200, position: 'relative' },
  pieCenterText: { position: 'absolute', top: 0, left: 0, right: 0, bottom: 0, alignItems: 'center', justifyContent: 'center' },
  totalValue: { fontSize: 24, fontWeight: '800', color: '#0F172A' },
  totalLabel: { fontSize: 10, color: '#64748B', fontWeight: '700', marginTop: 2, letterSpacing: 1 },
  emptyText: { textAlign: 'center', color: '#94A3B8', fontSize: 14, paddingVertical: 20 },
  legendContainer: { marginTop: 24, gap: 16 },
  legendRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  legendLeft: { flexDirection: 'row', alignItems: 'center' },
  legendColor: { width: 12, height: 12, borderRadius: 6, marginRight: 12 },
  legendName: { fontSize: 15, color: '#0F172A', fontWeight: '600' },
  trendText: { fontSize: 12, marginTop: 2, fontWeight: '500' },
  legendAmount: { fontSize: 15, color: '#0F172A', fontWeight: '800' },
  expenseRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingVertical: 16, borderBottomWidth: 1, borderBottomColor: '#F1F5F9' },
  merchantInfo: { flexDirection: 'row', alignItems: 'center' },
  iconBox: { width: 44, height: 44, borderRadius: 12, alignItems: 'center', justifyContent: 'center', marginRight: 12 },
  merchantName: { fontSize: 16, color: '#0F172A', fontWeight: '700' },
  categoryName: { fontSize: 13, color: '#64748B', marginTop: 2 },
  expenseAmount: { fontSize: 16, color: '#0F172A', fontWeight: '800', marginBottom: 2 },
  expenseDate: { fontSize: 12, color: '#94A3B8' },
  loadMoreBtn: { marginTop: 16, paddingVertical: 16, alignItems: 'center', backgroundColor: '#F8FAFC', borderRadius: 12 },
  loadMoreText: { color: '#2563EB', fontWeight: '600', fontSize: 14 },
  quickActionContainer: { flex: 1, flexDirection: 'row', alignItems: 'center', justifyContent: 'flex-end', paddingRight: 16, backgroundColor: '#F8FAFC' },
  quickIconBtn: { width: 36, height: 36, borderRadius: 18, backgroundColor: '#fff', alignItems: 'center', justifyContent: 'center', marginLeft: 8, borderWidth: 1, borderColor: '#E2E8F0' },
});
