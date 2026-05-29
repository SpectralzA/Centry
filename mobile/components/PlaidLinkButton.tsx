import React, { useEffect, useState } from 'react';
import { TouchableOpacity, Text, ActivityIndicator, Alert, StyleSheet } from 'react-native';
import { create, open, LinkSuccess, LinkExit } from 'react-native-plaid-link-sdk';
interface PlaidLinkButtonProps {
  onSuccess: (publicToken: string) => void;
  style?: any;
  textStyle?: any;
}

// In a real app, this should be configurable via env vars.
// We use localhost:3000 because the Next.js app will be running locally.
const API_URL = 'http://localhost:3000';

export function PlaidLinkButton({ onSuccess, style, textStyle }: PlaidLinkButtonProps) {
  const [isInitializing, setIsInitializing] = useState(false);
  const [isReady, setIsReady] = useState(false);
  const handlePress = async () => {
    if (isInitializing) return;
    setIsInitializing(true);

    try {
      // 1. Fetch link_token from your Next.js backend
      const response = await fetch(`${API_URL}/api/plaid/create-link-token`, {
        method: 'POST',
      });
      
      if (!response.ok) {
        throw new Error('Failed to create link token');
      }

      const data = await response.json();
      const linkToken = data.link_token;

      // 2. Initialize Plaid Link with the token
      await create({
        token: linkToken,
        noLoadingState: false,
      });

      // 3. Open the Plaid Link modal
      setIsReady(true);
      await open({
        onSuccess: (event: LinkSuccess) => {
          console.log('Plaid Link Success:', event);
          onSuccess(event.publicToken);
        },
        onExit: (event: LinkExit) => {
          console.log('Plaid Link Exit:', event);
        }
      });
    } catch (err: any) {
      console.error('Error opening Plaid Link:', err);
      Alert.alert('Connection Error', 'Could not connect to the bank linking service. Make sure the web backend is running on localhost:3000.');
    } finally {
      setIsInitializing(false);
      setIsReady(false); // Reset ready state after opening
    }
  };

  return (
    <TouchableOpacity 
      style={[styles.button, style]} 
      onPress={handlePress}
      disabled={isInitializing}
    >
      {isInitializing ? (
        <ActivityIndicator color="#fff" />
      ) : (
        <Text style={[styles.text, textStyle]}>Connect Bank with Plaid</Text>
      )}
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  button: {
    backgroundColor: '#0F172A',
    paddingVertical: 14,
    paddingHorizontal: 24,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  text: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  }
});
