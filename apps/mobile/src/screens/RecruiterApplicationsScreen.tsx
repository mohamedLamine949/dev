import React, { useState, useEffect, useCallback } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, ActivityIndicator, Alert, RefreshControl } from 'react-native';
import { useAuth } from '../context/AuthContext';
import { jobsApi, appsApi } from '../lib/api';
import { Phone, Mail, Globe, CalendarDays, Check, X, Star, Eye, Briefcase, Inbox, ChevronLeft } from 'lucide-react-native';
import { useNavigation } from '@react-navigation/native';
import { Picker } from '@react-native-picker/picker';

const STATUS_MAP: Record<string, { label: string; color: string; bg: string }> = {
    SENT: { label: 'Nouvelle', color: '#9ca3af', bg: '#4b556330' },
    REVIEWED: { label: 'Consultée', color: '#FCD116', bg: '#FCD11630' },
    SHORTLISTED: { label: 'Présélectionné', color: '#3b82f6', bg: '#3b82f630' },
    INTERVIEW: { label: 'Entretien', color: '#a855f7', bg: '#a855f730' },
    ACCEPTED: { label: 'Accepté', color: '#14B53A', bg: '#14B53A30' },
    REJECTED: { label: 'Refusé', color: '#ef4444', bg: '#ef444430' },
};

