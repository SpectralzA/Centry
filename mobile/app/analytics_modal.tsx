import React, { useEffect, useRef, useState } from 'react';
import { View, Text, StyleSheet, ScrollView, Animated, SafeAreaView, Dimensions, PanResponder, TouchableOpacity, Modal } from 'react-native';
import { TrendingDown, Plus, X, ChevronDown, Check } from 'lucide-react-native';
import { useFinance } from '../context/FinanceContext';
import { useRouter } from 'expo-router';

const { width } = Dimensions.get('window');

// Grid Dimensions
const CONTAINER_PADDING = 24;
const GAP = 16;
const COLS = 2;
const CARD_WIDTH = (width - (CONTAINER_PADDING * 2) - GAP) / 2;
const CARD_HEIGHT = 120;

const MONTHLY_EXPENSES = [
  { month: "Jan", expenses: 1250 },
  { month: "Feb", expenses: 1100 },
  { month: "Mar", expenses: 1400 },
  { month: "Apr", expenses: 950 },
  { month: "May", expenses: 1050 },
];

// --- WIDGET REGISTRY ---
const WIDGET_REGISTRY: Record<string, any> = {
  monthly_subs: {
    title: 'Monthly Subs', sub: 'Active recurring', cols: 1, rows: 1,
    renderValue: (data: any) => `$${data.activeSubsTotal.toFixed(2)}`,
    bg: '#fff', border: '#E2E8F0', text: '#0F172A', label: '#64748B'
  },
  savings_roi: {
    title: 'Savings ROI', sub: 'Recovered /mo', cols: 1, rows: 1,
    renderValue: (data: any) => `$${data.savingsTotal.toFixed(2)}`,
    bg: '#ECFDF5', border: '#10B981', text: '#059669', label: '#059669'
  },
  phantom_subs: {
    title: 'Phantom Subs', sub: 'High risk', cols: 1, rows: 1,
    renderValue: (data: any) => data.phantomCount,
    dynamicStyle: (data: any) => ({
      bg: data.phantomCount > 0 ? '#FEF2F2' : '#F8FAFC',
      border: data.phantomCount > 0 ? '#EF4444' : '#E2E8F0',
      text: data.phantomCount > 0 ? '#DC2626' : '#0F172A',
      label: data.phantomCount > 0 ? '#DC2626' : '#64748B'
    })
  },
  annual_run_rate: {
    title: 'Annual Run-Rate', sub: 'Projected yearly', cols: 1, rows: 1,
    renderValue: (data: any) => `$${(data.activeSubsTotal * 12).toFixed(0)}`,
    bg: '#fff', border: '#E2E8F0', text: '#0F172A', label: '#64748B'
  },
  top_merchant: {
    title: 'Top Merchant', sub: 'Highest spend', cols: 1, rows: 1,
    renderValue: (data: any) => data.topMerchant || 'None',
    bg: '#F8FAFC', border: '#CBD5E1', text: '#334155', label: '#64748B'
  },
  flagged_ratio: {
    title: 'Flagged Ratio', sub: 'Of total subs', cols: 1, rows: 1,
    renderValue: (data: any) => `${data.totalCount ? Math.round((data.phantomCount / data.totalCount) * 100) : 0}%`,
    bg: '#FFFBEB', border: '#F59E0B', text: '#D97706', label: '#B45309'
  },
  net_worth: {
    title: 'Net Worth', sub: 'Total Assets', cols: 1, rows: 1,
    renderValue: (data: any) => `$${data.netWorth.toLocaleString()}`,
    bg: '#F8FAFC', border: '#CBD5E1', text: '#0F172A', label: '#64748B'
  },
  monthly_income: {
    title: 'Monthly Income', sub: 'Total Inflow', cols: 1, rows: 1,
    renderValue: (data: any) => `$${data.monthlyIncome.toLocaleString()}`,
    bg: '#F0FDF4', border: '#86EFAC', text: '#15803D', label: '#16A34A'
  },
  cash_flow: {
    title: 'Cash Flow', sub: 'Income - Expenses', cols: 1, rows: 1,
    renderValue: (data: any) => `${data.cashFlow >= 0 ? '+' : ''}$${data.cashFlow.toLocaleString()}`,
    dynamicStyle: (data: any) => ({
      bg: data.cashFlow >= 0 ? '#ECFDF5' : '#FEF2F2',
      border: data.cashFlow >= 0 ? '#10B981' : '#EF4444',
      text: data.cashFlow >= 0 ? '#059669' : '#DC2626',
      label: data.cashFlow >= 0 ? '#059669' : '#DC2626'
    })
  },
  credit_utilization: {
    title: 'Credit Usage', sub: 'Of Total Limits', cols: 1, rows: 1,
    renderValue: (data: any) => `${data.creditUtilization}%`,
    bg: '#FFFBEB', border: '#F59E0B', text: '#D97706', label: '#B45309'
  },
  top_category: {
    title: 'Top Category', sub: 'Highest Spend', cols: 1, rows: 1,
    renderValue: (data: any) => data.topCategory,
    bg: '#F8FAFC', border: '#CBD5E1', text: '#334155', label: '#64748B'
  },
  upcoming_bills: {
    title: 'Upcoming Bills', sub: 'Next 7 Days', cols: 2, rows: 2,
    customRender: (data: any) => (
      <View style={{ flex: 1 }}>
        <Text style={{ fontSize: 16, fontWeight: '700', color: '#0F172A', marginBottom: 4 }}>Upcoming Bills</Text>
        <Text style={{ fontSize: 12, color: '#64748B', marginBottom: 16 }}>Next 7 days</Text>
        {(!data.upcomingBills || data.upcomingBills.length === 0) ? (
          <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}>
            <Text style={{ color: '#94A3B8', fontSize: 13 }}>No upcoming bills.</Text>
          </View>
        ) : (
          <View style={{ gap: 12 }}>
            {data.upcomingBills.slice(0, 3).map((bill: any) => (
              <View key={bill.id} style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}>
                <View>
                  <Text style={{ fontSize: 14, fontWeight: '600', color: '#0F172A' }}>{bill.merchant}</Text>
                  <Text style={{ fontSize: 12, color: '#64748B' }}>Due {bill.dueDate}th</Text>
                </View>
                <Text style={{ fontSize: 14, fontWeight: '700', color: '#0F172A' }}>${bill.amount.toFixed(2)}</Text>
              </View>
            ))}
          </View>
        )}
      </View>
    )
  },
  spending_trend: {
    title: 'Spending Trend', sub: 'Subscriptions vs. Variable Expenses', cols: 2, rows: 3,
    customRender: (data: any, anims: any) => {
      if (!data.totalSpendingTrend) return null;
      return (
        <View style={{ flex: 1 }}>
          <View style={styles.cardHeader}>
            <TrendingDown color="#10B981" size={20} />
            <Text style={styles.cardTitle}>Total Spending Trend</Text>
          </View>
          <Text style={styles.projectionText}>Subscriptions vs. Variable Expenses.</Text>
          <View style={styles.chartContainer}>
            {data.totalSpendingTrend.map((d: any, i: number) => {
              const expHeight = anims.expAnims[i].interpolate({ inputRange: [0, 1], outputRange: [0, (d.expenses / data.maxSpend) * 150] });
              const subHeight = anims.subAnims[i].interpolate({ inputRange: [0, 1], outputRange: [0, (d.subscriptions / data.maxSpend) * 150] });
              return (
                <View key={d.month} style={styles.barColumn}>
                  <Text style={styles.barValue}>${Math.round(d.expenses + d.subscriptions)}</Text>
                  <View style={styles.barWrapper}>
                    <Animated.View style={[styles.barExp, { height: expHeight }]} />
                    <Animated.View style={[styles.barSub, { height: subHeight }]} />
                  </View>
                  <Text style={styles.barLabel}>{d.month}</Text>
                </View>
              );
            })}
          </View>
          <View style={styles.legendContainer}>
            <View style={styles.legendItem}>
               <View style={[styles.legendColor, { backgroundColor: '#3B82F6' }]} />
               <Text style={styles.legendText}>Expenses</Text>
            </View>
            <View style={styles.legendItem}>
               <View style={[styles.legendColor, { backgroundColor: '#8B5CF6' }]} />
               <Text style={styles.legendText}>Subscriptions</Text>
            </View>
          </View>
        </View>
      );
    }
  }
};

