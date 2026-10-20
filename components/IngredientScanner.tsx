import React, { useState } from 'react';
import { ScrollView, View, Text, TouchableOpacity, StyleSheet, ActivityIndicator, Image } from 'react-native';
import * as ImagePicker from 'expo-image-picker';
import { FontAwesome } from '@expo/vector-icons';
import { analyzeIngredientsFromImage } from '../services/AiService';

interface IngredientScannerProps {
    showToast: (msg: string, type?: 'success' | 'error' | 'info') => void;
    theme: {
        cardBg: string;
        cardBorder: string;
        textColor: string;
        subtitleColor: string;
        taglineColor: string;
        subCardBg: string;
    };
}

export function IngredientScanner({ showToast, theme }: IngredientScannerProps) {
    const [imageUri, setImageUri] = useState<string | null>(null);
    const [isScanning, setIsScanning] = useState(false);
    const [summary, setSummary] = useState<string | null>(null);

    // Function to clean formatting from raw AI response
    const cleanMarkdownText = (rawText: string) => {
        return rawText
            .replace(/\*\*\*/g, '')
            .replace(/\*\*/g, '')
            .replace(/\*/g, '•')
            .replace(/###/g, '')
            .replace(/##/g, '')
            .trim();
    };

    const processAndAnalyze = async (asset: ImagePicker.ImagePickerAsset) => {
        if (!asset.base64) return;

        const base64String = `data:image/jpeg;base64,${asset.base64}`;
        setImageUri(base64String);
        setIsScanning(true);
        setSummary(null);
        showToast('AI is analyzing ingredients...', 'info');

        try {
            const resultText = await analyzeIngredientsFromImage(asset.base64);
            setSummary(resultText);
            showToast('Analysis complete!', 'success');
        } catch (error) {
            console.error(error);
            showToast('Failed to analyze ingredients.', 'error');
        } finally {
            setIsScanning(false);
        }
    };

    const handleTakePhoto = async () => {
        try {
            const permissionResult = await ImagePicker.requestCameraPermissionsAsync();
            if (!permissionResult.granted) {
                showToast('Camera permission is required!', 'error');
                return;
            }

            const result = await ImagePicker.launchCameraAsync({
                allowsEditing: false,
                quality: 0.7,
                base64: true,
            });

            if (!result.canceled && result.assets[0]) {
                await processAndAnalyze(result.assets[0]);
            }
        } catch (error) {
            console.error(error);
            showToast('Could not access camera.', 'error');
        }
    };

    const handlePickGallery = async () => {
        try {
            const permissionResult = await ImagePicker.requestMediaLibraryPermissionsAsync();
            if (!permissionResult.granted) {
                showToast('Gallery permission is required!', 'error');
                return;
            }

            const result = await ImagePicker.launchImageLibraryAsync({
                mediaTypes: ['images'],
                allowsEditing: false,
                quality: 0.7,
                base64: true,
            });

            if (!result.canceled && result.assets[0]) {
                await processAndAnalyze(result.assets[0]);
            }
        } catch (error) {
            console.error(error);
            showToast('Failed to open photo library.', 'error');
        }
    };

    return (
        <ScrollView contentContainerStyle={styles.scrollContainer} showsVerticalScrollIndicator={false}>
            <View style={[styles.card, { backgroundColor: theme.cardBg, borderColor: theme.cardBorder }]}>
                <View style={styles.headerRow}>
                    <View style={[styles.iconWrapper, { backgroundColor: theme.subCardBg }]}>
                        <FontAwesome name="leaf" size={18} color={theme.taglineColor} />
                    </View>
                    <View>
                        <Text style={[styles.title, { color: theme.textColor }]}>Smart Ingredient Scanner</Text>
                        <Text style={[styles.subtitle, { color: theme.subtitleColor }]}>
                            Scan food labels to summarize additives & allergens
                        </Text>
                    </View>
                </View>

                {/* Action Buttons */}
                <View style={styles.scanActionsRow}>
                    <TouchableOpacity
                        style={[styles.outlineButton, { flex: 1, borderColor: theme.textColor }]}
                        onPress={handleTakePhoto}
                        disabled={isScanning}
                    >
                        {isScanning ? (
                            <ActivityIndicator color={theme.textColor} />
                        ) : (
                            <View style={styles.btnContent}>
                                <FontAwesome name="camera" size={14} color={theme.textColor} />
                                <Text style={[styles.outlineButtonText, { color: theme.textColor }]}>Take Photo</Text>
                            </View>
                        )}
                    </TouchableOpacity>

                    <TouchableOpacity
                        style={[styles.outlineButton, { flex: 1, borderColor: theme.textColor }]}
                        onPress={handlePickGallery}
                        disabled={isScanning}
                    >
                        {isScanning ? (
                            <ActivityIndicator color={theme.textColor} />
                        ) : (
                            <View style={styles.btnContent}>
                                <FontAwesome name="image" size={14} color={theme.textColor} />
                                <Text style={[styles.outlineButtonText, { color: theme.textColor }]}>Upload Photo</Text>
                            </View>
                        )}
                    </TouchableOpacity>
                </View>

                {/* Uploaded Image Preview */}
                {imageUri && (
                    <View style={[styles.previewContainer, { backgroundColor: theme.subCardBg, borderColor: theme.cardBorder }]}>
                        <Image source={{ uri: imageUri }} style={styles.previewImage} />
                        <Text style={[styles.previewText, { color: theme.textColor }]}>Ingredient Label Captured ✓</Text>
                    </View>
                )}

                {/* AI Processing Indicator */}
                {isScanning && (
                    <View style={[styles.loadingBox, { backgroundColor: theme.subCardBg }]}>
                        <ActivityIndicator size="small" color={theme.taglineColor} />
                        <Text style={[styles.loadingText, { color: theme.subtitleColor }]}>
                            Analyzing additives, nutrition & allergens...
                        </Text>
                    </View>
                )}

                {/* Cleaned AI Summary Display */}
                {summary && !isScanning && (
                    <View style={[styles.summaryBox, { backgroundColor: theme.subCardBg, borderColor: theme.cardBorder }]}>
                        <View style={styles.summaryTitleRow}>
                            <FontAwesome name="file-text-o" size={16} color={theme.taglineColor} />
                            <Text style={[styles.summaryTitle, { color: theme.textColor }]}>AI Ingredient Summary</Text>
                        </View>
                        <Text style={[styles.summaryBody, { color: theme.textColor }]}>
                            {cleanMarkdownText(summary)}
                        </Text>
                    </View>
                )}
            </View>
        </ScrollView>
    );
}

const styles = StyleSheet.create({
    scrollContainer: { paddingBottom: 40 },
    card: { padding: 22, borderRadius: 20, borderWidth: 1, gap: 18, shadowColor: '#000', shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.04, shadowRadius: 12, elevation: 3 },
    headerRow: { flexDirection: 'row', alignItems: 'center', gap: 12 },
    iconWrapper: { width: 42, height: 42, borderRadius: 12, justifyContent: 'center', alignItems: 'center' },
    title: { fontSize: 18, fontFamily: 'Roboto_700Bold' },
    subtitle: { fontSize: 12, fontFamily: 'Roboto_400Regular', marginTop: 2 },

    scanActionsRow: { flexDirection: 'row', gap: 10 },
    btnContent: { flexDirection: 'row', alignItems: 'center', gap: 8 },
    outlineButton: { backgroundColor: 'transparent', borderWidth: 1, paddingVertical: 14, paddingHorizontal: 12, borderRadius: 12, justifyContent: 'center', alignItems: 'center' },
    outlineButtonText: { fontFamily: 'Roboto_500Medium', fontSize: 14 },

    previewContainer: { flexDirection: 'row', alignItems: 'center', gap: 12, padding: 10, borderRadius: 12, borderWidth: 1 },
    previewImage: { width: 48, height: 48, borderRadius: 8, borderWidth: 1, borderColor: '#cbd5e1' },
    previewText: { fontSize: 13, fontFamily: 'Roboto_500Medium' },

    loadingBox: { padding: 20, borderRadius: 12, alignItems: 'center', gap: 10 },
    loadingText: { fontSize: 13, fontFamily: 'Roboto_500Medium' },

    summaryBox: { padding: 16, borderRadius: 14, borderWidth: 1, gap: 10 },
    summaryTitleRow: { flexDirection: 'row', alignItems: 'center', gap: 8 },
    summaryTitle: { fontSize: 15, fontFamily: 'Roboto_700Bold' },
    summaryBody: { fontSize: 14, fontFamily: 'Roboto_400Regular', lineHeight: 22 },
});