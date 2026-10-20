import React, { useState } from 'react';
import { 
  ScrollView, 
  View, 
  Text, 
  TouchableOpacity, 
  StyleSheet, 
  ActivityIndicator, 
  Image, 
  Modal, 
  Dimensions 
} from 'react-native';
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
  imageUri: string | null;
  setImageUri: (uri: string | null) => void;
  summary: string | null;
  setSummary: (summary: string | null) => void;
}

export function IngredientScanner({
  showToast,
  theme,
  imageUri,
  setImageUri,
  summary,
  setSummary,
}: IngredientScannerProps) {
  const [isScanning, setIsScanning] = useState(false);
  const [isModalVisible, setIsModalVisible] = useState(false);

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
        allowsEditing: true,
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
            <Text style={[styles.title, { color: theme.textColor }]}>AI Ingredient Scanner</Text>
            <Text style={[styles.subtitle, { color: theme.subtitleColor }]}>
              Scan food labels to summarize additives & allergens
            </Text>
          </View>
        </View>

        {/* Action Buttons */}
        <View style={styles.scanActionsRow}>
          <TouchableOpacity
            style={[styles.outlineButton, { flex: 1, borderColor: theme.cardBorder, backgroundColor: theme.cardBg }]}
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
            style={[styles.outlineButton, { flex: 1, borderColor: theme.cardBorder, backgroundColor: theme.cardBg }]}
            onPress={handlePickGallery}
            disabled={isScanning}
          >
            {isScanning ? (
              <ActivityIndicator color={theme.textColor} />
            ) : (
              <View style={styles.btnContent}>
                <FontAwesome name="image" size={14} color={theme.textColor} />
                <Text style={[styles.outlineButtonText, { color: theme.textColor }]}>Gallery</Text>
              </View>
            )}
          </TouchableOpacity>
        </View>

        {/* Uploaded Image Preview */}
        {imageUri && (
          <TouchableOpacity 
            activeOpacity={0.9} 
            onPress={() => setIsModalVisible(true)}
          >
            <View style={[styles.previewContainer, { backgroundColor: theme.subCardBg, borderColor: theme.cardBorder }]}>
              <Image source={{ uri: imageUri }} style={styles.previewImage} />
              <View style={styles.previewTextWrapper}>
                <Text style={[styles.previewText, { color: theme.textColor }]}>Ingredient Label Captured ✓</Text>
                <Text style={styles.previewSubText}>Tap to enlarge</Text>
              </View>
              <FontAwesome name="search-plus" size={16} color={theme.taglineColor} style={styles.searchIcon} />
            </View>
          </TouchableOpacity>
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

      {/* During Image Preview Modal */}
      <Modal
        visible={isModalVisible}
        transparent={true}
        animationType="fade"
        onRequestClose={() => setIsModalVisible(false)}
      >
        <View style={styles.modalContainer}>
          <TouchableOpacity 
            style={styles.closeButton} 
            onPress={() => setIsModalVisible(false)}
          >
            <FontAwesome name="times" size={20} color="#fff" />
          </TouchableOpacity>

          <ScrollView 
            maximumZoomScale={3} 
            minimumZoomScale={1}
            contentContainerStyle={styles.modalScrollContent}
            centerContent={true}
          >
            {imageUri && (
              <Image 
                source={{ uri: imageUri }} 
                style={styles.fullScreenImage} 
                resizeMode="contain" 
              />
            )}
          </ScrollView>
        </View>
      </Modal>
    </ScrollView>
  );
}

const { width, height } = Dimensions.get('window');

const styles = StyleSheet.create({
  scrollContainer: { paddingBottom: 40 },
  card: { padding: 22, borderRadius: 20, borderWidth: 1, gap: 18, shadowColor: '#000', shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.04, shadowRadius: 12, elevation: 3 },
  headerRow: { flexDirection: 'row', alignItems: 'center', gap: 12 },
  iconWrapper: { width: 42, height: 42, borderRadius: 12, justifyContent: 'center', alignItems: 'center' },
  title: { fontSize: 18, fontFamily: 'Roboto_700Bold' },
  subtitle: { fontSize: 12, fontFamily: 'Roboto_400Regular', marginTop: 2 },

  scanActionsRow: { flexDirection: 'row', gap: 10 },
  btnContent: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  outlineButton: { borderWidth: 1, paddingVertical: 14, paddingHorizontal: 12, borderRadius: 10, justifyContent: 'center', alignItems: 'center' },
  outlineButtonText: { fontFamily: 'Roboto_500Medium', fontSize: 14 },

  previewContainer: { flexDirection: 'row', alignItems: 'center', gap: 12, padding: 10, borderRadius: 10, borderWidth: 1 },
  previewImage: { width: 48, height: 48, borderRadius: 8, borderWidth: 1, borderColor: '#cbd5e1' },
  previewTextWrapper: { flex: 1 },
  previewText: { fontSize: 13, fontFamily: 'Roboto_500Medium' },
  previewSubText: { fontSize: 11, color: '#94a3b8', fontFamily: 'Roboto_400Regular', marginTop: 2 },
  searchIcon: { marginRight: 4 },

  loadingBox: { padding: 20, borderRadius: 12, alignItems: 'center', gap: 10 },
  loadingText: { fontSize: 13, fontFamily: 'Roboto_500Medium' },

  summaryBox: { padding: 16, borderRadius: 14, borderWidth: 1, gap: 10 },
  summaryTitleRow: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  summaryTitle: { fontSize: 15, fontFamily: 'Roboto_700Bold' },
  summaryBody: { fontSize: 14, fontFamily: 'Roboto_400Regular', lineHeight: 22 },

  // Modal Styles
  modalContainer: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.95)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  closeButton: {
    position: 'absolute',
    top: 50,
    right: 20,
    zIndex: 10,
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    width: 36,
    height: 36,
    borderRadius: 18,
    justifyContent: 'center',
    alignItems: 'center',
  },
  modalScrollContent: {
    width: width,
    height: height,
    justifyContent: 'center',
    alignItems: 'center',
  },
  fullScreenImage: {
    width: width,
    height: height * 0.8,
  },
});