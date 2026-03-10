import { View, Text, StyleSheet, ScrollView, ActivityIndicator, TouchableOpacity, Alert, Modal, TextInput } from 'react-native';
import { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { jobsApi, appsApi, documentsApi } from '../lib/api';
import { Building2, MapPin, Briefcase, CalendarDays, ChevronLeft, Send, X, FileText } from 'lucide-react-native';
import { useNavigation } from '@react-navigation/native';

export default function JobDetailsScreen({ route }: any) {
    const { jobId } = route.params;
    const { token } = useAuth();
    const navigation = useNavigation();

    const [job, setJob] = useState<any>(null);
    const [loading, setLoading] = useState(true);

    // Apply Modal State
    const [applyModalVisible, setApplyModalVisible] = useState(false);
    const [applyLoading, setApplyLoading] = useState(false);
    const [introMessage, setIntroMessage] = useState('');

    // Vault State
    const [vaultDocs, setVaultDocs] = useState<any[]>([]);
    const [selectedDocId, setSelectedDocId] = useState<string | null>(null);

    useEffect(() => {
        loadJob();
        if (token) loadVaultDocs();
    }, [jobId, token]);

    const loadVaultDocs = async () => {
        try {
            const docs = await documentsApi.list(token as string);
            setVaultDocs(docs);
            if (docs.length > 0) setSelectedDocId(docs[0].id);
        } catch (error) {
            console.error("Failed to load documents", error);
        }
    };

    const loadJob = async () => {
        try {
            setLoading(true);
            const data = await jobsApi.get(jobId);
            setJob(data);
        } catch (error) {
            Alert.alert("Erreur", "Offre introuvable.");
            navigation.goBack();
        } finally {
            setLoading(false);
        }
    };

    const handleApply = async () => {
        if (!selectedDocId) {
            Alert.alert("Erreur", "Veuillez sélectionner un CV.");
            return;
        }

        try {
            setApplyLoading(true);
            await appsApi.apply(token as string, jobId, {
                introMessage,
                applicationDocs: [{ documentId: selectedDocId, category: 'CV' }]
            });
            Alert.alert("Succès", "Votre candidature a été envoyée !");
            setApplyModalVisible(false);
            setIntroMessage('');
        } catch (error: any) {
            Alert.alert("Erreur", error.message || "Impossible de postuler.");
        } finally {
            setApplyLoading(false);
        }
    };

    if (loading) {
        return (
            <View style={[styles.container, { justifyContent: 'center', alignItems: 'center' }]}>
                <ActivityIndicator color="#14B53A" size="large" />
            </View>
        );
    }

    if (!job) return null;

    const regions = job.regions ? JSON.parse(job.regions) : [];

    return (
        <View style={styles.container}>
            {/* Custom Header */}
            <View style={styles.header}>
                <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backBtn}>
                    <ChevronLeft color="#fff" size={24} />
                </TouchableOpacity>
                <Text style={styles.headerTitle} numberOfLines={1}>Détails de l'offre</Text>
                <View style={{ width: 40 }} />
            </View>

            <ScrollView contentContainerStyle={styles.content}>
                {/* Job Title & Employer */}
                <Text style={styles.title}>{job.title}</Text>
                <View style={styles.employerRow}>
                    <View style={styles.employerLogo}>
                        <Building2 color="#14B53A" size={24} />
                    </View>
                    <View>
                        <Text style={styles.employerName}>{job.employer.name}</Text>
                        <Text style={styles.postDate}>Publiée le {new Date(job.createdAt).toLocaleDateString('fr-FR')}</Text>
                    </View>
                </View>

                {/* Tags Row */}
                <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.tagsContainer}>
                    <View style={styles.tag}><Briefcase color="#9ca3af" size={14} /><Text style={styles.tagText}>{job.type}</Text></View>
                    <View style={styles.tag}><MapPin color="#9ca3af" size={14} /><Text style={styles.tagText}>{regions.length > 0 ? regions[0] : 'Mali'}</Text></View>
                    <View style={styles.tag}><CalendarDays color="#9ca3af" size={14} /><Text style={styles.tagText}>{job.experienceLevel || 'Indéfini'}</Text></View>
                </ScrollView>

                {/* Section Description */}
                <Text style={styles.sectionTitle}>À propos du poste</Text>
                <Text style={styles.bodyText}>{job.description}</Text>

                {/* Section Requirements */}
                <Text style={styles.sectionTitle}>Profil Recherché</Text>
                <Text style={styles.bodyText}>{job.requirements}</Text>

                <View style={{ height: 100 }} />
            </ScrollView>

            {/* Bottom Action Bar */}
            <View style={styles.bottomBar}>
                <TouchableOpacity style={styles.applyBtn} onPress={() => setApplyModalVisible(true)}>
                    <Send color="#fff" size={20} />
                    <Text style={styles.applyBtnText}>Postuler maintenant</Text>
                </TouchableOpacity>
            </View>

            {/* Application Modal */}
            <Modal visible={applyModalVisible} animationType="slide" transparent>
                <View style={styles.modalOverlay}>
                    <View style={styles.modalContent}>
                        <View style={styles.modalHeader}>
                            <Text style={styles.modalTitle}>Postuler</Text>
                            <TouchableOpacity onPress={() => setApplyModalVisible(false)}>
                                <X color="#9ca3af" size={24} />
                            </TouchableOpacity>
                        </View>

                        <Text style={styles.modalLabel}>Message d'introduction (Optionnel)</Text>
                        <TextInput
                            style={styles.modalInput}
                            multiline
                            numberOfLines={4}
                            placeholder="Pourquoi êtes-vous le candidat idéal ?"
                            placeholderTextColor="#6b7280"
                            value={introMessage}
                            onChangeText={setIntroMessage}
                        />

                        <Text style={styles.modalLabel}>Sélectionnez un document du coffre-fort</Text>
                        {vaultDocs.length === 0 ? (
                            <View style={styles.emptyDocsBox}>
                                <Text style={styles.emptyDocsText}>Votre coffre-fort est vide. Allez dans l'onglet Documents pour ajouter un CV.</Text>
                            </View>
                        ) : (
                            <ScrollView style={styles.docsList} nestedScrollEnabled>
                                {vaultDocs.map(doc => (
                                    <TouchableOpacity
                                        key={doc.id}
                                        style={[styles.docItem, selectedDocId === doc.id && styles.docItemActive]}
                                        onPress={() => setSelectedDocId(doc.id)}
                                    >
                                        <FileText color={selectedDocId === doc.id ? '#14B53A' : '#9ca3af'} size={20} />
                                        <Text style={[styles.docItemText, selectedDocId === doc.id && styles.docItemTextActive]}>{doc.name}</Text>
                                    </TouchableOpacity>
                                ))}
                            </ScrollView>
                        )}

                        <TouchableOpacity
                            style={[styles.submitAppBtn, (applyLoading || !selectedDocId) && styles.submitAppBtnDisabled]}
                            onPress={handleApply}
                            disabled={applyLoading || !selectedDocId}
                        >
                            {applyLoading ? <ActivityIndicator color="#fff" /> : <Text style={styles.submitAppBtnText}>Envoyer la candidature</Text>}
                        </TouchableOpacity>
                    </View>
                </View>
            </Modal>
        </View>
    );
}

