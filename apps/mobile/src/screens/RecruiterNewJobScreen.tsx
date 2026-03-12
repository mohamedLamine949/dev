import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, ScrollView, TextInput, TouchableOpacity, ActivityIndicator, Alert } from 'react-native';
import { useAuth } from '../context/AuthContext';
import { jobsApi, employerApi } from '../lib/api';
import { Briefcase, MapPin, GraduationCap, ChevronLeft, CalendarDays, CheckCircle2, Building2 } from 'lucide-react-native';
import { useNavigation } from '@react-navigation/native';
import { Picker } from '@react-native-picker/picker';

const SECTORS = ['Agriculture', 'Banque / Finance', 'BTP', 'Commerce', 'Education', 'Energie', 'IT / Télécoms', 'Mines', 'ONG / International', 'Santé', 'Sécurité / Défense', 'Transport / Logistique'];
const JOB_TYPES = [
    { value: 'CDI', label: 'CDI' }, { value: 'CDD', label: 'CDD' }, { value: 'STAGE', label: 'Stage' },
    { value: 'CONCOURS', label: 'Concours de la fonction publique' }, { value: 'VOLONTARIAT', label: 'Volontariat' }, { value: 'APPRENTISSAGE', label: 'Apprentissage' },
];
const REGIONS = ['Bamako', 'Gao', 'Kayes', 'Kidal', 'Koulikoro', 'Mopti', 'Ségou', 'Sikasso', 'Taoudénit', 'Ménaka', 'Tombouctou'];
const EDU_LEVELS = ['Aucun diplôme', 'BEPC', 'BAC', 'BAC+2', 'BAC+3', 'BAC+5', 'Doctorat', 'Formation professionnelle'];
const EXP_LEVELS = [{ value: 'NONE', label: 'Aucune' }, { value: '1_2', label: '1 à 2 ans' }, { value: '3_5', label: '3 à 5 ans' }, { value: 'PLUS_5', label: 'Plus de 5 ans' }];

