import React, { useState, useRef, useEffect } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ScrollView, Animated, ActivityIndicator, SafeAreaView, Modal, Clipboard } from 'react-native';
import { AlertCircle, CreditCard, Activity, ShieldCheck, CheckCircle2, Mail, Copy, X } from 'lucide-react-native';
import { useFinance, SubscriptionData } from '../context/FinanceContext';
import { useRouter } from 'expo-router';

export default function SubscriptionsScreen() {
  const { subscriptions, hasScanned, runAudit, cancelSubscription } = useFinance();
  const router = useRouter();
  
  const [isScanning, setIsScanning] = useState(false);
  const [cancelingSub, setCancelingSub] = useState<SubscriptionData | null>(null);
  const [cancelStep, setCancelStep] = useState<number>(0);
  const [expandedSubId, setExpandedSubId] = useState<string | null>(null);
  
  const [trialCardVisible, setTrialCardVisible] = useState(false);
  const [trialCardData, setTrialCardData] = useState<any>(null);

  const fadeAnim = useRef(new Animated.Value(hasScanned ? 1 : 0)).current;
  const progressAnim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    if (hasScanned) {
      fadeAnim.setValue(1);
    }
  }, [hasScanned]);

  const handleScan = () => {
    setIsScanning(true);
    setTimeout(() => {
      setIsScanning(false);
      runAudit();
      Animated.timing(fadeAnim, { toValue: 1, duration: 800, useNativeDriver: true }).start();
    }, 2000);
  };

  const handleCancelClick = (sub: SubscriptionData) => {
    setCancelingSub(sub);
    setCancelStep(1);
    
    Animated.timing(progressAnim, { toValue: 0.33, duration: 500, useNativeDriver: false }).start();

    setTimeout(() => {
      setCancelStep(2);
      Animated.timing(progressAnim, { toValue: 0.66, duration: 500, useNativeDriver: false }).start();
      
      setTimeout(() => {
        setCancelStep(3);
        Animated.timing(progressAnim, { toValue: 1, duration: 500, useNativeDriver: false }).start();
        
        setTimeout(() => {
          cancelSubscription(sub.id);
          setCancelingSub(null);
          progressAnim.setValue(0);
        }, 2000);
      }, 2000);
    }, 2000);
  };

  const flaggedCount = subscriptions.filter(s => s.status === "FLAGGED").length;



  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <View style={styles.headerTop}>
          <View style={styles.logoContainer}>
            <Text style={styles.logoText}>U</Text>
          </View>
          <TouchableOpacity style={styles.closeBtn} onPress={() => router.back()}>
             <X size={20} color="#0F172A" />
          </TouchableOpacity>
        </View>
      </View>

      <ScrollView contentContainerStyle={styles.scrollContent}>
        {!hasScanned ? (
          <View style={styles.scanSection}>
            <View style={styles.iconWrapper}>
              <Activity color="#2563EB" size={48} />
            </View>
            <Text style={styles.title}>Run Telemetry Audit</Text>
            <Text style={styles.subtitle}>
              Cross-reference your Plaid transactions with local OS usage data.
            </Text>
            <TouchableOpacity style={[styles.button, isScanning && styles.buttonDisabled]} onPress={handleScan} disabled={isScanning}>
              {isScanning ? (
                <ActivityIndicator color="#fff" style={{ marginRight: 8 }} />
              ) : (
                <ShieldCheck color="#fff" size={20} style={{ marginRight: 8 }} />
              )}
              <Text style={styles.buttonText}>{isScanning ? "Scanning..." : "Start Local Audit"}</Text>
            </TouchableOpacity>
          </View>
        ) : (
          <Animated.View style={{ opacity: hasScanned ? 1 : fadeAnim, width: '100%' }}>
            <View style={styles.resultsHeader}>
              <Text style={styles.resultsTitle}>Subscriptions</Text>
              <View style={styles.alertBadge}>
                <AlertCircle color="#DC2626" size={16} />
                <Text style={styles.alertText}>{flaggedCount} Flagged</Text>
              </View>
            </View>

            {subscriptions.map((sub) => (
              <TouchableOpacity 
                key={sub.id} 
                style={[styles.card, sub.status === 'CANCELLED' && styles.cardCancelled]}
                activeOpacity={0.8}
                onPress={() => {
                  if (sub.status !== 'CANCELLED') {
                    setExpandedSubId(expandedSubId === sub.id ? null : sub.id);
                  }
                }}
              >
                <View style={styles.cardHeader}>
                  <View style={styles.merchantInfo}>
                    <View style={[styles.iconBox, sub.status === 'FLAGGED' ? styles.iconBoxFlagged : sub.status === 'CANCELLED' ? styles.iconBoxCancelled : styles.iconBoxActive]}>
                      {sub.status === 'FLAGGED' ? <AlertCircle color="#DC2626" size={24} /> : 
                       sub.status === 'CANCELLED' ? <ShieldCheck color="#64748B" size={24} /> :
                       <CheckCircle2 color="#2563EB" size={24} />}
                    </View>
                    <View style={{ flex: 1 }}>
                      <Text style={[styles.merchantName, sub.status === 'CANCELLED' && styles.textStrikethrough]} numberOfLines={1} ellipsizeMode="tail">{sub.merchant}</Text>
                      <Text style={styles.amount}>${sub.amount.toFixed(2)} / {sub.frequency}</Text>
                    </View>
                  </View>
                </View>

                {expandedSubId !== sub.id && sub.status !== 'CANCELLED' && (
                  <View style={styles.usageData}>
                    <Text style={styles.usageLabel}>Last Used:</Text>
                    <Text style={styles.usageValue}>
                      {sub.usageHours === 0 ? 'Never used' : `${sub.id === '2' ? 'Today' : '3 days ago'}`}
                    </Text>
                  </View>
                )}

                {expandedSubId === sub.id && sub.status !== 'CANCELLED' && (
                  <View style={styles.expandedContent}>
                    <View style={styles.usageData}>
                      <Text style={styles.usageLabel}>Payment History:</Text>
                      <Text style={styles.usageValue}>Paid {Math.floor(Math.random() * 8) + 2} times</Text>
                    </View>
                    <View style={styles.usageData}>
                      <Text style={styles.usageLabel}>Last Payment:</Text>
                      <Text style={styles.usageValue}>3 days ago</Text>
                    </View>
                    
                    <TouchableOpacity style={styles.cancelButton} onPress={() => handleCancelClick(sub)}>
                      <Text style={styles.cancelButtonText}>1-Click Cancel</Text>
                    </TouchableOpacity>
                  </View>
                )}

                {sub.status === 'CANCELLED' && (
                  <View style={styles.cancelledBadge}>
                    <Text style={styles.cancelledBadgeText}>Successfully Cancelled</Text>
                  </View>
                )}
              </TouchableOpacity>
            ))}
          </Animated.View>
        )}
      </ScrollView>

      {/* 1-Click Cancel Modal */}
      <Modal visible={cancelingSub !== null} transparent animationType="fade">
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Cancelling {cancelingSub?.merchant}</Text>
              <Text style={styles.modalSubtitle}>Automated AI Resolution</Text>
            </View>
            
            <View style={styles.modalBody}>
              {/* Step 1 */}
              <View style={styles.stepRow}>
                <View style={[styles.stepIcon, cancelStep >= 1 ? styles.stepIconActive : null]}>
                  {cancelStep > 1 ? <CheckCircle2 color="#2563EB" size={20} /> : <Mail color={cancelStep >= 1 ? "#2563EB" : "#94A3B8"} size={20} />}
                </View>
                <View style={styles.stepTextContainer}>
                  <Text style={[styles.stepTitle, cancelStep >= 1 && styles.stepTitleActive]}>Drafting Cancellation Request</Text>
                  <Text style={styles.stepDesc}>Generating compliance email template</Text>
                </View>
                {cancelStep === 1 && <ActivityIndicator color="#2563EB" />}
              </View>

              {/* Step 2 */}
              <View style={styles.stepRow}>
                <View style={[styles.stepIcon, cancelStep >= 2 ? styles.stepIconActive : null]}>
                  {cancelStep > 2 ? <CheckCircle2 color="#2563EB" size={20} /> : <CreditCard color={cancelStep >= 2 ? "#2563EB" : "#94A3B8"} size={20} />}
                </View>
                <View style={styles.stepTextContainer}>
                  <Text style={[styles.stepTitle, cancelStep >= 2 && styles.stepTitleActive]}>Freezing Virtual Card</Text>
                  <Text style={styles.stepDesc}>Blocking future charges immediately</Text>
                </View>
                {cancelStep === 2 && <ActivityIndicator color="#2563EB" />}
              </View>

              {/* Step 3 */}
              <View style={styles.stepRow}>
                <View style={[styles.stepIcon, cancelStep >= 3 ? styles.stepIconSuccess : null]}>
                  <ShieldCheck color={cancelStep >= 3 ? "#059669" : "#94A3B8"} size={20} />
                </View>
                <View style={styles.stepTextContainer}>
                  <Text style={[styles.stepTitle, cancelStep >= 3 && styles.stepTitleSuccess]}>Successfully Cancelled</Text>
                  <Text style={styles.stepSubtitle}>Saved ${cancelingSub?.amount}/mo</Text>
                </View>
              </View>
            </View>

            <View style={styles.progressBarContainer}>
              <Animated.View style={[styles.progressBar, {
                width: progressAnim.interpolate({
                  inputRange: [0, 1],
                  outputRange: ['0%', '100%']
                })
              }]} />
            </View>
          </View>
        </View>
      </Modal>



    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#F8FAFC' },
  header: { padding: 24, paddingBottom: 0, backgroundColor: '#fff', borderBottomWidth: 1, borderBottomColor: '#F1F5F9' },
  headerTop: { flexDirection: 'row', alignItems: 'center', marginBottom: 16 },
  logoContainer: { width: 32, height: 32, backgroundColor: '#2563EB', borderRadius: 8, alignItems: 'center', justifyContent: 'center', marginRight: 12 },
  logoText: { color: '#fff', fontWeight: 'bold', fontSize: 18 },
  scrollContent: { padding: 24, alignItems: 'center' },
  scanSection: { alignItems: 'center', marginTop: 40, width: '100%' },
  iconWrapper: { width: 96, height: 96, borderRadius: 48, backgroundColor: '#EFF6FF', alignItems: 'center', justifyContent: 'center', marginBottom: 24 },
  title: { fontSize: 28, fontWeight: '800', color: '#0F172A', marginBottom: 16 },
  subtitle: { fontSize: 16, color: '#64748B', textAlign: 'center', marginBottom: 40, paddingHorizontal: 20 },
  button: { flexDirection: 'row', backgroundColor: '#0F172A', paddingVertical: 18, borderRadius: 16, alignItems: 'center', justifyContent: 'center', width: '100%' },
  buttonDisabled: { backgroundColor: '#334155' },
  buttonText: { color: '#fff', fontSize: 18, fontWeight: '700' },
  resultsHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 24, width: '100%' },
  resultsTitle: { fontSize: 24, fontWeight: '800', color: '#0F172A' },
  alertBadge: { flexDirection: 'row', alignItems: 'center', backgroundColor: '#FEF2F2', paddingVertical: 6, paddingHorizontal: 12, borderRadius: 12 },
  alertText: { color: '#DC2626', fontWeight: '700', fontSize: 14, marginLeft: 6 },
  card: { backgroundColor: '#fff', borderRadius: 20, padding: 20, marginBottom: 16, borderWidth: 1, borderColor: '#E2E8F0' },
  cardCancelled: { opacity: 0.6, backgroundColor: '#F8FAFC' },
  cardHeader: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 16 },
  merchantInfo: { flexDirection: 'row', alignItems: 'center', flex: 1 },
  iconBox: { width: 48, height: 48, borderRadius: 14, alignItems: 'center', justifyContent: 'center', marginRight: 16 },
  iconBoxActive: { backgroundColor: '#DBEAFE' },
  iconBoxFlagged: { backgroundColor: '#FEE2E2' },
  iconBoxCancelled: { backgroundColor: '#E2E8F0' },
  merchantName: { fontSize: 18, fontWeight: '700', color: '#0F172A', marginBottom: 4 },
  textStrikethrough: { textDecorationLine: 'line-through', color: '#64748B' },
  amount: { fontSize: 14, color: '#64748B', fontWeight: '500' },
  usageData: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingVertical: 12, borderTopWidth: 1, borderTopColor: '#F1F5F9' },
  usageLabel: { color: '#64748B', fontSize: 14, fontWeight: '500' },
  usageValue: { color: '#0F172A', fontSize: 16, fontWeight: '700' },
  textRed: { color: '#DC2626' },
  cancelButton: { backgroundColor: '#DC2626', paddingVertical: 14, borderRadius: 12, alignItems: 'center', marginTop: 8 },
  cancelButtonText: { color: '#fff', fontWeight: '700', fontSize: 16 },
  cancelledBadge: { marginTop: 8, paddingVertical: 8, backgroundColor: '#ECFDF5', borderRadius: 8, alignItems: 'center' },
  cancelledBadgeText: { color: '#059669', fontWeight: '600' },
  expandedContent: { marginTop: 4 },
  modalOverlay: { flex: 1, backgroundColor: 'rgba(15, 23, 42, 0.6)', justifyContent: 'center', alignItems: 'center', padding: 20 },
  modalContent: { backgroundColor: '#fff', width: '100%', borderRadius: 24, overflow: 'hidden' },
  modalHeader: { backgroundColor: '#F8FAFC', padding: 24, borderBottomWidth: 1, borderBottomColor: '#F1F5F9', alignItems: 'center' },
  modalTitle: { fontSize: 20, fontWeight: '800', color: '#0F172A' },
  modalSubtitle: { fontSize: 14, color: '#64748B', marginTop: 4 },
  modalBody: { padding: 24, gap: 24 },
  stepRow: { flexDirection: 'row', alignItems: 'center' },
  stepIcon: { width: 40, height: 40, borderRadius: 20, backgroundColor: '#F1F5F9', alignItems: 'center', justifyContent: 'center', marginRight: 16 },
  stepIconActive: { backgroundColor: '#DBEAFE' },
  stepIconSuccess: { backgroundColor: '#D1FAE5' },
  stepTextContainer: { flex: 1 },
  stepTitle: { fontSize: 16, fontWeight: '600', color: '#94A3B8' },
  stepTitleActive: { color: '#0F172A' },
  stepTitleSuccess: { color: '#059669' },
  stepDesc: { fontSize: 12, color: '#64748B', marginTop: 2 },
  stepSubtitle: { fontSize: 14, fontWeight: '700', color: '#059669', marginTop: 2 },
  progressBarContainer: { height: 6, backgroundColor: '#F1F5F9', width: '100%' },
  progressBar: { height: '100%', backgroundColor: '#10B981' },
  closeBtn: { padding: 8, backgroundColor: '#F1F5F9', borderRadius: 20, marginLeft: 'auto' }
});
