import { View, Text, StyleSheet, FlatList, ActivityIndicator, Alert, TouchableOpacity } from 'react-native';
import { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { appsApi } from '../lib/api';
import { Briefcase, Building2, Calendar, MapPin, ChevronRight } from 'lucide-react-native';

export default function ApplicationsScreen() {
    const { token } = useAuth();
    const [apps, setApps] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        if (token) loadApps();
    }, [token]);

    const loadApps = async () => {
        try {
            setLoading(true);
            const data: any = await appsApi.getMyApps(token as string);
            setApps(data);
        } catch (error: any) {
            Alert.alert("Erreur", "Impossible de charger vos candidatures.");
        } finally {
            setLoading(false);
        }
    };

    const getStatusColor = (status: string) => {
        switch (status) {
            case 'ACCEPTED': return '#14B53A';
            case 'REJECTED': return '#ef4444';
            case 'REVIEWING': return '#f59e0b';
            default: return '#3b82f6';
        }
    };

    const getStatusLabel = (status: string) => {
        switch (status) {
            case 'ACCEPTED': return 'Acceptée';
            case 'REJECTED': return 'Refusée';
            case 'REVIEWING': return 'En cours de révision';
            default: return 'Envoyée';
        }
    };

    const renderItem = ({ item }: { item: any }) => {
        const { job, status, createdAt } = item;
        return (
            <TouchableOpacity style={styles.card}>
                <View style={styles.cardHeader}>
                    <Text style={styles.jobTitle} numberOfLines={1}>{job.title}</Text>
                    <View style={[styles.badge, { backgroundColor: getStatusColor(status) + '20' }]}>
                        <Text style={[styles.badgeText, { color: getStatusColor(status) }]}>{getStatusLabel(status)}</Text>
                    </View>
                </View>

                <View style={styles.infoRow}>
                    <Building2 color="#6b7280" size={16} />
                    <Text style={styles.infoText}>{job.employer.name}</Text>
                </View>

                <View style={[styles.infoRow, { marginTop: 4 }]}>
                    <MapPin color="#6b7280" size={16} />
                    <Text style={styles.infoText}>{job.regions ? JSON.parse(job.regions).join(', ') : 'Mali'}</Text>
                </View>

                <View style={styles.cardFooter}>
                    <View style={styles.dateRow}>
                        <Calendar color="#6b7280" size={14} />
                        <Text style={styles.dateText}>Postulé le {new Date(createdAt).toLocaleDateString('fr-FR')}</Text>
                    </View>
                    <ChevronRight color="#4ade80" size={20} />
                </View>
            </TouchableOpacity>
        );
    };

    return (
        <View style={styles.container}>
            <View style={styles.header}>
                <Text style={styles.title}>Candidatures</Text>
                <Text style={styles.subtitle}>Suivez l'état de vos postulations.</Text>
            </View>

            {loading ? (
                <View style={styles.center}><ActivityIndicator color="#14B53A" size="large" /></View>
            ) : apps.length === 0 ? (
                <View style={styles.center}>
                    <Briefcase color="#333" size={64} style={{ marginBottom: 20 }} />
                    <Text style={styles.emptyTitle}>Aucun processus en cours</Text>
                    <Text style={styles.emptySub}>Découvrez des offres et postulez, nous garderons une trace de vos envois ici.</Text>
                </View>
            ) : (
                <FlatList
                    data={apps}
                    keyExtractor={item => item.id}
                    renderItem={renderItem}
                    contentContainerStyle={{ padding: 20, paddingTop: 0, paddingBottom: 40 }}
                />
            )}
        </View>
    );
}

const styles = StyleSheet.create({
    container: { flex: 1, backgroundColor: '#0a0a0a' },
    header: { padding: 20, paddingTop: 60, backgroundColor: '#0a0a0a' },
    title: { fontSize: 28, fontWeight: 'bold', color: '#fff', marginBottom: 4 },
    subtitle: { fontSize: 16, color: '#9ca3af' },
    center: { flex: 1, justifyContent: 'center', alignItems: 'center', padding: 20 },
    emptyTitle: { fontSize: 18, fontWeight: 'bold', color: '#fff', marginBottom: 8 },
    emptySub: { fontSize: 14, color: '#6b7280', textAlign: 'center' },
    card: { backgroundColor: '#111', borderWidth: 1, borderColor: '#222', borderRadius: 16, padding: 16, marginBottom: 16 },
    cardHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 12 },
    jobTitle: { color: '#fff', fontSize: 18, fontWeight: 'bold', flex: 1, marginRight: 12 },
    badge: { paddingHorizontal: 8, paddingVertical: 4, borderRadius: 8 },
    badgeText: { fontSize: 12, fontWeight: 'bold', textTransform: 'uppercase' },
    infoRow: { flexDirection: 'row', alignItems: 'center', gap: 8 },
    infoText: { color: '#e5e7eb', fontSize: 14 },
    cardFooter: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginTop: 16, paddingTop: 16, borderTopWidth: 1, borderTopColor: '#222' },
    dateRow: { flexDirection: 'row', alignItems: 'center', gap: 6 },
    dateText: { color: '#6b7280', fontSize: 12, fontWeight: '600' }
});