// --- iOS STYLE PACKING ALGORITHM ---
function calculateLayout(widgetIds: string[]) {
  const positions: Record<string, { x: number, y: number, width: number, height: number, cx: number, cy: number }> = {};
  const occupied = new Set<string>();
  const occupancyMap: Record<string, string> = {};
  let r = 0;
  let c = 0;

  for (const id of widgetIds) {
    const config = WIDGET_REGISTRY[id];
    if (!config) continue;
    const wSpan = config.cols || 1;
    const hSpan = config.rows || 1;

    let foundSlot = false;
    while (!foundSlot) {
      let canFit = true;
      if (c + wSpan > COLS) {
        canFit = false;
      } else {
        for (let i = 0; i < wSpan; i++) {
          for (let j = 0; j < hSpan; j++) {
            if (occupied.has(`${c + i},${r + j}`)) canFit = false;
          }
        }
      }

      if (canFit) {
        foundSlot = true;
      } else {
        c++;
        if (c >= COLS) {
          c = 0;
          r++;
        }
      }
    }

    const x = c * (CARD_WIDTH + GAP);
    const y = r * (CARD_HEIGHT + GAP);
    const width = wSpan * CARD_WIDTH + (wSpan - 1) * GAP;
    const height = hSpan * CARD_HEIGHT + (hSpan - 1) * GAP;

    positions[id] = {
      x, y, width, height,
      cx: x + width / 2, // center X for proximity logic
      cy: y + height / 2 // center Y for proximity logic
    };

    for (let i = 0; i < wSpan; i++) {
      for (let j = 0; j < hSpan; j++) {
        occupied.add(`${c + i},${r + j}`);
        occupancyMap[`${c + i},${r + j}`] = id;
      }
    }

    c += wSpan;
    if (c >= COLS) {
      c = 0;
      r++;
    }
  }

  let maxRow = 0;
  for (const key of occupied.keys()) {
    const row = parseInt(key.split(',')[1], 10);
    if (row > maxRow) maxRow = row;
  }

  const containerHeight = (maxRow + 1) * (CARD_HEIGHT + GAP);
  return { positions, containerHeight, occupancyMap };
}

