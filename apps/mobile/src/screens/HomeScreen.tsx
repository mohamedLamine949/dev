import React from 'react';
import {
    View, Text, TouchableOpacity, StyleSheet, ScrollView,
} from 'react-native';
import { useAuth } from '../context/AuthContext';
import { useNavigation } from '@react-navigation/native';
import { BottomTabNavigationProp } from '@react-navigation/bottom-tabs';

export default function HomeScreen() {
    const { user, logout } = useAuth();
    const navigation = useNavigation<BottomTabNavigationProp<any>>();

    if (!user) return null;

    const roleLabel = user.role === 'RECRUITER' ? 'Recruteur' : user.role === 'ADMIN' ? 'Administrateur' : 'Candidat';
    const roleColor = user.role === 'RECRUITER' ? '#2563eb' : user.role === 'ADMIN' ? '#7c3aed' : '#16a34a';

    const candidateActions = [
        { icon: '💼', label: 'Offres d\'emploi', desc: 'Parcourir les offres', route: 'MaliLink Jobs' },
        { icon: '📄', label: 'Mon CV', desc: 'Gérer mon profil', route: 'Mon Profil' },
        { icon: '📋', label: 'Candidatures', desc: 'Suivre mes dossiers', route: 'Mes Candidatures' },
        { icon: '📁', label: 'Documents', desc: 'Coffre-fort', route: 'Coffre-fort' },
    ];
    // Recruiters don't have standard mobile tabs built yet for "Publier", so we default them to Jobs mostly.
    const recruiterActions = [
        { icon: '📢', label: 'Les offres', desc: 'Parcourir les offres', route: 'MaliLink Jobs' },
        { icon: '📄', label: 'Mon Profil', desc: 'Gérer mon compte', route: 'Mon Profil' },
    ];
    const actions = user.role === 'RECRUITER' ? recruiterActions : candidateActions;

    return (
        <ScrollView style={styles.container} contentContainerStyle={styles.content}>
            {/* Header */}
            <View style={styles.header}>
                <Text style={styles.appName}>MaliLink</Text>
                <TouchableOpacity onPress={logout} style={styles.logoutBtn}>
                    <Text style={styles.logoutText}>Quitter</Text>
                </TouchableOpacity>
            </View>

            {/* Welcome Card */}
            <View style={styles.welcomeCard}>
                <View style={[styles.avatar, { backgroundColor: roleColor }]}>
                    <Text style={styles.avatarText}>{user.firstName[0]}{user.lastName[0]}</Text>
                </View>
                <View>
                    <Text style={styles.welcomeName}>Bonjour, {user.firstName} 👋</Text>
                    <View style={[styles.roleBadge, { backgroundColor: roleColor + '30', borderColor: roleColor + '60' }]}>
                        <Text style={[styles.roleBadgeText, { color: roleColor }]}>{roleLabel}</Text>
                    </View>
                </View>
            </View>

            {/* Quick Actions */}
            <Text style={styles.sectionTitle}>Actions rapides</Text>
            <View style={styles.actionsGrid}>
                {actions.map(a => (
                    <TouchableOpacity key={a.label} style={styles.actionCard} onPress={() => navigation.navigate(a.route)}>
                        <Text style={styles.actionIcon}>{a.icon}</Text>
                        <Text style={styles.actionLabel}>{a.label}</Text>
                        <Text style={styles.actionDesc}>{a.desc}</Text>
                    </TouchableOpacity>
                ))}
            </View>
        </ScrollView>
    );
}

const styles = StyleSheet.create({
    container: { flex: 1, backgroundColor: '#052e16' },
    content: { padding: 20, paddingTop: 60 },
    header: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 24 },
    appName: { fontSize: 22, fontWeight: '800', color: '#fff' },
    logoutBtn: { borderWidth: 1, borderColor: 'rgba(255,255,255,0.2)', borderRadius: 10, paddingHorizontal: 14, paddingVertical: 7 },
    logoutText: { color: '#9ca3af', fontSize: 13 },
    welcomeCard: { flexDirection: 'row', alignItems: 'center', gap: 14, backgroundColor: 'rgba(255,255,255,0.07)', borderRadius: 18, padding: 18, borderWidth: 1, borderColor: 'rgba(255,255,255,0.1)', marginBottom: 28 },
    avatar: { width: 52, height: 52, borderRadius: 26, alignItems: 'center', justifyContent: 'center' },
    avatarText: { color: '#fff', fontWeight: '800', fontSize: 18 },
    welcomeName: { color: '#fff', fontWeight: '600', fontSize: 17, marginBottom: 6 },
    roleBadge: { borderRadius: 20, borderWidth: 1, paddingHorizontal: 10, paddingVertical: 3, alignSelf: 'flex-start' },
    roleBadgeText: { fontSize: 12, fontWeight: '600' },
    sectionTitle: { color: '#d1d5db', fontWeight: '600', fontSize: 15, marginBottom: 12 },
    actionsGrid: { gap: 12 },
    actionCard: { backgroundColor: 'rgba(255,255,255,0.07)', borderRadius: 16, padding: 18, borderWidth: 1, borderColor: 'rgba(255,255,255,0.1)' },
    actionIcon: { fontSize: 26, marginBottom: 8 },
    actionLabel: { color: '#fff', fontWeight: '600', fontSize: 15, marginBottom: 2 },
    actionDesc: { color: '#9ca3af', fontSize: 13 },
});
