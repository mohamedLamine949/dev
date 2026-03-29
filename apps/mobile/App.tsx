import { StatusBar } from 'expo-status-bar';
import { AuthProvider, useAuth } from './src/context/AuthContext';
import LoginScreen from './src/screens/LoginScreen';
import RegisterScreen from './src/screens/RegisterScreen';
import HomeScreen from './src/screens/HomeScreen';
import VaultScreen from './src/screens/VaultScreen';
import ProfileScreen from './src/screens/ProfileScreen';
import ApplicationsScreen from './src/screens/ApplicationsScreen';
import JobDetailsScreen from './src/screens/JobDetailsScreen';
import RecruiterEmployerScreen from './src/screens/RecruiterEmployerScreen';
import RecruiterNewJobScreen from './src/screens/RecruiterNewJobScreen';
import RecruiterApplicationsScreen from './src/screens/RecruiterApplicationsScreen';
import { View, ActivityIndicator, StyleSheet } from 'react-native';

import { NavigationContainer, NavigationProp } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { Home, FolderSearch, UserCircle, Briefcase } from 'lucide-react-native';

export type RootStackParamList = {
  Login: undefined;
  Register: undefined;
  AppTabs: undefined;
  JobDetails: { jobId: string };
  RecruiterEmployer: undefined;
  RecruiterNewJob: undefined;
  RecruiterApplications: undefined;
};

const Stack = createNativeStackNavigator<RootStackParamList>();
const Tab = createBottomTabNavigator();

function TabNavigator() {
  return (
    <Tab.Navigator
      screenOptions={{
        headerStyle: { backgroundColor: '#0a0a0a' },
        headerTintColor: '#fff',
        headerTitleStyle: { fontWeight: 'bold' },
        tabBarStyle: { backgroundColor: '#0a0a0a', borderTopColor: '#333' },
        tabBarActiveTintColor: '#14B53A',
        tabBarInactiveTintColor: '#6b7280',
      }}
    >
      <Tab.Screen name="MaliTravail Jobs" component={HomeScreen} options={{ tabBarLabel: 'Offres', tabBarIcon: ({ color, size }) => <Home color={color as string} size={size as number} /> }} />
      <Tab.Screen name="Mes Candidatures" component={ApplicationsScreen} options={{ tabBarLabel: 'Candidatures', tabBarIcon: ({ color, size }) => <Briefcase color={color as string} size={size as number} /> }} />
      <Tab.Screen name="Coffre-fort" component={VaultScreen} options={{ tabBarLabel: 'Documents', tabBarIcon: ({ color, size }) => <FolderSearch color={color as string} size={size as number} /> }} />
      <Tab.Screen name="Mon Profil" component={ProfileScreen} options={{ tabBarLabel: 'Profil', tabBarIcon: ({ color, size }) => <UserCircle color={color as string} size={size as number} /> }} />
    </Tab.Navigator>
  );
}

function MainNavigator() {
  const { user, loading } = useAuth();

  if (loading) {
    return (
      <View style={styles.loading}>
        <ActivityIndicator size="large" color="#14B53A" />
      </View>
    );
  }

  return (
    <Stack.Navigator screenOptions={{ headerShown: false }}>
      {!user ? (
        <>
          <Stack.Screen name="Login" component={LoginScreen} />
          <Stack.Screen name="Register" component={RegisterScreen} />
        </>
      ) : (
        <>
          <Stack.Screen name="AppTabs" component={TabNavigator} />
          <Stack.Screen name="JobDetails" component={JobDetailsScreen} />
          <Stack.Screen name="RecruiterEmployer" component={RecruiterEmployerScreen} />
          <Stack.Screen name="RecruiterNewJob" component={RecruiterNewJobScreen} />
          <Stack.Screen name="RecruiterApplications" component={RecruiterApplicationsScreen} />
        </>
      )}
    </Stack.Navigator>
  );
}

export default function App() {
  return (
    <AuthProvider>
      <StatusBar style="light" />
      <NavigationContainer>
        <MainNavigator />
      </NavigationContainer>
    </AuthProvider>
  );
}

const styles = StyleSheet.create({
  loading: { flex: 1, backgroundColor: '#0a0a0a', alignItems: 'center', justifyContent: 'center' },
});