export default function RecruiterApplicationsScreen() {
    const { token } = useAuth();
    const navigation = useNavigation();

    const [jobs, setJobs] = useState<any[]>([]);
    const [selectedJob, setSelectedJob] = useState<string>('');
    const [applications, setApplications] = useState<any[]>([]);
    const [total, setTotal] = useState(0);
    const [pageLoading, setPageLoading] = useState(true);
    const [appsLoading, setAppsLoading] = useState(false);
    const [refreshing, setRefreshing] = useState(false);

    useEffect(() => {
        loadJobs();
    }, []);

    const loadJobs = async () => {
        try {
            setPageLoading(true);
            const { jobs } = await jobsApi.list({ limit: 100 });
            setJobs(jobs);
        } catch (error) {
            console.error(error);
        } finally {
            setPageLoading(false);
        }
    };

    const loadApps = async (jobId: string, isRefresh = false) => {
        if (!jobId) return;
        try {
            if (!isRefresh) setAppsLoading(true);
            const data = await jobsApi.getApplications(token!, jobId);
            setApplications(data.applications);
            setTotal(data.total);
        } catch (error) {
            console.error(error);
        } finally {
            if (!isRefresh) setAppsLoading(false);
            setRefreshing(false);
        }
    };

    useEffect(() => {
        if (selectedJob) {
            loadApps(selectedJob);
        } else {
            setApplications([]);
            setTotal(0);
        }
    }, [selectedJob]);

    const onRefresh = useCallback(() => {
        if (selectedJob) {
            setRefreshing(true);
            loadApps(selectedJob, true);
        }
    }, [selectedJob]);

    const updateStatus = async (appId: string, status: string) => {
        try {
            await appsApi.updateStatus(token!, appId, status);
            // Optimistic update locally
            setApplications(prev => prev.map(a => a.id === appId ? { ...a, status } : a));
        } catch (error: any) {
            Alert.alert("Erreur", error.message || "Impossible de mettre à jour le statut");
        }
    };

    if (pageLoading) return <View style={styles.center}><ActivityIndicator color="#14B53A" size="large" /></View>;

    return (
        <View style={styles.container}>
            <View style={styles.header}>
                <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backBtn}>
                    <ChevronLeft color="#fff" size={24} />
                </TouchableOpacity>
                <Text style={styles.headerTitle}>Candidatures reçues</Text>
                <View style={{ width: 40 }} />
            </View>

            <View style={styles.selectorContainer}>
                <Text style={styles.label}>Sélectionnez une offre :</Text>
                <View style={styles.pickerWrapper}>
                    <Picker
                        selectedValue={selectedJob}
                        onValueChange={val => setSelectedJob(val)}
                        style={styles.picker}
                    >
                        <Picker.Item label="-- Choisir une offre --" value="" />
                        {jobs.map(j => <Picker.Item key={j.id} label={j.title} value={j.id} />)}
                    </Picker>
                </View>
            </View>

            {!selectedJob ? (
                <View style={styles.centerBox}>
                    <Inbox size={48} color="#4b5563" />
                    <Text style={styles.centerTitle}>Sélectionnez une offre ci-dessus</Text>
                    <Text style={styles.centerDesc}>Les candidatures reçues apparaîtront ici</Text>
                </View>
            ) : appsLoading ? (
                <View style={styles.center}><ActivityIndicator color="#14B53A" size="large" /></View>
            ) : applications.length === 0 ? (
                <View style={styles.centerBox}>
                    <Inbox size={48} color="#4b5563" />
                    <Text style={styles.centerTitle}>Aucune candidature reçue</Text>
                    <Text style={styles.centerDesc}>Cette offre n'a pas encore de candidats.</Text>
                </View>
            ) : (
                <ScrollView 
                    contentContainerStyle={styles.listContainer}
                    refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor="#14B53A" />}
                >
                    <Text style={styles.countText}>{total} candidature(s) trouvée(s)</Text>
                    
                    {applications.map(app => {
                        const st = STATUS_MAP[app.status] || STATUS_MAP.SENT;
                        return (
                            <View key={app.id} style={styles.appCard}>
                                <View style={styles.appHeaderRow}>
                                    <View style={{ flex: 1, paddingRight: 10 }}>
                                        <Text style={styles.appName} numberOfLines={1}>{app.user.firstName} {app.user.lastName}</Text>
                                        <Text style={styles.appCountry}><Globe size={12} color="#14B53A" /> {app.user.country}</Text>
                                    </View>
                                    <View style={[styles.badge, { backgroundColor: st.bg, borderColor: st.color }]}>
                                        <Text style={[styles.badgeText, { color: st.color }]}>{st.label}</Text>
                                    </View>
                                </View>

                                <View style={styles.contactsRow}>
                                    <View style={styles.contactItem}><Phone size={14} color="#FCD116" /><Text style={styles.contactText}>{app.user.phone}</Text></View>
                                    {app.user.email && <View style={styles.contactItem}><Mail size={14} color="#CE1126" /><Text style={styles.contactText}>{app.user.email}</Text></View>}
                                    <View style={styles.contactItem}><CalendarDays size={14} color="#6b7280" /><Text style={styles.contactText}>{new Date(app.createdAt).toLocaleDateString('fr-FR')}</Text></View>
                                </View>

                                {/* Action Buttons */}
                                <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.actionsRow}>
                                    {app.status === 'SENT' && (
                                        <TouchableOpacity style={[styles.actionBtn, {backgroundColor: '#374151'}]} onPress={() => updateStatus(app.id, 'REVIEWED')}>
                                            <Eye size={14} color="#d1d5db" /><Text style={[styles.actionText, {color: '#d1d5db'}]}>Lue</Text>
                                        </TouchableOpacity>
                                    )}
                                    {['SENT', 'REVIEWED'].includes(app.status) && (
                                        <TouchableOpacity style={[styles.actionBtn, {backgroundColor: '#3b82f630'}]} onPress={() => updateStatus(app.id, 'SHORTLISTED')}>
                                            <Star size={14} color="#3b82f6" /><Text style={[styles.actionText, {color: '#3b82f6'}]}>Pré-sélectionner</Text>
                                        </TouchableOpacity>
                                    )}
                                    {['SHORTLISTED', 'REVIEWED'].includes(app.status) && (
                                        <TouchableOpacity style={[styles.actionBtn, {backgroundColor: '#a855f730'}]} onPress={() => updateStatus(app.id, 'INTERVIEW')}>
                                            <CalendarDays size={14} color="#a855f7" /><Text style={[styles.actionText, {color: '#a855f7'}]}>Entretien</Text>
                                        </TouchableOpacity>
                                    )}
                                    {app.status === 'INTERVIEW' && (
                                        <TouchableOpacity style={[styles.actionBtn, {backgroundColor: '#14B53A30'}]} onPress={() => updateStatus(app.id, 'ACCEPTED')}>
                                            <Check size={14} color="#14B53A" /><Text style={[styles.actionText, {color: '#14B53A'}]}>Accepter</Text>
                                        </TouchableOpacity>
                                    )}
                                    {!['ACCEPTED', 'REJECTED'].includes(app.status) && (
                                        <TouchableOpacity style={[styles.actionBtn, {backgroundColor: '#ef444430'}]} onPress={() => updateStatus(app.id, 'REJECTED')}>
                                            <X size={14} color="#ef4444" /><Text style={[styles.actionText, {color: '#ef4444'}]}>Refuser</Text>
                                        </TouchableOpacity>
                                    )}
                                </ScrollView>
                            </View>
                        );
                    })}
                </ScrollView>
            )}
        </View>
    );
}

