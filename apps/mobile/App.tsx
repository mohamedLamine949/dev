import { StatusBar } from 'expo-status-bar';
import { useState } from 'react';
import { AuthProvider, useAuth } from './src/context/AuthContext';
import LoginScreen from './src/screens/LoginScreen';
import RegisterScreen from './src/screens/RegisterScreen';
import HomeScreen from './src/screens/HomeScreen';
import { View, ActivityIndicator, StyleSheet } from 'react-native';

function AppNavigator() {
  const { user, loading } = useAuth();
  const [screen, setScreen] = useState<'login' | 'register'>('login');

  if (loading) {
    return (
      <View style={styles.loading}>
        <ActivityIndicator size="large" color="#16a34a" />
      </View>
    );
  }

  if (user) {
    return <HomeScreen />;
  }

  if (screen === 'register') {
    return <RegisterScreen onGoLogin={() => setScreen('login')} />;
  }

  return <LoginScreen onGoRegister={() => setScreen('register')} />;
}

export default function App() {
  return (
    <AuthProvider>
      <StatusBar style="light" />
      <AppNavigator />
    </AuthProvider>
  );
}

const styles = StyleSheet.create({
  loading: {
    flex: 1,
    backgroundColor: '#052e16',
    alignItems: 'center',
    justifyContent: 'center',
  },
});
