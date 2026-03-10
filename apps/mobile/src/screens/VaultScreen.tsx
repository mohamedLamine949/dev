import { View, Text, StyleSheet, TouchableOpacity, FlatList, ActivityIndicator, Alert } from 'react-native';
import { useState, useEffect } from 'react';
import * as DocumentPicker from 'expo-document-picker';
import { FolderSearch, Plus, Trash2, FileText, ImageIcon } from 'lucide-react-native';
import { useAuth } from '../context/AuthContext';
import { documentsApi } from '../lib/api';

export default function VaultScreen() {
    const { token } = useAuth();
    const [documents, setDocuments] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const [uploading, setUploading] = useState(false);

    useEffect(() => {
        if (token) {
            loadDocuments();
        }
    }, [token]);

    const loadDocuments = async () => {
        try {
            setLoading(true);
            const data = await documentsApi.list(token as string);
            setDocuments(data);
        } catch (error: any) {
            Alert.alert("Erreur", error.message || "Impossible de charger vos documents.");
        } finally {
            setLoading(false);
        }
    };

    const handleUpload = async () => {
        try {
            const result = await DocumentPicker.getDocumentAsync({
                type: ['application/pdf', 'image/jpeg', 'image/png'],
                copyToCacheDirectory: true,
            });

            if (result.canceled || !result.assets || result.assets.length === 0) return;

            const file = result.assets[0];

            if (file.size && file.size > 10 * 1024 * 1024) {
                Alert.alert("Fichier trop lourd", "La taille maximale est de 10Mo.");
                return;
            }

            setUploading(true);

            // Defaulting category to CV for mobile simplicity, could add a picker later
            await documentsApi.upload(token as string, {
                uri: file.uri,
                name: file.name,
                type: file.mimeType || 'application/pdf'
            }, 'CV');

            await loadDocuments();
            Alert.alert("Succès", "Votre document a bien été ajouté au coffre-fort.");
        } catch (error: any) {
            Alert.alert("Erreur upload", error.message || "Une erreur est survenue.");
        } finally {
            setUploading(false);
        }
    };

    const handleDelete = (id: string) => {
        Alert.alert(
            "Supprimer le document",
            "Êtes-vous sûr de vouloir supprimer ce document définitivement ?",
            [
                { text: "Annuler", style: "cancel" },
                {
                    text: "Supprimer", style: "destructive", onPress: async () => {
                        try {
                            await documentsApi.remove(token as string, id);
                            await loadDocuments();
                        } catch (error: any) {
                            Alert.alert("Erreur", error.message);
                        }
                    }
                }
            ]
        );
    }

    const renderItem = ({ item }: { item: any }) => {
        const isImage = item.mimeType?.includes('image');
        return (
            <View style={styles.card}>
                <View style={styles.cardIcon}>
                    {isImage ? <ImageIcon color="#fff" size={24} /> : <FileText color="#fff" size={24} />}
                </View>
                <View style={styles.cardContent}>
                    <Text style={styles.cardTitle} numberOfLines={1}>{item.name}</Text>
                    <Text style={styles.cardCat}>{item.category} • {(item.size / 1024 / 1024).toFixed(2)} Mo</Text>
                </View>
                <TouchableOpacity style={styles.delBtn} onPress={() => handleDelete(item.id)}>
                    <Trash2 color="#ef4444" size={20} />
                </TouchableOpacity>
            </View>
        );
    };

    return (
        <View style={styles.container}>
            <View style={styles.header}>
                <Text style={styles.title}>Mon Coffre-fort</Text>
                <TouchableOpacity style={styles.uploadBtn} onPress={handleUpload} disabled={uploading}>
                    {uploading ? <ActivityIndicator color="#0a0a0a" size="small" /> : <Plus color="#0a0a0a" size={24} />}
                    <Text style={styles.uploadBtnTxt}>{uploading ? 'Envoi...' : 'Ajouter'}</Text>
                </TouchableOpacity>
            </View>

            {loading ? (
                <View style={styles.center}><ActivityIndicator color="#14B53A" size="large" /></View>
            ) : documents.length === 0 ? (
                <View style={styles.center}>
                    <FolderSearch color="#333" size={64} style={{ marginBottom: 20 }} />
                    <Text style={styles.emptyTitle}>Votre coffre est vide</Text>
                    <Text style={styles.emptySub}>Ajoutez vos CVs et diplômes pour postuler plus vite.</Text>
                </View>
            ) : (
                <FlatList
                    data={documents}
                    keyExtractor={item => item.id}
                    renderItem={renderItem}
                    contentContainerStyle={{ paddingBottom: 40 }}
                />
            )}
        </View>
    );
}

const styles = StyleSheet.create({
    container: { flex: 1, backgroundColor: '#0a0a0a', padding: 20 },
    header: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 25 },
    title: { fontSize: 26, fontWeight: '900', color: '#fff' },
    uploadBtn: { flexDirection: 'row', backgroundColor: '#14B53A', paddingHorizontal: 16, paddingVertical: 10, borderRadius: 12, alignItems: 'center', gap: 6 },
    uploadBtnTxt: { color: '#0a0a0a', fontWeight: 'bold' },
    center: { flex: 1, justifyContent: 'center', alignItems: 'center' },
    emptyTitle: { fontSize: 18, fontWeight: 'bold', color: '#fff', marginBottom: 8 },
    emptySub: { fontSize: 14, color: '#6b7280', textAlign: 'center', paddingHorizontal: 20 },
    card: { backgroundColor: '#111', borderWidth: 1, borderColor: '#333', borderRadius: 16, padding: 16, flexDirection: 'row', alignItems: 'center', marginBottom: 12 },
    cardIcon: { width: 44, height: 44, borderRadius: 12, backgroundColor: '#333', justifyContent: 'center', alignItems: 'center', marginRight: 12 },
    cardContent: { flex: 1 },
    cardTitle: { color: '#fff', fontSize: 16, fontWeight: 'bold', marginBottom: 4 },
    cardCat: { color: '#6b7280', fontSize: 12, fontWeight: '600', textTransform: 'uppercase' },
    delBtn: { padding: 8, backgroundColor: '#ef444420', borderRadius: 10 }
});
