import { View, Text, StyleSheet, ScrollView, ActivityIndicator, Alert, TouchableOpacity } from 'react-native';
import { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { profileApi, Profile } from '../lib/api';
import { UserCircle, Briefcase, GraduationCap, Award, Edit3 } from 'lucide-react-native';

export default function ProfileScreen() {
    const { token, user } = useAuth();
    const [profile, setProfile] = useState<Profile | null>(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        if (token) loadProfile();
    }, [token]);

    const loadProfile = async () => {
        try {
            setLoading(true);
            const data = await profileApi.getMe(token as string);
            setProfile(data);
        } catch (error: any) {
            Alert.alert("Erreur", "Impossible de charger le profil.");
        } finally {
            setLoading(false);
        }
    };

    if (loading) {
        return <View style={styles.center}><ActivityIndicator color="#14B53A" size="large" /></View>;
    }

    if (!profile) {
        return (
            <View style={styles.center}>
                <Text style={styles.errorText}>Profil introuvable.</Text>
            </View>
        );
    }

    return (
        <ScrollView style={styles.container} contentContainerStyle={{ paddingBottom: 40 }}>
            {/* Header Section */}
            <View style={styles.header}>
                <View style={styles.avatar}>
                    <Text style={styles.avatarText}>{profile.user?.firstName?.[0] || 'M'}</Text>
                </View>
                <View style={styles.headerInfo}>
                    <Text style={styles.name}>{profile.user?.firstName} {profile.user?.lastName}</Text>
                    <Text style={styles.title}>{profile.title || 'Développeur en recherche'}</Text>
                    <View style={styles.badgeRow}>
                        {profile.isDiaspora && <View style={styles.badge}><Text style={styles.badgeText}>🌍 Diaspora Mali</Text></View>}
                    </View>
                </View>
            </View>

            {/* Completion Score */}
            <View style={styles.scoreCard}>
                <Text style={styles.scoreTitle}>Complétion du Profil</Text>
                <View style={styles.scoreBarBg}>
                    <View style={[styles.scoreBarFill, { width: `${profile.completionScore}%` }]} />
                </View>
                <Text style={styles.scoreNum}>{profile.completionScore}%</Text>
            </View>

            {/* About */}
            <View style={styles.section}>
                <View style={styles.sectionHeader}>
                    <Text style={styles.sectionTitle}>À propos</Text>
                    <TouchableOpacity><Edit3 color="#14B53A" size={18} /></TouchableOpacity>
                </View>
                <Text style={styles.summary}>{profile.summary || 'Aucune description fournie.'}</Text>
            </View>

            {/* Experiences (Placeholder layout) */}
            <View style={styles.section}>
                <View style={styles.sectionHeader}>
                    <View style={styles.flexRow}><Briefcase color="#fff" size={20} /><Text style={styles.sectionTitle}>Expériences</Text></View>
                    <TouchableOpacity><Edit3 color="#14B53A" size={18} /></TouchableOpacity>
                </View>
                {profile.experiences.length === 0 ? (
                    <Text style={styles.emptyText}>Aucune expérience renseignée.</Text>
                ) : (
                    profile.experiences.map((exp) => (
                        <View key={exp.id} style={styles.itemCard}>
                            <Text style={styles.itemTitle}>{exp.title}</Text>
                            <Text style={styles.itemSub}>{exp.company} • {new Date(exp.startDate).getFullYear()}</Text>
                        </View>
                    ))
                )}
            </View>

            {/* Education (Placeholder layout) */}
            <View style={styles.section}>
                <View style={styles.sectionHeader}>
                    <View style={styles.flexRow}><GraduationCap color="#fff" size={20} /><Text style={styles.sectionTitle}>Formations</Text></View>
                    <TouchableOpacity><Edit3 color="#14B53A" size={18} /></TouchableOpacity>
                </View>
                {profile.educations.length === 0 ? (
                    <Text style={styles.emptyText}>Aucune formation renseignée.</Text>
                ) : (
                    profile.educations.map((edu) => (
                        <View key={edu.id} style={styles.itemCard}>
                            <Text style={styles.itemTitle}>{edu.title}</Text>
                            <Text style={styles.itemSub}>{edu.institution} • {edu.year}</Text>
                        </View>
                    ))
                )}
            </View>

        </ScrollView>
    );
}

const styles = StyleSheet.create({
    container: { flex: 1, backgroundColor: '#0a0a0a' },
    center: { flex: 1, backgroundColor: '#0a0a0a', justifyContent: 'center', alignItems: 'center' },
    errorText: { color: '#ef4444', fontSize: 16 },
    header: { flexDirection: 'row', padding: 20, alignItems: 'center', backgroundColor: '#111', borderBottomWidth: 1, borderBottomColor: '#333' },
    avatar: { width: 70, height: 70, borderRadius: 35, backgroundColor: '#14B53A', justifyContent: 'center', alignItems: 'center', marginRight: 15 },
    avatarText: { fontSize: 32, fontWeight: '900', color: '#000' },
    headerInfo: { flex: 1 },
    name: { fontSize: 22, fontWeight: 'bold', color: '#fff' },
    title: { fontSize: 14, color: '#14B53A', fontWeight: 'bold', marginTop: 2 },
    badgeRow: { flexDirection: 'row', marginTop: 8 },
    badge: { backgroundColor: '#3b82f630', paddingHorizontal: 8, paddingVertical: 4, borderRadius: 8 },
    badgeText: { color: '#60a5fa', fontSize: 10, fontWeight: 'bold', textTransform: 'uppercase' },
    scoreCard: { margin: 20, backgroundColor: '#1a1a1a', padding: 16, borderRadius: 16, borderWidth: 1, borderColor: '#333' },
    scoreTitle: { color: '#fff', fontSize: 14, fontWeight: 'bold', mb: 8 },
    scoreBarBg: { height: 8, backgroundColor: '#333', borderRadius: 4, my: 8, overflow: 'hidden' },
    scoreBarFill: { height: '100%', backgroundColor: '#FCD116', borderRadius: 4 },
    scoreNum: { color: '#FCD116', fontSize: 12, fontWeight: 'bold', alignSelf: 'flex-end', marginTop: 4 },
    section: { paddingHorizontal: 20, marginBottom: 25 },
    sectionHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 },
    flexRow: { flexDirection: 'row', alignItems: 'center', gap: 8 },
    sectionTitle: { fontSize: 18, fontWeight: 'bold', color: '#fff' },
    summary: { color: '#9ca3af', fontSize: 14, lineHeight: 22 },
    emptyText: { color: '#4b5563', fontSize: 14, fontStyle: 'italic' },
    itemCard: { backgroundColor: '#111', padding: 16, borderRadius: 12, borderWidth: 1, borderColor: '#222', marginBottom: 8 },
    itemTitle: { color: '#fff', fontSize: 16, fontWeight: 'bold' },
    itemSub: { color: '#6b7280', fontSize: 12, marginTop: 4 }
});