const styles = StyleSheet.create({
    container: { flex: 1, backgroundColor: '#0a0a0a' },
    center: { flex: 1, backgroundColor: '#0a0a0a', alignItems: 'center', justifyContent: 'center' },
    header: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingTop: 60, paddingBottom: 20, paddingHorizontal: 20, backgroundColor: '#111', borderBottomWidth: 1, borderBottomColor: '#222' },
    backBtn: { width: 40, height: 40, alignItems: 'center', justifyContent: 'center', backgroundColor: '#222', borderRadius: 20 },
    headerTitle: { color: '#fff', fontSize: 18, fontWeight: 'bold' },

    selectorContainer: { padding: 20, paddingBottom: 5, zIndex: 10 },
    label: { color: '#9ca3af', fontSize: 13, fontWeight: '600', marginBottom: 8 },
    pickerWrapper: { backgroundColor: '#1f2937', borderRadius: 12, borderWidth: 1, borderColor: '#374151', overflow: 'hidden' },
    picker: { color: '#fff' },

    centerBox: { flex: 1, alignItems: 'center', justifyContent: 'center', padding: 30 },
    centerTitle: { color: '#fff', fontSize: 18, fontWeight: 'bold', marginTop: 15, marginBottom: 5, textAlign: 'center' },
    centerDesc: { color: '#9ca3af', fontSize: 14, textAlign: 'center' },

    listContainer: { padding: 20, paddingBottom: 100 },
    countText: { color: '#9ca3af', fontSize: 13, fontWeight: '600', marginBottom: 15 },
    
    appCard: { backgroundColor: '#111', padding: 16, borderRadius: 16, marginBottom: 15, borderWidth: 1, borderColor: '#222' },
    appHeaderRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 10 },
    appName: { color: '#fff', fontSize: 18, fontWeight: 'bold', marginBottom: 2 },
    appCountry: { color: '#d1d5db', fontSize: 13, flexDirection: 'row', alignItems: 'center' },
    
    badge: { paddingHorizontal: 10, paddingVertical: 4, borderRadius: 12, borderWidth: 1 },
    badgeText: { fontSize: 10, fontWeight: 'bold', textTransform: 'uppercase' },

    contactsRow: { gap: 6, marginBottom: 15 },
    contactItem: { flexDirection: 'row', alignItems: 'center', gap: 6 },
    contactText: { color: '#9ca3af', fontSize: 13 },

    actionsRow: { flexDirection: 'row', paddingTop: 10, borderTopWidth: 1, borderTopColor: '#222' },
    actionBtn: { flexDirection: 'row', alignItems: 'center', gap: 6, paddingHorizontal: 12, paddingVertical: 8, borderRadius: 8, marginRight: 10 },
    actionText: { fontSize: 12, fontWeight: 'bold' },
});
