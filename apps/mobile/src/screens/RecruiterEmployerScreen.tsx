import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, ScrollView, TextInput, TouchableOpacity, ActivityIndicator, Alert, Image } from 'react-native';
import { useAuth } from '../context/AuthContext';
import { employerApi } from '../lib/api';
import { Building2, UploadCloud, ChevronLeft } from 'lucide-react-native';
import { useNavigation } from '@react-navigation/native';
import * as DocumentPicker from 'expo-document-picker';
import { Picker } from '@react-native-picker/picker';

const CATEGORIES = ['Grande Entreprise', 'PME / PMI', 'Startup', 'Administration Publique', 'ONG / Association', 'Cabinet de Recrutement', 'Institution Internationale'];

export default function RecruiterEmployerScreen() {
    const { token, user } = useAuth();
    const navigation = useNavigation();
    
    const [form, setForm] = useState({ name: '', category: '', description: '', nif: '', rccm: '' });
    const [existingEmployers, setExistingEmployers] = useState<any[]>([]);
    const [loading, setLoading] = useState(false);
    const [pageLoading, setPageLoading] = useState(true);
    const [uploadingLogo, setUploadingLogo] = useState<string | null>(null);

    useEffect(() => {
        loadEmployers();
    }, []);

    const loadEmployers = async () => {
        try {
            setPageLoading(true);
            const data = await employerApi.getMyEmployers(token!);
            setExistingEmployers(data);
        } catch (error) {
            console.error("Failed to load employers", error);
        } finally {
            setPageLoading(false);
        }
    };

    const handleCreate = async () => {
        if (!form.name || !form.category) {
            Alert.alert('Erreur', 'Veuillez remplir le nom et la catégorie.');
            return;
        }
        try {
            setLoading(true);
            await employerApi.create(token!, form);
            Alert.alert('Succès', 'Entreprise créée avec succès');
            setForm({ name: '', category: '', description: '', nif: '', rccm: '' });
            loadEmployers(); // reload list
        } catch (error: any) {
            Alert.alert('Erreur', error.message || 'Impossible de créer l\'entreprise');
        } finally {
            setLoading(false);
        }
    };

    const handleLogoUpload = async (employerId: string) => {
        try {
            const result = await DocumentPicker.getDocumentAsync({
                type: 'image/*',
                copyToCacheDirectory: true,
            });

            if (result.canceled) return;

            const file = result.assets[0];
            setUploadingLogo(employerId);
            
            await employerApi.uploadLogo(token!, {
                uri: file.uri,
                name: file.name,
                type: file.mimeType || 'image/jpeg'
            });

            Alert.alert('Succès', 'Logo mis à jour');
            loadEmployers();
        } catch (error: any) {
            Alert.alert('Erreur', error.message || 'Impossible d\'ajouter le logo');
        } finally {
            setUploadingLogo(null);
        }
    };

    if (pageLoading) {
        return (
            <View style={[styles.container, { justifyContent: 'center', alignItems: 'center' }]}>
                <ActivityIndicator color="#14B53A" size="large" />
            </View>
        );
    }

    return (
        <View style={styles.container}>
            <View style={styles.header}>
                <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backBtn}>
                    <ChevronLeft color="#fff" size={24} />
                </TouchableOpacity>
                <Text style={styles.headerTitle}>Mon Entreprise</Text>
                <View style={{ width: 40 }} />
            </View>

            <ScrollView contentContainerStyle={styles.content}>
                {existingEmployers.length > 0 && (
                    <View style={styles.existingBox}>
                        <Text style={styles.sectionTitle}>Mes structures enregistrées</Text>
                        {existingEmployers.map((emp) => (
                            <View key={emp.id} style={styles.employerCard}>
                                <View style={styles.employerHeader}>
                                    <View>
                                        <Text style={styles.employerName}>{emp.name}</Text>
                                        <Text style={styles.employerCat}>{emp.category}</Text>
                                    </View>
                                    <View style={[styles.statusBadge, emp.isVerified ? styles.statusVerified : styles.statusPending]}>
                                        <Text style={[styles.statusText, emp.isVerified ? styles.statusTextVerified : styles.statusTextPending]}>
                                            {emp.isVerified ? 'Vérifiée' : 'En attente'}
                                        </Text>
                                    </View>
                                </View>
                                
                                <TouchableOpacity 
                                    style={styles.logoUploadBtn} 
                                    onPress={() => handleLogoUpload(emp.id)}
                                    disabled={uploadingLogo === emp.id}
                                >
                                    {uploadingLogo === emp.id ? (
                                        <ActivityIndicator color="#14B53A" size="small" />
                                    ) : (
                                        <>
                                            <UploadCloud size={18} color="#14B53A" />
                                            <Text style={styles.logoBtnText}>
                                                {emp.logoS3Key ? 'Changer le Logo' : 'Ajouter un Logo'}
                                            </Text>
                                        </>
                                    )}
                                </TouchableOpacity>
                            </View>
                        ))}
                        
                        <View style={styles.divider} />
                    </View>
                )}

                <View style={styles.formCard}>
                    <View style={styles.formHeader}>
                        <Building2 color="#14B53A" size={24} />
                        <Text style={styles.formTitle}>Enregistrer une nouvelle structure</Text>
                    </View>

                    <Text style={styles.label}>Nom de l'entreprise *</Text>
                    <TextInput
                        style={styles.input}
                        placeholder="Ex: Orange Mali"
                        placeholderTextColor="#6b7280"
                        value={form.name}
                        onChangeText={(val) => setForm(p => ({ ...p, name: val }))}
                    />

                    <Text style={styles.label}>Type de structure *</Text>
                    <View style={styles.pickerContainer}>
                        <Picker
                            selectedValue={form.category}
                            onValueChange={(val: string) => setForm(p => ({ ...p, category: val }))}
                            dropdownIconColor="#fff"
                            style={{ color: '#fff' }}
                        >
                            <Picker.Item label="Sélectionner..." value="" color="#6b7280" />
                            {CATEGORIES.map(c => <Picker.Item key={c} label={c} value={c} />)}
                        </Picker>
                    </View>

                    <View style={styles.row}>
                        <View style={styles.half}>
                            <Text style={styles.label}>NIF</Text>
                            <TextInput
                                style={styles.input}
                                placeholder="Optionnel"
                                placeholderTextColor="#6b7280"
                                value={form.nif}
                                onChangeText={(val) => setForm(p => ({ ...p, nif: val }))}
                            />
                        </View>
                        <View style={styles.half}>
                            <Text style={styles.label}>RCCM</Text>
                            <TextInput
                                style={styles.input}
                                placeholder="Optionnel"
                                placeholderTextColor="#6b7280"
                                value={form.rccm}
                                onChangeText={(val) => setForm(p => ({ ...p, rccm: val }))}
                            />
                        </View>
                    </View>

                    <Text style={styles.label}>Description (optionnel)</Text>
                    <TextInput
                        style={[styles.input, styles.textArea]}
                        multiline
                        numberOfLines={4}
                        placeholder="Présentez brièvement votre structure..."
                        placeholderTextColor="#6b7280"
                        value={form.description}
                        onChangeText={(val) => setForm(p => ({ ...p, description: val }))}
                    />

                    <TouchableOpacity 
                        style={[styles.submitBtn, loading && styles.submitBtnDisabled]} 
                        onPress={handleCreate}
                        disabled={loading}
                    >
                        {loading ? <ActivityIndicator color="#fff" /> : <Text style={styles.submitBtnText}>Enregistrer l'entreprise</Text>}
                    </TouchableOpacity>
                </View>

                <View style={{ height: 40 }} />
            </ScrollView>
        </View>
    );
}

