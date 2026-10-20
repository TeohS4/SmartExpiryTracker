import React, { useState } from 'react';
import { ScrollView, View, Text, TextInput, TouchableOpacity, StyleSheet, ActivityIndicator, Image, Platform } from 'react-native';
import * as ImagePicker from 'expo-image-picker';
import DateTimePicker from '@react-native-community/datetimepicker';
import { FontAwesome } from '@expo/vector-icons';
import { extractExpiryDateFromImage } from '../services/AiService';
import { insertItem } from '../services/DatabaseService';

interface ExpiryFormProps {
  onItemAdded: () => void;
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

export function ExpiryForm({ onItemAdded, showToast, theme }: ExpiryFormProps) {
  const [itemName, setItemName] = useState('');
  const [expiryDate, setExpiryDate] = useState('');
  const [imageUri, setImageUri] = useState<string | null>(null);
  const [showPicker, setShowPicker] = useState(false);
  const [dateObject, setDateObject] = useState(new Date());
  const [isScanning, setIsScanning] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const processImageAndScan = async (asset: ImagePicker.ImagePickerAsset) => {
    if (!asset.base64) return;

    const base64String = `data:image/jpeg;base64,${asset.base64}`;
    setImageUri(base64String);
    setIsScanning(true);
    showToast('AI is scanning label...', 'info');

    try {
      const aiResult = await extractExpiryDateFromImage(asset.base64);
      if (aiResult.expiry_date) {
        setExpiryDate(aiResult.expiry_date);
        setDateObject(new Date(aiResult.expiry_date));
        showToast(`Detected expiry: ${aiResult.expiry_date}`, 'success');
      } else {
        showToast('Could not detect date. Please pick manually.', 'error');
      }
    } catch (error) {
      console.error(error);
      showToast('Failed to process image with AI service.', 'error');
    } finally {
      setIsScanning(false);
    }
  };

  // Open Camera
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
        await processImageAndScan(result.assets[0]);
      }
    } catch (error) {
      console.error(error);
      showToast('Could not access camera.', 'error');
    }
  };

  // Open Gallery
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
        await processImageAndScan(result.assets[0]);
      }
    } catch (error) {
      console.error(error);
      showToast('Failed to open photo library.', 'error');
    }
  };

  const onDateChange = (event: any, selectedDate?: Date) => {
    setShowPicker(false);
    if (selectedDate) {
      setDateObject(selectedDate);
      const formatted = selectedDate.toISOString().split('T')[0];
      setExpiryDate(formatted);
    }
  };

  const handleSubmit = async () => {
    if (!itemName.trim()) {
      showToast('Please enter a product name.', 'error');
      return;
    }
    if (!expiryDate) {
      showToast('Please specify or scan an expiry date.', 'error');
      return;
    }

    try {
      setIsSubmitting(true);
      await insertItem(itemName.trim(), expiryDate, imageUri || undefined);
      setItemName('');
      setExpiryDate('');
      setImageUri(null);
      onItemAdded();
    } catch (error) {
      console.error(error);
      showToast('Failed to save item to database.', 'error');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <ScrollView contentContainerStyle={styles.scrollContainer} showsVerticalScrollIndicator={false}>
      <View style={[styles.card, { backgroundColor: theme.cardBg, borderColor: theme.cardBorder }]}>
        <Text style={[styles.title, { color: theme.textColor }]}>New Expiry Item</Text>

        <View style={styles.inputGroup}>
          <Text style={[styles.label, { color: theme.subtitleColor }]}>Product Name</Text>
          <TextInput
            style={[styles.input, { backgroundColor: theme.subCardBg, borderColor: theme.cardBorder, color: theme.textColor }]}
            placeholder="e.g., Organic Whole Milk"
            placeholderTextColor="#94a3b8"
            value={itemName}
            onChangeText={setItemName}
          />
        </View>

        <View style={styles.inputGroup}>
          <Text style={[styles.label, { color: theme.subtitleColor }]}>Expiry Date</Text>
          <View style={styles.row}>
            {Platform.OS === 'web' ? (
              <input
                type="date"
                style={{
                  flex: 1,
                  height: 48,
                  borderWidth: '1px',
                  borderStyle: 'solid',
                  borderColor: theme.cardBorder,
                  borderRadius: '10px',
                  paddingLeft: '14px',
                  paddingRight: '14px',
                  fontSize: '15px',
                  backgroundColor: theme.subCardBg,
                  fontFamily: 'inherit',
                  outline: 'none',
                  color: theme.textColor,
                }}
                value={expiryDate}
                onChange={(e) => setExpiryDate(e.target.value)}
              />
            ) : (
              <View style={[styles.dateDisplay, { backgroundColor: theme.subCardBg, borderColor: theme.cardBorder }]}>
                <Text style={{ color: expiryDate ? theme.textColor : '#94a3b8' }}>
                  {expiryDate || 'YYYY-MM-DD'}
                </Text>
              </View>
            )}

            {Platform.OS !== 'web' && (
              <TouchableOpacity style={[styles.secondaryButton, { backgroundColor: theme.subCardBg, borderColor: theme.cardBorder }]} onPress={() => setShowPicker(true)}>
                <Text style={[styles.secondaryButtonText, { color: theme.textColor }]}>Select</Text>
              </TouchableOpacity>
            )}
          </View>
        </View>

        {Platform.OS !== 'web' && showPicker && (
          <DateTimePicker
            value={dateObject}
            mode="date"
            display="default"
            onChange={onDateChange}
          />
        )}

        {imageUri && (
          <View style={[styles.previewContainer, { backgroundColor: theme.subCardBg, borderColor: theme.cardBorder }]}>
            <Image source={{ uri: imageUri }} style={styles.previewImage} />
            <Text style={[styles.previewText, { color: theme.textColor }]}>Label Attached ✓</Text>
          </View>
        )}

        {/* Dual AI Scan Buttons */}
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
                <Text style={[styles.outlineButtonText, { color: theme.textColor }]}>Camera</Text>
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

        <TouchableOpacity 
          style={[styles.primaryButton, { backgroundColor: theme.textColor }]} 
          onPress={handleSubmit} 
          disabled={isSubmitting}
        >
          {isSubmitting ? (
            <ActivityIndicator color={theme.cardBg} />
          ) : (
            <View style={styles.btnContent}>
              <FontAwesome name="check" size={15} color={theme.cardBg} />
              <Text style={[styles.primaryButtonText, { color: theme.cardBg }]}>Save Item</Text>
            </View>
          )}
        </TouchableOpacity>
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  scrollContainer: { paddingBottom: 40 },
  card: { padding: 22, borderRadius: 20, borderWidth: 1, gap: 16, shadowColor: '#000', shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.04, shadowRadius: 12, elevation: 3 },
  title: { fontSize: 20, fontFamily: 'Roboto_700Bold', marginBottom: 2 },
  inputGroup: { gap: 6 },
  label: { fontSize: 13, fontFamily: 'Roboto_500Medium' },
  input: { borderWidth: 1, borderRadius: 10, padding: 13, fontSize: 15 },
  row: { flexDirection: 'row', gap: 8, alignItems: 'center' },
  dateDisplay: { flex: 1, borderWidth: 1, borderRadius: 10, padding: 13, justifyContent: 'center' },
  secondaryButton: { paddingHorizontal: 16, height: 48, borderRadius: 10, justifyContent: 'center', alignItems: 'center', borderWidth: 1 },
  secondaryButtonText: { fontFamily: 'Roboto_500Medium', fontSize: 14 },

  scanActionsRow: { flexDirection: 'row', gap: 10 },
  btnContent: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  outlineButton: { borderWidth: 1, paddingVertical: 14, paddingHorizontal: 12, borderRadius: 10, justifyContent: 'center', alignItems: 'center' },
  outlineButtonText: { fontFamily: 'Roboto_500Medium', fontSize: 14 },

  primaryButton: { padding: 15, borderRadius: 10, justifyContent: 'center', alignItems: 'center' },
  primaryButtonText: { fontFamily: 'Roboto_500Medium', fontSize: 15 },

  previewContainer: { flexDirection: 'row', alignItems: 'center', gap: 12, padding: 10, borderRadius: 10, borderWidth: 1 },
  previewImage: { width: 44, height: 44, borderRadius: 8, borderWidth: 1, borderColor: '#cbd5e1' },
  previewText: { fontSize: 13, fontFamily: 'Roboto_500Medium' }
});