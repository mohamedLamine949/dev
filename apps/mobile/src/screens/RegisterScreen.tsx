import React, { useState } from 'react';
import {
    View, Text, TextInput, TouchableOpacity,
    StyleSheet, KeyboardAvoidingView, Platform, ScrollView, Alert, ActivityIndicator,
} from 'react-native';
import { useAuth } from '../context/AuthContext';
import { useNavigation } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { RootStackParamList } from '../../App';

export default function RegisterScreen() {
    const { register } = useAuth();
    const navigation = useNavigation<NativeStackNavigationProp<RootStackParamList>>();

    // Form state
    const [phone, setPhone] = useState('');
    const [password, setPassword] = useState('');
    const [firstName, setFirstName] = useState('');
    const [lastName, setLastName] = useState('');
    const [country, setCountry] = useState('Mali');
    const [email, setEmail] = useState('');
    const [role, setRole] = useState<'CANDIDATE' | 'RECRUITER'>('CANDIDATE');

    const [loading, setLoading] = useState(false);

    const handleRegister = async () => {
        if (!firstName || !lastName || !phone || !password || !country) {
            Alert.alert('Erreur', 'Veuillez remplir tous les champs obligatoires (Prénom, Nom, Téléphone, Pays, Mot de passe)');
            return;
        }
        setLoading(true);
        try {
            await register({ firstName, lastName, phone, email, password, country, role });
        } catch (err: unknown) {
            Alert.alert('Erreur', err instanceof Error ? err.message : "Erreur d'inscription");
        } finally {
            setLoading(false);
        }
    };

    return (
        <KeyboardAvoidingView style={styles.container} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
            <ScrollView contentContainerStyle={styles.scroll} showsVerticalScrollIndicator={false}>
                <View style={styles.card}>
                    <Text style={styles.logo}>MaliTravail</Text>
                    <Text style={styles.subtitle}>Créez votre compte gratuitement</Text>

                    <View style={styles.row}>
                        <TextInput style={[styles.input, styles.half]} placeholder="Prénom" placeholderTextColor="#9ca3af"
                            value={firstName} onChangeText={setFirstName} />
                        <TextInput style={[styles.input, styles.half]} placeholder="Nom" placeholderTextColor="#9ca3af"
                            value={lastName} onChangeText={setLastName} />
                    </View>
                    <TextInput style={styles.input} placeholder="Téléphone (+223...)" placeholderTextColor="#9ca3af"
                        value={phone} onChangeText={setPhone} keyboardType="phone-pad" />
                    <TextInput style={styles.input} placeholder="Email (Optionnel)" placeholderTextColor="#9ca3af"
                        value={email} onChangeText={setEmail} keyboardType="email-address" autoCapitalize="none" />
                    <TextInput style={styles.input} placeholder="Mot de passe" placeholderTextColor="#9ca3af"
                        value={password} onChangeText={setPassword} secureTextEntry />

                    <Text style={styles.roleLabel}>Pays de résidence</Text>
                    <TextInput style={styles.input} placeholder="Ex: Mali, France, Canada..." placeholderTextColor="#9ca3af"
                        value={country} onChangeText={setCountry} />

                    <Text style={styles.roleLabel}>Je suis un(e)</Text>
                    <View style={styles.roleRow}>
                        <TouchableOpacity
                            style={[styles.roleBtn, role === 'CANDIDATE' && styles.roleBtnActive]}
                            onPress={() => setRole('CANDIDATE')}
                        >
                            <Text style={[styles.roleBtnText, role === 'CANDIDATE' && styles.roleBtnTextActive]}>
                                👤 Candidat
                            </Text>
                        </TouchableOpacity>
                        <TouchableOpacity
                            style={[styles.roleBtn, role === 'RECRUITER' && styles.roleBtnActive]}
                            onPress={() => setRole('RECRUITER')}
                        >
                            <Text style={[styles.roleBtnText, role === 'RECRUITER' && styles.roleBtnTextActive]}>
                                🏢 Recruteur
                            </Text>
                        </TouchableOpacity>
                    </View>

                    <TouchableOpacity style={styles.button} onPress={handleRegister} disabled={loading}>
                        {loading ? <ActivityIndicator color="#fff" /> : <Text style={styles.buttonText}>Créer mon compte</Text>}
                    </TouchableOpacity>

                    <TouchableOpacity onPress={() => navigation.navigate('Login')} style={styles.link}>
                        <Text style={styles.linkText}>Déjà un compte ? <Text style={styles.linkBold}>Se connecter</Text></Text>
                    </TouchableOpacity>
                </View>
            </ScrollView>
        </KeyboardAvoidingView>
    );
}

const styles = StyleSheet.create({
    container: { flex: 1, backgroundColor: '#052e16' },
    scroll: { padding: 20, paddingTop: 60 },
    card: { backgroundColor: 'rgba(255,255,255,0.07)', borderRadius: 20, padding: 24, borderWidth: 1, borderColor: 'rgba(255,255,255,0.12)' },
    logo: { fontSize: 30, fontWeight: '800', color: '#fff', textAlign: 'center', marginBottom: 4 },
    subtitle: { fontSize: 14, color: '#86efac', textAlign: 'center', marginBottom: 24 },
    row: { flexDirection: 'row', gap: 10 },
    half: { flex: 1 },
    input: { backgroundColor: 'rgba(255,255,255,0.1)', borderRadius: 12, padding: 13, color: '#fff', marginBottom: 12, borderWidth: 1, borderColor: 'rgba(255,255,255,0.15)' },
    roleLabel: { color: '#d1d5db', fontSize: 13, marginBottom: 8, marginTop: 2 },
    roleRow: { flexDirection: 'row', gap: 10, marginBottom: 18 },
    roleBtn: { flex: 1, padding: 12, borderRadius: 12, borderWidth: 1, borderColor: 'rgba(255,255,255,0.2)', alignItems: 'center' },
    roleBtnActive: { backgroundColor: '#16a34a', borderColor: '#16a34a' },
    roleBtnText: { color: '#9ca3af', fontWeight: '600', fontSize: 13 },
    roleBtnTextActive: { color: '#fff' },
    button: { backgroundColor: '#16a34a', borderRadius: 12, padding: 16, alignItems: 'center' },
    buttonText: { color: '#fff', fontWeight: '700', fontSize: 16 },
    link: { marginTop: 18, alignItems: 'center' },
    linkText: { color: '#9ca3af', fontSize: 14 },
    linkBold: { color: '#4ade80', fontWeight: '600' },
});