export default function RecruiterNewJobScreen() {
    const { token } = useAuth();
    const navigation = useNavigation();
    
    const [loading, setLoading] = useState(false);
    const [pageLoading, setPageLoading] = useState(true);
    const [hasEmployer, setHasEmployer] = useState(false);

    const [form, setForm] = useState({
        title: '', type: 'CDI', sector: '', experienceLevel: 'NONE',
        description: '', requirements: '', deadline: '',
        salaryMin: '', salaryMax: '', isDiasporaOpen: false, isRemoteAbroad: false, relocationAid: '',
    });
    const [selectedRegions, setSelectedRegions] = useState<string[]>([]);
    const [selectedEdu, setSelectedEdu] = useState<string[]>([]);

    useEffect(() => {
        const checkEmployer = async () => {
            try {
                const emps = await employerApi.getMyEmployers(token!);
                setHasEmployer(emps.length > 0);
            } catch (err) {
                console.log(err);
            } finally {
                setPageLoading(false);
            }
        };
        checkEmployer();
    }, []);

    const toggleArray = (arr: string[], setArr: React.Dispatch<React.SetStateAction<string[]>>, val: string) => {
        setArr(arr.includes(val) ? arr.filter(x => x !== val) : [...arr, val]);
    };

    const handlePublish = async () => {
        if (!form.title || !form.sector || !form.description || !form.deadline || selectedRegions.length === 0) {
            Alert.alert("Erreur", "Veuillez remplir les champs obligatoires et choisir au moins une région.");
            return;
        }

        try {
            setLoading(true);
            const body = {
                ...form,
                regions: selectedRegions,
                educationLevel: selectedEdu,
                salaryMin: form.salaryMin ? parseInt(form.salaryMin) : undefined,
                salaryMax: form.salaryMax ? parseInt(form.salaryMax) : undefined,
            };
            
            const job = await jobsApi.create(token!, body);
            await jobsApi.publish(token!, job.id);
            
            Alert.alert("Succès", "Offre publiée avec succès !");
            navigation.goBack();
        } catch (error: any) {
            Alert.alert("Erreur", error.message || "Impossible de publier l'offre.");
        } finally {
            setLoading(false);
        }
    };

    if (pageLoading) return <View style={styles.center}><ActivityIndicator color="#14B53A" size="large" /></View>;

    if (!hasEmployer) {
        return (
            <View style={styles.center}>
                <Building2 size={60} color="#6b7280" />
                <Text style={styles.emptyTitle}>Entreprise requise</Text>
                <Text style={styles.emptyDesc}>Vous devez enregistrer votre structure avant de publier une offre.</Text>
                <TouchableOpacity style={styles.btnPrimary} onPress={() => navigation.navigate('RecruiterEmployer' as never)}>
                    <Text style={styles.btnTextPrimary}>Enregistrer mon entreprise</Text>
                </TouchableOpacity>
                <TouchableOpacity style={styles.btnSecondary} onPress={() => navigation.goBack()}>
                    <Text style={styles.btnTextSecondary}>Retour</Text>
                </TouchableOpacity>
            </View>
        );
    }

    return (
        <View style={styles.container}>
            <View style={styles.header}>
                <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backBtn}>
                    <ChevronLeft color="#fff" size={24} />
                </TouchableOpacity>
                <Text style={styles.headerTitle}>Nouvelle Offre</Text>
                <View style={{ width: 40 }} />
            </View>

            <ScrollView contentContainerStyle={styles.content}>
                
                {/* Section 1: Infos */}
                <View style={styles.card}>
                    <View style={styles.cardHeader}>
                        <Briefcase color="#14B53A" size={20} />
                        <Text style={styles.cardTitle}>Informations générales</Text>
                    </View>

                    <Text style={styles.label}>Intitulé du poste *</Text>
                    <TextInput style={styles.input} placeholder="Ex: Développeur Fullstack" placeholderTextColor="#6b7280" value={form.title} onChangeText={t => setForm(p => ({...p, title: t}))} />

                    <View style={styles.row}>
                        <View style={styles.half}>
                            <Text style={styles.label}>Type *</Text>
                            <View style={styles.pickerContainer}>
                                <Picker selectedValue={form.type} onValueChange={(t: string) => setForm(p => ({...p, type: t}))} style={styles.picker}>
                                    {JOB_TYPES.map(t => <Picker.Item key={t.value} label={t.label} value={t.value} />)}
                                </Picker>
                            </View>
                        </View>
                        <View style={styles.half}>
                            <Text style={styles.label}>Secteur *</Text>
                            <View style={styles.pickerContainer}>
                                <Picker selectedValue={form.sector} onValueChange={(s: string) => setForm(p => ({...p, sector: s}))} style={styles.picker}>
                                    <Picker.Item label="Choisir" value="" />
                                    {SECTORS.map(s => <Picker.Item key={s} label={s} value={s} />)}
                                </Picker>
                            </View>
                        </View>
                    </View>

                    <Text style={styles.label}>Régions *</Text>
                    <View style={styles.tagsContainer}>
                        {REGIONS.map(r => (
                            <TouchableOpacity key={r} style={[styles.tag, selectedRegions.includes(r) && styles.tagSelected]} onPress={() => toggleArray(selectedRegions, setSelectedRegions, r)}>
                                <Text style={[styles.tagText, selectedRegions.includes(r) && styles.tagTextSelected]}>{r}</Text>
                            </TouchableOpacity>
                        ))}
                    </View>

                    <View style={styles.row}>
                        <View style={styles.half}>
                            <Text style={styles.label}>Expérience</Text>
                            <View style={styles.pickerContainer}>
                                <Picker selectedValue={form.experienceLevel} onValueChange={(e: string) => setForm(p => ({...p, experienceLevel: e}))} style={styles.picker}>
                                    {EXP_LEVELS.map(e => <Picker.Item key={e.value} label={e.label} value={e.value} />)}
                                </Picker>
                            </View>
                        </View>
                        <View style={styles.half}>
                            <Text style={styles.label}>Date limite *</Text>
                            <TextInput style={styles.input} placeholder="YYYY-MM-DD" placeholderTextColor="#6b7280" value={form.deadline} onChangeText={t => setForm(p => ({...p, deadline: t}))} />
                        </View>
                    </View>
                </View>

                {/* Section 2: Edu */}
                <View style={styles.card}>
                    <View style={styles.cardHeader}>
                        <GraduationCap color="#FCD116" size={20} />
                        <Text style={styles.cardTitle}>Niveau d'études requis</Text>
                    </View>
                    <View style={styles.tagsContainer}>
                        {EDU_LEVELS.map(l => (
                            <TouchableOpacity key={l} style={[styles.tag, selectedEdu.includes(l) && styles.tagSelectedYellow]} onPress={() => toggleArray(selectedEdu, setSelectedEdu, l)}>
                                <Text style={[styles.tagText, selectedEdu.includes(l) && styles.tagTextSelectedYellow]}>{l}</Text>
                            </TouchableOpacity>
                        ))}
                    </View>
                </View>

                {/* Section 3: Content */}
                <View style={styles.card}>
                    <Text style={styles.label}>Description du poste *</Text>
                    <TextInput style={[styles.input, styles.textArea]} multiline numberOfLines={4} placeholder="Missions, contexte..." placeholderTextColor="#6b7280" value={form.description} onChangeText={t => setForm(p => ({...p, description: t}))} />

                    <Text style={styles.label}>Profil recherché</Text>
                    <TextInput style={[styles.input, styles.textArea]} multiline numberOfLines={4} placeholder="Compétences, qualités..." placeholderTextColor="#6b7280" value={form.requirements} onChangeText={t => setForm(p => ({...p, requirements: t}))} />
                </View>

                {/* Submit */}
                <TouchableOpacity style={[styles.submitBtn, loading && styles.submitBtnDisabled]} onPress={handlePublish} disabled={loading}>
                    {loading ? <ActivityIndicator color="#fff" /> : <Text style={styles.submitBtnText}>Publier l'offre</Text>}
                </TouchableOpacity>

                <View style={{ height: 40 }} />
            </ScrollView>
        </View>
    );
}