// --- DRAGGABLE GRID ITEM ---
interface GridItemProps {
  id: string;
  data: any;
  anims: any;
  targetLayout: { x: number, y: number, width: number, height: number, cx: number, cy: number };
  isDragging: boolean;
  onDragStart: () => void;
  onDragEnd: () => void;
  onDragMove: (x: number, y: number) => void;
}

const DraggableWidget = ({ id, data, anims, targetLayout, isDragging, onDragStart, onDragEnd, onDragMove }: GridItemProps) => {
  const position = useRef(new Animated.ValueXY({ x: targetLayout.x, y: targetLayout.y })).current;
  const scale = useRef(new Animated.Value(1)).current;
  const zIndex = useRef(new Animated.Value(1)).current;
  const shakeAnim = useRef(new Animated.Value(0)).current;

  // Track the most recent targetLayout without re-rendering PanResponder
  const targetLayoutRef = useRef(targetLayout);
  useEffect(() => {
    targetLayoutRef.current = targetLayout;
  }, [targetLayout]);

  const timer = useRef<NodeJS.Timeout | null>(null);
  const isLocked = useRef(false);
  const startDragAbsX = useRef(0);
  const startDragAbsY = useRef(0);

  const startShake = () => {
    Animated.loop(
      Animated.sequence([
        Animated.timing(shakeAnim, { toValue: 1, duration: 120, useNativeDriver: false }),
        Animated.timing(shakeAnim, { toValue: -1, duration: 120, useNativeDriver: false }),
        Animated.timing(shakeAnim, { toValue: 0, duration: 120, useNativeDriver: false })
      ])
    ).start();
  };

  const stopShake = () => {
    shakeAnim.stopAnimation();
    Animated.spring(shakeAnim, { toValue: 0, useNativeDriver: false }).start();
  };
  
  const onDragMoveRef = useRef(onDragMove);
  const onDragStartRef = useRef(onDragStart);
  const onDragEndRef = useRef(onDragEnd);

  useEffect(() => {
    onDragMoveRef.current = onDragMove;
    onDragStartRef.current = onDragStart;
    onDragEndRef.current = onDragEnd;
  }, [onDragMove, onDragStart, onDragEnd]);

  const endDragInteraction = () => {
    if (timer.current) clearTimeout(timer.current);
    if (isLocked.current) {
      isLocked.current = false;
      onDragEndRef.current();
      zIndex.setValue(1);
      Animated.spring(scale, { toValue: 1, useNativeDriver: false }).start();
      stopShake();
    }
  };

  const panResponder = useRef(
    PanResponder.create({
      onStartShouldSetPanResponder: () => true,
      onPanResponderTerminationRequest: () => !isLocked.current,
      onPanResponderGrant: () => {
        timer.current = setTimeout(() => {
          isLocked.current = true;
          // Freeze our absolute drag start position
          startDragAbsX.current = targetLayoutRef.current.x;
          startDragAbsY.current = targetLayoutRef.current.y;
          
          onDragStartRef.current();
          zIndex.setValue(100);
          Animated.spring(scale, { toValue: 1.05, useNativeDriver: false }).start();
          startShake();
        }, 300);
      },
      onPanResponderMove: (_, gestureState) => {
        if (!isLocked.current) {
          if (Math.abs(gestureState.dx) > 10 || Math.abs(gestureState.dy) > 10) {
            if (timer.current) clearTimeout(timer.current);
          }
          return;
        }

        // Apply pure finger delta to the frozen absolute start position
        const newX = startDragAbsX.current + gestureState.dx;
        const newY = startDragAbsY.current + gestureState.dy;

        position.setValue({ x: newX, y: newY });
        onDragMoveRef.current(newX, newY);
      },
      onPanResponderRelease: endDragInteraction,
      onPanResponderTerminate: endDragInteraction
    })
  ).current;

  // Animate to new target slot if grid reflowed (ONLY if not actively dragged)
  useEffect(() => {
    if (isDragging) return;
    Animated.spring(position, {
      toValue: { x: targetLayout.x, y: targetLayout.y },
      tension: 50,
      friction: 7,
      useNativeDriver: false
    }).start();
  }, [targetLayout.x, targetLayout.y, isDragging]);

  const widgetConfig = WIDGET_REGISTRY[id];
  if (!widgetConfig) return null;

  const styleConfig = widgetConfig.dynamicStyle ? widgetConfig.dynamicStyle(data) : widgetConfig;

  const rotate = shakeAnim.interpolate({
    inputRange: [-1, 1],
    outputRange: ['-1.5deg', '1.5deg']
  });

  return (
    <Animated.View
      {...panResponder.panHandlers}
      style={[
        styles.draggableCard,
        {
          width: targetLayout.width,
          height: targetLayout.height,
          transform: position.getTranslateTransform().concat([{ scale }, { rotate }]),
          zIndex: zIndex as any,
          backgroundColor: styleConfig.bg || '#fff',
          borderColor: styleConfig.border || '#E2E8F0',
        }
      ]}
    >
      {widgetConfig.customRender ? (
        widgetConfig.customRender(data, anims)
      ) : (
        <>
          <Text style={[styles.metricLabel, { color: styleConfig.label }]}>{widgetConfig.title}</Text>
          <Text style={[styles.metricValue, { color: styleConfig.text }]} numberOfLines={1} adjustsFontSizeToFit>{widgetConfig.renderValue(data)}</Text>
          <Text style={[styles.metricSub, { color: styleConfig.label }]} numberOfLines={1} adjustsFontSizeToFit>{widgetConfig.sub}</Text>
        </>
      )}
    </Animated.View>
  );
};

