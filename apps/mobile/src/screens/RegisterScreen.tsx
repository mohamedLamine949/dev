import React, { useState } from 'react';
import {
    View, Text, TextInput, TouchableOpacity,
    StyleSheet, KeyboardAvoidingView, Platform, Alert, ActivityIndicator, ScrollView,
} from 'react-native';
import { useAuth } from '../context/AuthContext';

export default function RegisterScreen({ onGoLogin }: { onGoLogin: () => void }) {
    const { register } = useAuth();
    const [form, setForm] = useState({
        firstName: '', lastName: '', email: '', phone: '',
        password: '', country: 'Mali', role: 'CANDIDATE' as 'CANDIDATE' | 'RECRUITER',
    });
    const [loading, setLoading] = useState(false);

    const update = (key: string, value: string) => setForm(prev => ({ ...prev, [key]: value }));

    const handleRegister = async () => {
        if (!form.firstName || !form.lastName || !form.phone || !form.password || !form.country) {
            Alert.alert('Erreur', 'Veuillez remplir tous les champs obligatoires (Prénom, Nom, Téléphone, Pays, Mot de passe)');
            return;
        }
        setLoading(true);
        try {
            await register(form);
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
                    <Text style={styles.logo}>MaliLink</Text>
                    <Text style={styles.subtitle}>Créez votre compte gratuitement</Text>

                    <View style={styles.row}>
                        <TextInput style={[styles.input, styles.half]} placeholder="Prénom" placeholderTextColor="#9ca3af"
                            value={form.firstName} onChangeText={(v: string) => update('firstName', v)} />
                        <TextInput style={[styles.input, styles.half]} placeholder="Nom" placeholderTextColor="#9ca3af"
                            value={form.lastName} onChangeText={(v: string) => update('lastName', v)} />
                    </View>
                    <TextInput style={styles.input} placeholder="Téléphone" placeholderTextColor="#9ca3af"
                        value={form.phone} onChangeText={(v: string) => update('phone', v)} keyboardType="phone-pad" />
                    <TextInput style={styles.input} placeholder="Email (optionnel)" placeholderTextColor="#9ca3af"
                        value={form.email} onChangeText={(v: string) => update('email', v)} keyboardType="email-address" autoCapitalize="none" />
                    <TextInput style={styles.input} placeholder="Pays" placeholderTextColor="#9ca3af"
                        value={form.country} onChangeText={(v: string) => update('country', v)} />
                    <TextInput style={styles.input} placeholder="Mot de passe" placeholderTextColor="#9ca3af"
                        value={form.password} onChangeText={(v: string) => update('password', v)} secureTextEntry />

                    <Text style={styles.roleLabel}>Je suis un(e)</Text>
                    <View style={styles.roleRow}>
                        {(['CANDIDATE', 'RECRUITER'] as const).map(role => (
                            <TouchableOpacity
                                key={role}
                                style={[styles.roleBtn, form.role === role && styles.roleBtnActive]}
                                onPress={() => update('role', role)}
                            >
                                <Text style={[styles.roleBtnText, form.role === role && styles.roleBtnTextActive]}>
                                    {role === 'CANDIDATE' ? '👤 Candidat' : '🏢 Recruteur'}
                                </Text>
                            </TouchableOpacity>
                        ))}
                    </View>

                    <TouchableOpacity style={styles.button} onPress={handleRegister} disabled={loading}>
                        {loading ? <ActivityIndicator color="#fff" /> : <Text style={styles.buttonText}>Créer mon compte</Text>}
                    </TouchableOpacity>

                    <TouchableOpacity onPress={onGoLogin} style={styles.link}>
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