const styles = StyleSheet.create({
    container: { flex: 1, backgroundColor: '#0a0a0a' },
    center: { flex: 1, backgroundColor: '#0a0a0a', alignItems: 'center', justifyContent: 'center', padding: 20 },
    header: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingTop: 60, paddingBottom: 20, paddingHorizontal: 20, backgroundColor: '#111', borderBottomWidth: 1, borderBottomColor: '#222' },
    backBtn: { width: 40, height: 40, alignItems: 'center', justifyContent: 'center', backgroundColor: '#222', borderRadius: 20 },
    headerTitle: { color: '#fff', fontSize: 18, fontWeight: 'bold' },
    content: { padding: 20 },
    
    emptyTitle: { color: '#fff', fontSize: 22, fontWeight: 'bold', marginTop: 20, marginBottom: 10 },
    emptyDesc: { color: '#9ca3af', textAlign: 'center', marginBottom: 30, fontSize: 15 },
    btnPrimary: { backgroundColor: '#14B53A', padding: 16, borderRadius: 12, width: '100%', alignItems: 'center', marginBottom: 10 },
    btnTextPrimary: { color: '#fff', fontWeight: 'bold', fontSize: 16 },
    btnSecondary: { padding: 16, width: '100%', alignItems: 'center' },
    btnTextSecondary: { color: '#9ca3af', fontWeight: 'bold', fontSize: 16 },

    card: { backgroundColor: '#111', padding: 20, borderRadius: 20, borderWidth: 1, borderColor: '#222', marginBottom: 20 },
    cardHeader: { flexDirection: 'row', alignItems: 'center', gap: 10, marginBottom: 20, borderBottomWidth: 1, borderBottomColor: '#222', paddingBottom: 15 },
    cardTitle: { color: '#fff', fontSize: 16, fontWeight: 'bold' },
    
    label: { color: '#9ca3af', fontSize: 14, fontWeight: '600', marginBottom: 8, marginTop: 15 },
    input: { backgroundColor: '#1f2937', color: '#fff', padding: 16, borderRadius: 12, fontSize: 15 },
    textArea: { minHeight: 100, textAlignVertical: 'top' },
    
    row: { flexDirection: 'row', gap: 15 },
    half: { flex: 1 },
    pickerContainer: { backgroundColor: '#1f2937', borderRadius: 12, overflow: 'hidden' },
    picker: { color: '#fff' },

    tagsContainer: { flexDirection: 'row', flexWrap: 'wrap', gap: 10, marginTop: 5 },
    tag: { backgroundColor: '#1f2937', paddingHorizontal: 14, paddingVertical: 8, borderRadius: 20, borderWidth: 1, borderColor: 'transparent' },
    tagSelected: { backgroundColor: '#14B53A20', borderColor: '#14B53A' },
    tagSelectedYellow: { backgroundColor: '#FCD11620', borderColor: '#FCD116' },
    tagText: { color: '#9ca3af', fontSize: 13, fontWeight: '600' },
    tagTextSelected: { color: '#14B53A' },
    tagTextSelectedYellow: { color: '#FCD116' },

    submitBtn: { backgroundColor: '#14B53A', padding: 18, borderRadius: 16, alignItems: 'center', marginTop: 10 },
    submitBtnDisabled: { opacity: 0.7 },
    submitBtnText: { color: '#fff', fontSize: 16, fontWeight: 'bold' },
});