export default function AnalyticsScreen() {
  const { subscriptions, expenses, accounts, selectedAccountId, setSelectedAccountId } = useFinance();
  const router = useRouter();
  
  // Default widget list
  const [activeWidgets, setActiveWidgets] = useState(['monthly_subs', 'savings_roi', 'spending_trend', 'phantom_subs', 'annual_run_rate', 'net_worth']);
  const activeWidgetsRef = useRef(activeWidgets);
  useEffect(() => {
    activeWidgetsRef.current = activeWidgets;
  }, [activeWidgets]);

  const [modalVisible, setModalVisible] = useState(false);
  const [accountModalVisible, setAccountModalVisible] = useState(false);
  const [scrollEnabled, setScrollEnabled] = useState(true);

  // Drag state
  const [draggingId, setDraggingId] = useState<string | null>(null);

  // Derived Data
  const activeSubscriptions = subscriptions.filter(s => s.status !== 'CANCELLED');
  const activeSubsTotal = activeSubscriptions.reduce((acc, curr) => acc + curr.amount, 0);
  const cancelledSubscriptions = subscriptions.filter(s => s.status === 'CANCELLED');
  const savingsTotal = cancelledSubscriptions.reduce((acc, curr) => acc + curr.amount, 0);
  const phantomSubs = activeSubscriptions.filter(s => s.status === 'FLAGGED');
  const topMerchant = activeSubscriptions.length > 0 
    ? [...activeSubscriptions].sort((a, b) => b.amount - a.amount)[0].merchant 
    : 'None';

  const totalExpenses = expenses.reduce((acc, curr) => acc + curr.amount, 0);
  const netWorth = accounts.reduce((acc, curr) => acc + curr.balance, 0);
  const monthlyIncome = selectedAccountId 
     ? accounts.find(a => a.id === selectedAccountId)?.monthlyIncome || 0 
     : accounts.reduce((acc, curr) => acc + curr.monthlyIncome, 0);

  const totalCreditBalance = accounts.filter(a => a.type === 'CREDIT').reduce((acc, curr) => acc + curr.balance, 0);
  const totalCreditLimit = accounts.filter(a => a.type === 'CREDIT').reduce((acc, curr) => acc + (curr.creditLimit || 0), 0);
  const creditUtilization = totalCreditLimit > 0 ? Math.round((Math.abs(totalCreditBalance) / totalCreditLimit) * 100) : 0;

  const cashFlow = monthlyIncome - (activeSubsTotal + totalExpenses);

  const categories = expenses.reduce((acc: any, curr) => {
    acc[curr.category] = (acc[curr.category] || 0) + curr.amount;
    return acc;
  }, {});
  const topCategory = Object.keys(categories).length > 0 ? Object.keys(categories).reduce((a, b) => categories[a] > categories[b] ? a : b) : 'None';

  const upcomingBills = subscriptions
    .filter(s => s.status !== 'CANCELLED' && s.dueDate)
    .sort((a, b) => (a.dueDate || 0) - (b.dueDate || 0));

  const totalSpendingTrend = MONTHLY_EXPENSES.map(exp => ({
    month: exp.month,
    expenses: exp.expenses,
    subscriptions: activeSubsTotal,
  }));
  const maxSpend = Math.max(...totalSpendingTrend.map(d => d.subscriptions + d.expenses));

  const widgetData = {
    activeSubsTotal,
    savingsTotal,
    phantomCount: phantomSubs.length,
    totalCount: subscriptions.length,
    topMerchant,
    totalSpendingTrend,
    maxSpend,
    netWorth,
    monthlyIncome,
    cashFlow,
    creditUtilization,
    topCategory,
    upcomingBills
  };

  // Animations
  const expAnims = useRef(totalSpendingTrend.map(() => new Animated.Value(0))).current;
  const subAnims = useRef(totalSpendingTrend.map(() => new Animated.Value(0))).current;
  const fadeAnim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    fadeAnim.setValue(0);
    expAnims.forEach(anim => anim.setValue(0));
    subAnims.forEach(anim => anim.setValue(0));

    const expSprings = totalSpendingTrend.map((_, i) => 
      Animated.spring(expAnims[i], { toValue: 1, tension: 50, friction: 7, useNativeDriver: false, delay: i * 100 })
    );
    const subSprings = totalSpendingTrend.map((_, i) => 
      Animated.spring(subAnims[i], { toValue: 1, tension: 50, friction: 7, useNativeDriver: false, delay: i * 100 + 100 })
    );
    
    Animated.parallel([
      Animated.timing(fadeAnim, { toValue: 1, duration: 500, useNativeDriver: true }),
      Animated.stagger(100, expSprings),
      Animated.stagger(100, subSprings)
    ]).start();
  }, [subscriptions]);

  // Execute packing algorithm to get bounds for visual rendering
  const { positions, containerHeight } = calculateLayout(activeWidgets);

  // Proximity-based Swap Detection using Apple Placeholder Logic
  const handleDragMove = (draggedId: string, dragX: number, dragY: number) => {
    // Generate occupancy map instantly from synchronous ref to bypass React render batching
    const currentWidgets = activeWidgetsRef.current;
    const { occupancyMap } = calculateLayout(currentWidgets);

    // Determine the precise grid cell the top-left anchor quadrant is hovering over
    const fingerX = dragX + CARD_WIDTH / 2;
    const fingerY = dragY + CARD_HEIGHT / 2;

    const hoverCol = Math.max(0, Math.min(1, Math.floor(fingerX / (CARD_WIDTH + GAP))));
    const hoverRow = Math.max(0, Math.floor(fingerY / (CARD_HEIGHT + GAP)));

    const targetId = occupancyMap[`${hoverCol},${hoverRow}`];

    // If we're hovering over a valid slot occupied by another widget, insert our placeholder there!
    if (targetId && targetId !== draggedId) {
      const draggedIndex = currentWidgets.indexOf(draggedId);
      const targetIndex = currentWidgets.indexOf(targetId);
      if (draggedIndex === targetIndex) return;
        
      // Remove item and re-insert at new hover target (reflows grid)
      const newArr = [...currentWidgets];
      newArr.splice(draggedIndex, 1);
      newArr.splice(targetIndex, 0, draggedId);
      
      // Update ref instantly so the next 60fps frame doesn't read stale state and jitter
      activeWidgetsRef.current = newArr;
      setActiveWidgets(newArr);
    }
  };

  const availableWidgets = Object.keys(WIDGET_REGISTRY).filter(id => !activeWidgets.includes(id));

  const addWidget = (id: string) => {
    setActiveWidgets(prev => [...prev, id]);
    setModalVisible(false);
  };

  const removeWidget = (id: string) => {
    setActiveWidgets(prev => prev.filter(w => w !== id));
  };

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView 
        contentContainerStyle={styles.scrollContent} 
        scrollEnabled={scrollEnabled}
        showsVerticalScrollIndicator={false}
      >
        <Animated.View style={[styles.header, { opacity: fadeAnim }]}>
          <View style={styles.headerRow}>
            <View>
              <Text style={styles.headerTitle}>Analytics</Text>
              <TouchableOpacity style={styles.accountPill} onPress={() => setAccountModalVisible(true)}>
                <Text style={styles.accountPillText}>
                   {selectedAccountId ? accounts.find(a => a.id === selectedAccountId)?.name : 'All Accounts'}
                </Text>
                <ChevronDown color="#64748B" size={16} />
              </TouchableOpacity>
            </View>
            <View style={{ flexDirection: 'row', gap: 12 }}>
              <TouchableOpacity style={styles.addButton} onPress={() => setModalVisible(true)}>
                <Plus color="#fff" size={24} />
              </TouchableOpacity>
              <TouchableOpacity style={styles.mainCloseBtn} onPress={() => router.back()}>
                <X color="#0F172A" size={24} />
              </TouchableOpacity>
            </View>
          </View>
        </Animated.View>

        {/* Dynamic Draggable Grid Container */}
        <Animated.View style={[styles.gridContainer, { height: containerHeight, opacity: fadeAnim }]}>
          {activeWidgets.map((widgetId) => (
            <DraggableWidget
              key={widgetId}
              id={widgetId}
              data={widgetData}
              anims={{ expAnims, subAnims }}
              targetLayout={positions[widgetId]}
              isDragging={draggingId === widgetId}
              onDragStart={() => {
                setScrollEnabled(false);
                setDraggingId(widgetId);
              }}
              onDragEnd={() => {
                setScrollEnabled(true);
                setDraggingId(null);
              }}
              onDragMove={(x, y) => handleDragMove(widgetId, x, y)}
            />
          ))}
        </Animated.View>
      </ScrollView>

      {/* Add Widget Modal */}
      <Modal visible={modalVisible} transparent animationType="slide">
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Add Widget</Text>
              <TouchableOpacity onPress={() => setModalVisible(false)} style={styles.closeBtn}>
                <X color="#64748B" size={24} />
              </TouchableOpacity>
            </View>
            
            <ScrollView style={styles.modalBody}>
              {availableWidgets.length > 0 ? availableWidgets.map(id => {
                const config = WIDGET_REGISTRY[id];
                return (
                  <TouchableOpacity key={id} style={styles.addWidgetRow} onPress={() => addWidget(id)}>
                    <View>
                      <Text style={styles.addTitle}>{config.title}</Text>
                      <Text style={styles.addSub}>{config.sub}</Text>
                    </View>
                    <Plus color="#2563EB" size={20} />
                  </TouchableOpacity>
                )
              }) : (
                <Text style={styles.emptyModalText}>All widgets are already on your dashboard!</Text>
              )}

              {activeWidgets.length > 0 && (
                <>
                  <Text style={styles.modalSectionTitle}>Active Widgets</Text>
                  {activeWidgets.map(id => {
                    const config = WIDGET_REGISTRY[id];
                    return (
                      <TouchableOpacity key={id} style={styles.removeWidgetRow} onPress={() => removeWidget(id)}>
                        <View>
                          <Text style={styles.addTitle}>{config.title}</Text>
                        </View>
                        <Text style={styles.removeText}>Remove</Text>
                      </TouchableOpacity>
                    )
                  })}
                </>
              )}
            </ScrollView>
          </View>
        </View>
      </Modal>

      {/* Account Selector Modal */}
      <Modal visible={accountModalVisible} transparent animationType="slide">
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Select Account</Text>
              <TouchableOpacity onPress={() => setAccountModalVisible(false)} style={styles.closeBtn}>
                <X color="#64748B" size={24} />
              </TouchableOpacity>
            </View>
            <ScrollView style={styles.modalBody}>
              <TouchableOpacity 
                style={styles.accountRow} 
                onPress={() => { setSelectedAccountId(null); setAccountModalVisible(false); }}
              >
                <Text style={[styles.accountName, !selectedAccountId && { color: '#2563EB', fontWeight: '800' }]}>All Accounts</Text>
                {!selectedAccountId && <Check color="#2563EB" size={20} />}
              </TouchableOpacity>
              {accounts.map(acc => (
                <TouchableOpacity 
                  key={acc.id} 
                  style={styles.accountRow} 
                  onPress={() => { setSelectedAccountId(acc.id); setAccountModalVisible(false); }}
                >
                  <View style={{ flexDirection: 'row', alignItems: 'center' }}>
                    <View style={[styles.accountColorDot, { backgroundColor: acc.color }]} />
                    <View>
                      <Text style={[styles.accountName, selectedAccountId === acc.id && { color: '#2563EB', fontWeight: '800' }]}>{acc.name}</Text>
                      <Text style={styles.accountType}>{acc.type}</Text>
                    </View>
                  </View>
                  {selectedAccountId === acc.id && <Check color="#2563EB" size={20} />}
                </TouchableOpacity>
              ))}
            </ScrollView>
          </View>
        </View>
      </Modal>

    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#F8FAFC' },
  scrollContent: { padding: CONTAINER_PADDING, paddingBottom: 100 },
  header: { marginBottom: 24, marginTop: 10 },
  headerRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start' },
  headerTitle: { fontSize: 32, fontWeight: '800', color: '#0F172A', letterSpacing: -0.5, marginBottom: 8 },
  accountPill: { flexDirection: 'row', alignItems: 'center', backgroundColor: '#E2E8F0', paddingHorizontal: 12, paddingVertical: 6, borderRadius: 20, alignSelf: 'flex-start', gap: 4 },
  accountPillText: { fontSize: 13, fontWeight: '600', color: '#475569' },
  subtitle: { fontSize: 16, color: '#64748B' },
  addButton: { width: 44, height: 44, borderRadius: 22, backgroundColor: '#2563EB', alignItems: 'center', justifyContent: 'center', shadowColor: '#2563EB', shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.3, shadowRadius: 8, elevation: 4 },
  mainCloseBtn: { width: 44, height: 44, borderRadius: 22, backgroundColor: '#E2E8F0', alignItems: 'center', justifyContent: 'center' },
  
  gridContainer: { position: 'relative', width: '100%' },
  draggableCard: {
    position: 'absolute',
    borderRadius: 20,
    padding: 20,
    borderWidth: 1,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 12,
    elevation: 4,
  },
  
  metricLabel: { fontSize: 13, fontWeight: '600', marginBottom: 8 },
  metricValue: { fontSize: 24, fontWeight: '800', marginBottom: 4 },
  metricSub: { fontSize: 11 },
  
  cardHeader: { flexDirection: 'row', alignItems: 'center', marginBottom: 8 },
  cardTitle: { fontSize: 18, fontWeight: '700', color: '#0F172A', marginLeft: 8 },
  projectionText: { fontSize: 14, color: '#64748B', marginBottom: 24 },
  chartContainer: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-end', height: 180, paddingTop: 10 },
  barColumn: { alignItems: 'center', flex: 1 },
  barWrapper: { height: 150, justifyContent: 'flex-end', width: '100%', alignItems: 'center', marginBottom: 8 },
  barExp: { width: 32, backgroundColor: '#3B82F6', borderTopLeftRadius: 8, borderTopRightRadius: 8 },
  barSub: { width: 32, backgroundColor: '#8B5CF6', borderBottomLeftRadius: 8, borderBottomRightRadius: 8 },
  barValue: { fontSize: 11, color: '#64748B', fontWeight: '700', marginBottom: 4 },
  barLabel: { fontSize: 13, color: '#94A3B8', fontWeight: '600' },
  legendContainer: { flexDirection: 'row', justifyContent: 'center', marginTop: 16, gap: 16 },
  legendItem: { flexDirection: 'row', alignItems: 'center' },
  legendColor: { width: 10, height: 10, borderRadius: 5, marginRight: 6 },
  legendText: { fontSize: 12, color: '#64748B', fontWeight: '500' },

  modalOverlay: { flex: 1, backgroundColor: 'rgba(15, 23, 42, 0.5)', justifyContent: 'flex-end' },
  modalContent: { backgroundColor: '#fff', borderTopLeftRadius: 24, borderTopRightRadius: 24, maxHeight: '80%', paddingBottom: 40 },
  modalHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', padding: 24, borderBottomWidth: 1, borderBottomColor: '#F1F5F9' },
  modalTitle: { fontSize: 20, fontWeight: '800', color: '#0F172A' },
  closeBtn: { padding: 4 },
  modalBody: { padding: 24 },
  addWidgetRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingVertical: 16, borderBottomWidth: 1, borderBottomColor: '#F1F5F9' },
  addTitle: { fontSize: 16, fontWeight: '700', color: '#0F172A', marginBottom: 4 },
  addSub: { fontSize: 13, color: '#64748B' },
  emptyModalText: { textAlign: 'center', color: '#64748B', paddingVertical: 24, fontSize: 15 },
  modalSectionTitle: { fontSize: 14, fontWeight: '700', color: '#94A3B8', marginTop: 32, marginBottom: 8, textTransform: 'uppercase', letterSpacing: 1 },
  removeWidgetRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingVertical: 16, borderBottomWidth: 1, borderBottomColor: '#F1F5F9' },
  removeText: { color: '#EF4444', fontWeight: '600', fontSize: 14 },
  
  accountRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingVertical: 16, borderBottomWidth: 1, borderBottomColor: '#F1F5F9' },
  accountColorDot: { width: 12, height: 12, borderRadius: 6, marginRight: 12 },
  accountName: { fontSize: 16, fontWeight: '600', color: '#0F172A', marginBottom: 2 },
  accountType: { fontSize: 12, color: '#64748B' }
});
