import React, { useState } from 'react';
import {
    View, Text, TextInput, TouchableOpacity,
    StyleSheet, KeyboardAvoidingView, Platform, Alert, ActivityIndicator,
} from 'react-native';
import { useAuth } from '../context/AuthContext';
import { useNavigation } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { RootStackParamList } from '../../App';

export default function LoginScreen() {
    const { login } = useAuth();
    const navigation = useNavigation<NativeStackNavigationProp<RootStackParamList>>();
    const [identifier, setIdentifier] = useState('');
    const [password, setPassword] = useState('');
    const [loading, setLoading] = useState(false);

    const handleLogin = async () => {
        if (!identifier || !password) {
            Alert.alert('Erreur', 'Veuillez remplir tous les champs');
            return;
        }
        setLoading(true);
        try {
            await login(identifier.trim(), password);
        } catch (err: unknown) {
            Alert.alert('Erreur', err instanceof Error ? err.message : 'Identifiants invalides');
        } finally {
            setLoading(false);
        }
    };

    return (
        <KeyboardAvoidingView style={styles.container} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
            <View style={styles.card}>
                <Text style={styles.logo}>MaliLink</Text>
                <Text style={styles.subtitle}>Connectez-vous à votre espace</Text>

                <TextInput
                    style={styles.input}
                    placeholder="Téléphone ou Email"
                    placeholderTextColor="#9ca3af"
                    value={identifier}
                    onChangeText={setIdentifier}
                    keyboardType="default"
                    autoCapitalize="none"
                />
                <TextInput
                    style={styles.input}
                    placeholder="Mot de passe"
                    placeholderTextColor="#9ca3af"
                    value={password}
                    onChangeText={setPassword}
                    secureTextEntry
                />

                <TouchableOpacity style={styles.button} onPress={handleLogin} disabled={loading}>
                    {loading ? (
                        <ActivityIndicator color="#fff" />
                    ) : (
                        <Text style={styles.buttonText}>Se connecter</Text>
                    )}
                </TouchableOpacity>

                <TouchableOpacity onPress={() => navigation.navigate('Register')} style={styles.link}>
                    <Text style={styles.linkText}>Pas encore de compte ? <Text style={styles.linkBold}>S&apos;inscrire</Text></Text>
                </TouchableOpacity>
            </View>
        </KeyboardAvoidingView>
    );
}

const styles = StyleSheet.create({
    container: { flex: 1, backgroundColor: '#052e16', justifyContent: 'center', padding: 20 },
    card: { backgroundColor: 'rgba(255,255,255,0.07)', borderRadius: 20, padding: 28, borderWidth: 1, borderColor: 'rgba(255,255,255,0.12)' },
    logo: { fontSize: 32, fontWeight: '800', color: '#fff', textAlign: 'center', marginBottom: 6 },
    subtitle: { fontSize: 14, color: '#86efac', textAlign: 'center', marginBottom: 28 },
    input: { backgroundColor: 'rgba(255,255,255,0.1)', borderRadius: 12, padding: 14, color: '#fff', marginBottom: 14, borderWidth: 1, borderColor: 'rgba(255,255,255,0.15)' },
    button: { backgroundColor: '#16a34a', borderRadius: 12, padding: 16, alignItems: 'center', marginTop: 6 },
    buttonText: { color: '#fff', fontWeight: '700', fontSize: 16 },
    link: { marginTop: 18, alignItems: 'center' },
    linkText: { color: '#9ca3af', fontSize: 14 },
    linkBold: { color: '#4ade80', fontWeight: '600' },
});