const styles = StyleSheet.create({
    container: { flex: 1, backgroundColor: '#0a0a0a' },
    header: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingTop: 60, paddingBottom: 20, paddingHorizontal: 20, backgroundColor: '#111', borderBottomWidth: 1, borderBottomColor: '#222' },
    backBtn: { width: 40, height: 40, alignItems: 'center', justifyContent: 'center', backgroundColor: '#222', borderRadius: 20 },
    headerTitle: { color: '#fff', fontSize: 18, fontWeight: 'bold', flex: 1, textAlign: 'center' },
    content: { padding: 20 },
    title: { fontSize: 26, fontWeight: 'bold', color: '#fff', marginBottom: 16 },
    employerRow: { flexDirection: 'row', alignItems: 'center', marginBottom: 24, padding: 16, backgroundColor: '#111', borderRadius: 16, borderWidth: 1, borderColor: '#222' },
    employerLogo: { width: 50, height: 50, borderRadius: 12, backgroundColor: '#14B53A20', alignItems: 'center', justifyContent: 'center', marginRight: 16 },
    employerName: { color: '#fff', fontSize: 18, fontWeight: 'bold', marginBottom: 4 },
    postDate: { color: '#9ca3af', fontSize: 13 },
    tagsContainer: { flexDirection: 'row', marginBottom: 30 },
    tag: { flexDirection: 'row', alignItems: 'center', backgroundColor: '#111', paddingHorizontal: 12, paddingVertical: 8, borderRadius: 12, borderWidth: 1, borderColor: '#333', marginRight: 10, gap: 6 },
    tagText: { color: '#e5e7eb', fontSize: 13, fontWeight: '600' },
    sectionTitle: { fontSize: 20, fontWeight: 'bold', color: '#fff', marginBottom: 12, marginTop: 10 },
    bodyText: { fontSize: 16, color: '#9ca3af', lineHeight: 24, marginBottom: 20 },
    bottomBar: { position: 'absolute', bottom: 0, left: 0, right: 0, padding: 20, paddingTop: 16, backgroundColor: 'rgba(10, 10, 10, 0.95)', borderTopWidth: 1, borderTopColor: '#222' },
    applyBtn: { backgroundColor: '#14B53A', flexDirection: 'row', alignItems: 'center', justifyContent: 'center', padding: 18, borderRadius: 16, gap: 10 },
    applyBtnText: { color: '#fff', fontSize: 18, fontWeight: 'bold' },

    // Modal Styles
    modalOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.7)', justifyContent: 'flex-end' },
    modalContent: { backgroundColor: '#111', borderTopLeftRadius: 24, borderTopRightRadius: 24, padding: 24, paddingBottom: 40, maxHeight: '80%' },
    modalHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 },
    modalTitle: { color: '#fff', fontSize: 22, fontWeight: 'bold' },
    modalLabel: { color: '#e5e7eb', fontSize: 15, fontWeight: '600', marginBottom: 10, marginTop: 10 },
    modalInput: { backgroundColor: '#1f2937', color: '#fff', borderRadius: 12, padding: 16, fontSize: 15, textAlignVertical: 'top', minHeight: 100 },
    emptyDocsBox: { backgroundColor: '#37415120', padding: 16, borderRadius: 12, borderWidth: 1, borderColor: '#374151', alignItems: 'center' },
    emptyDocsText: { color: '#9ca3af', textAlign: 'center' },
    docsList: { maxHeight: 200, marginBottom: 10 },
    docItem: { flexDirection: 'row', alignItems: 'center', backgroundColor: '#1f2937', padding: 16, borderRadius: 12, marginBottom: 8, borderWidth: 1, borderColor: 'transparent', gap: 12 },
    docItemActive: { borderColor: '#14B53A', backgroundColor: '#14B53A10' },
    docItemText: { color: '#e5e7eb', fontSize: 15, flex: 1 },
    docItemTextActive: { color: '#14B53A', fontWeight: 'bold' },
    submitAppBtn: { backgroundColor: '#14B53A', padding: 18, borderRadius: 16, alignItems: 'center', marginTop: 20 },
    submitAppBtnDisabled: { backgroundColor: '#14B53A50' },
    submitAppBtnText: { color: '#fff', fontSize: 16, fontWeight: 'bold' },
});