const styles = StyleSheet.create({
    container: { flex: 1, backgroundColor: '#0a0a0a' },
    header: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingTop: 60, paddingBottom: 20, paddingHorizontal: 20, backgroundColor: '#111', borderBottomWidth: 1, borderBottomColor: '#222' },
    backBtn: { width: 40, height: 40, alignItems: 'center', justifyContent: 'center', backgroundColor: '#222', borderRadius: 20 },
    headerTitle: { color: '#fff', fontSize: 18, fontWeight: 'bold' },
    content: { padding: 20 },
    
    existingBox: { marginBottom: 30 },
    sectionTitle: { fontSize: 18, fontWeight: 'bold', color: '#fff', marginBottom: 15 },
    employerCard: { backgroundColor: '#1f2937', padding: 16, borderRadius: 16, marginBottom: 15, borderWidth: 1, borderColor: '#374151' },
    employerHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 15 },
    employerName: { color: '#fff', fontSize: 18, fontWeight: 'bold', marginBottom: 4 },
    employerCat: { color: '#9ca3af', fontSize: 14 },
    statusBadge: { paddingHorizontal: 10, paddingVertical: 4, borderRadius: 12, borderWidth: 1 },
    statusVerified: { backgroundColor: '#14B53A20', borderColor: '#14B53A50' },
    statusPending: { backgroundColor: '#FCD11620', borderColor: '#FCD11650' },
    statusText: { fontSize: 12, fontWeight: 'bold' },
    statusTextVerified: { color: '#14B53A' },
    statusTextPending: { color: '#FCD116' },
    logoUploadBtn: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8, backgroundColor: '#14B53A15', paddingVertical: 10, borderRadius: 10, borderWidth: 1, borderColor: '#14B53A30' },
    logoBtnText: { color: '#14B53A', fontWeight: '600' },
    divider: { height: 1, backgroundColor: '#333', marginTop: 10 },

    formCard: { backgroundColor: '#111', padding: 20, borderRadius: 20, borderWidth: 1, borderColor: '#222' },
    formHeader: { flexDirection: 'row', alignItems: 'center', gap: 10, marginBottom: 20 },
    formTitle: { color: '#fff', fontSize: 18, fontWeight: 'bold', flex: 1 },
    
    label: { color: '#9ca3af', fontSize: 14, fontWeight: '600', marginBottom: 8, marginTop: 15 },
    input: { backgroundColor: '#1f2937', color: '#fff', padding: 16, borderRadius: 12, fontSize: 15, borderWidth: 1, borderColor: 'transparent' },
    textArea: { minHeight: 100, textAlignVertical: 'top' },
    pickerContainer: { backgroundColor: '#1f2937', borderRadius: 12, overflow: 'hidden' },
    row: { flexDirection: 'row', gap: 15 },
    half: { flex: 1 },
    
    submitBtn: { backgroundColor: '#14B53A', padding: 18, borderRadius: 16, alignItems: 'center', marginTop: 30 },
    submitBtnDisabled: { opacity: 0.7 },
    submitBtnText: { color: '#fff', fontSize: 16, fontWeight: 'bold' }
});
