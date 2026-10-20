import React, { useEffect, useState, useCallback, useMemo } from 'react';
import {
  ScrollView, RefreshControl, View, Text, TouchableOpacity, StyleSheet, ActivityIndicator, Modal, TextInput, Image, Platform, Animated,
} from 'react-native';
import { FontAwesome } from '@expo/vector-icons';
import { getAllItemsSorted, deleteItem, updateItem, initDatabase } from '../services/DatabaseService';

interface DashboardProps {
  refreshKey: number;
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

export function Dashboard({ refreshKey, showToast, theme }: DashboardProps) {
  const [items, setItems] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [filterTab, setFilterTab] = useState<'all' | 'active' | 'warning' | 'expired'>('all');
  const fadeAnim = useState(new Animated.Value(1))[0];
  const [itemToDelete, setItemToDelete] = useState<any | null>(null);
  const [itemToEdit, setItemToEdit] = useState<any | null>(null);
  const [editName, setEditName] = useState('');
  const [editDate, setEditDate] = useState('');
  const [isUpdating, setIsUpdating] = useState(false);
  const [viewingImage, setViewingImage] = useState<string | null>(null);

  const loadItems = async () => {
    try {
      await initDatabase();
      const data = await getAllItemsSorted();
      setItems(data);
    } catch (error) {
      console.error('Failed to load items:', error);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    loadItems();
  }, [refreshKey]);

  const onRefresh = useCallback(() => {
    setRefreshing(true);
    loadItems();
  }, []);

  const handleFilterChange = (tab: 'all' | 'active' | 'warning' | 'expired') => {
    if (tab === filterTab) return;
    Animated.sequence([
      Animated.timing(fadeAnim, { toValue: 0.4, duration: 100, useNativeDriver: true }),
      Animated.timing(fadeAnim, { toValue: 1, duration: 150, useNativeDriver: true }),
    ]).start();
    setFilterTab(tab);
  };

  const confirmDelete = async () => {
    if (!itemToDelete) return;
    try {
      await deleteItem(itemToDelete.id);
      loadItems();
      showToast('Item deleted successfully', 'success');
    } catch (error) {
      console.error('Failed to delete item:', error);
      showToast('Failed to delete item', 'error');
    } finally {
      setItemToDelete(null);
    }
  };

  const openEditModal = (item: any) => {
    setItemToEdit(item);
    setEditName(item.item_name);
    setEditDate(item.expiry_date);
  };

  const handleSaveEdit = async () => {
    if (!editName.trim()) {
      showToast('Product name cannot be empty', 'error');
      return;
    }
    if (!editDate) {
      showToast('Expiry date cannot be empty', 'error');
      return;
    }

    try {
      setIsUpdating(true);
      await updateItem(itemToEdit.id, editName.trim(), editDate);
      loadItems();
      showToast('Item updated successfully', 'success');
      setItemToEdit(null);
    } catch (error) {
      console.error('Failed to update item:', error);
      showToast('Failed to update item', 'error');
    } finally {
      setIsUpdating(false);
    }
  };

  const getStatusBadge = (daysLeft: number) => {
    if (daysLeft < 0) {
      return { type: 'expired', bg: '#fef2f2', border: '#fecdd3', color: '#991b1b', label: `Expired ${Math.abs(daysLeft)}d ago` };
    } else if (daysLeft <= 30) {
      return { type: 'warning', bg: '#fffbeb', border: '#fde68a', color: '#92400e', label: `Expires in ${daysLeft}d` };
    } else {
      return { type: 'active', bg: '#f0fdf4', border: '#bbf7d0', color: '#166534', label: `${daysLeft} days left` };
    }
  };

  const filteredItems = useMemo(() => {
    return items.filter((item) => {
      const matchesSearch = item.item_name.toLowerCase().includes(searchQuery.toLowerCase());
      const status = getStatusBadge(item.days_left);

      if (filterTab === 'active') return matchesSearch && status.type === 'active';
      if (filterTab === 'warning') return matchesSearch && status.type === 'warning';
      if (filterTab === 'expired') return matchesSearch && status.type === 'expired';
      return matchesSearch;
    });
  }, [items, searchQuery, filterTab]);

  if (loading) {
    return (
      <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}>
        <ActivityIndicator size="large" color={theme.textColor} />
      </View>
    );
  }

  return (
    <ScrollView
      contentContainerStyle={{ paddingBottom: 40 }}
      refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={theme.textColor} />}
      showsVerticalScrollIndicator={false}
    >
      <View style={{ gap: 16 }}>
        {/* Header Count */}
        <View style={styles.dashboardHeader}>
          <Text style={[styles.headerTitle, { color: theme.textColor }]}>Inventory Overview</Text>
          <View style={[styles.badgeCount, { backgroundColor: theme.subCardBg, borderColor: theme.cardBorder }]}>
            <Text style={[styles.badgeText, { color: theme.subtitleColor }]}>{items.length} Items</Text>
          </View>
        </View>

        {/* Search Bar */}
        <View style={[styles.searchContainer, { backgroundColor: theme.subCardBg, borderColor: theme.cardBorder }]}>
          <FontAwesome name="search" size={14} color={theme.subtitleColor} style={styles.searchIcon} />
          <TextInput
            style={[styles.searchInput, { color: theme.textColor }]}
            placeholder="Search food or items..."
            placeholderTextColor="#94a3b8"
            value={searchQuery}
            onChangeText={setSearchQuery}
          />
          {searchQuery.length > 0 && (
            <TouchableOpacity onPress={() => setSearchQuery('')}>
              <FontAwesome name="times-circle" size={16} color={theme.subtitleColor} />
            </TouchableOpacity>
          )}
        </View>

        {/* Filter Chips */}
        <View style={styles.filterRow}>
          {(['all', 'active', 'warning', 'expired'] as const).map((tab) => (
            <TouchableOpacity
              key={tab}
              style={[
                styles.filterChip,
                { backgroundColor: theme.cardBg, borderColor: theme.cardBorder },
                filterTab === tab && { backgroundColor: theme.textColor, borderColor: theme.textColor }
              ]}
              onPress={() => handleFilterChange(tab)}
              activeOpacity={0.8}
            >
              <Text style={[
                styles.filterChipText,
                { color: theme.subtitleColor },
                filterTab === tab && { color: theme.cardBg }
              ]}>
                {tab === 'warning' ? 'Expiring Soon' : tab.charAt(0).toUpperCase() + tab.slice(1)}
              </Text>
            </TouchableOpacity>
          ))}
        </View>

        {/* Item Cards Container */}
        <Animated.View style={{ opacity: fadeAnim, gap: 12 }}>
          {filteredItems.length === 0 ? (
            <View style={[styles.emptyCard, { backgroundColor: theme.cardBg, borderColor: theme.cardBorder }]}>
              <FontAwesome name="cube" size={36} color={theme.subtitleColor} style={{ marginBottom: 10 }} />
              <Text style={{ textAlign: 'center', color: theme.subtitleColor, fontSize: 14, fontFamily: 'Roboto_500Medium', lineHeight: 20 }}>
                No matching items found.{'\n'}Try clearing search or changing filters.
              </Text>
            </View>
          ) : (
            filteredItems.map((item) => {
              const status = getStatusBadge(item.days_left);

              return (
                <View key={item.id} style={[styles.itemCard, { backgroundColor: theme.cardBg, borderColor: theme.cardBorder }]}>
                  {/* Thumbnail */}
                  {item.image_uri ? (
                    <TouchableOpacity onPress={() => setViewingImage(item.image_uri)} activeOpacity={0.85} style={styles.thumbnailWrapper}>
                      <Image source={{ uri: item.image_uri }} style={styles.thumbnail} />
                    </TouchableOpacity>
                  ) : (
                    <View style={[styles.placeholderThumbnail, { backgroundColor: theme.subCardBg, borderColor: theme.cardBorder }]}>
                      <FontAwesome name="archive" size={18} color={theme.subtitleColor} />
                    </View>
                  )}

                  {/* Details */}
                  <View style={styles.itemContent}>
                    <Text style={[styles.itemName, { color: theme.textColor }]} numberOfLines={1}>
                      {item.item_name}
                    </Text>
                    <Text style={[styles.itemDate, { color: theme.subtitleColor }]}>Expiry: {item.expiry_date}</Text>

                    <View style={[styles.statusPill, { backgroundColor: status.bg, borderColor: status.border }]}>
                      <Text style={[styles.statusText, { color: status.color }]}>{status.label}</Text>
                    </View>
                  </View>

                  {/* Action Bar */}
                  <View style={[styles.edgeActionBar, { backgroundColor: theme.subCardBg, borderLeftColor: theme.cardBorder }]}>
                    <TouchableOpacity
                      style={styles.edgeBtnEdit}
                      onPress={() => openEditModal(item)}
                      activeOpacity={0.7}
                    >
                      <FontAwesome name="pencil" size={13} color={theme.textColor} />
                    </TouchableOpacity>

                    <View style={[styles.actionDivider, { backgroundColor: theme.cardBorder }]} />

                    <TouchableOpacity
                      style={styles.edgeBtnDelete}
                      onPress={() => setItemToDelete(item)}
                      activeOpacity={0.7}
                    >
                      <FontAwesome name="trash" size={13} color="#dc2626" />
                    </TouchableOpacity>
                  </View>
                </View>
              );
            })
          )}
        </Animated.View>
      </View>

      {/* Delete Confirmation Modal */}
      <Modal visible={!!itemToDelete} transparent animationType="fade">
        <View style={styles.modalOverlay}>
          <View style={[styles.modalContent, { backgroundColor: theme.cardBg, borderColor: theme.cardBorder }]}>
            <View style={styles.deleteIconWrapper}>
              <FontAwesome name="exclamation-triangle" size={20} color="#dc2626" />
            </View>
            <Text style={[styles.modalTitle, { color: theme.textColor }]}>Delete Item?</Text>
            <Text style={[styles.modalBody, { color: theme.subtitleColor }]}>
              Are you sure you want to remove <Text style={{ fontFamily: 'Roboto_700Bold', color: theme.textColor }}>{itemToDelete?.item_name}</Text>? This action cannot be undone.
            </Text>

            <View style={styles.modalButtons}>
              <TouchableOpacity style={[styles.modalBtnCancel, { backgroundColor: theme.subCardBg, borderColor: theme.cardBorder }]} onPress={() => setItemToDelete(null)}>
                <Text style={[styles.modalBtnCancelText, { color: theme.textColor }]}>Cancel</Text>
              </TouchableOpacity>
              <TouchableOpacity style={styles.modalBtnConfirm} onPress={confirmDelete}>
                <Text style={styles.modalBtnConfirmText}>Delete Item</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>

      {/* Edit Modal */}
      <Modal visible={!!itemToEdit} transparent animationType="fade">
        <View style={styles.modalOverlay}>
          <View style={[styles.modalContent, { backgroundColor: theme.cardBg, borderColor: theme.cardBorder }]}>
            <Text style={[styles.modalTitle, { color: theme.textColor }]}>Edit Item Details</Text>

            <View style={{ gap: 12, width: '100%', marginVertical: 14 }}>
              <TextInput
                style={[styles.input, { backgroundColor: theme.subCardBg, borderColor: theme.cardBorder, color: theme.textColor }]}
                placeholder="Product Name"
                placeholderTextColor="#94a3b8"
                value={editName}
                onChangeText={setEditName}
              />

              {Platform.OS === 'web' ? (
                <input
                  type="date"
                  style={{
                    height: 46,
                    borderWidth: '1px',
                    borderStyle: 'solid',
                    borderColor: theme.cardBorder,
                    borderRadius: '10px',
                    paddingLeft: '14px',
                    paddingRight: '14px',
                    fontSize: '15px',
                    backgroundColor: theme.subCardBg,
                    outline: 'none',
                    color: theme.textColor,
                    fontFamily: 'inherit',
                  }}
                  value={editDate}
                  onChange={(e) => setEditDate(e.target.value)}
                />
              ) : (
                <TextInput
                  style={[styles.input, { backgroundColor: theme.subCardBg, borderColor: theme.cardBorder, color: theme.textColor }]}
                  placeholder="YYYY-MM-DD"
                  placeholderTextColor="#94a3b8"
                  value={editDate}
                  onChangeText={setEditDate}
                />
              )}
            </View>

            <View style={styles.modalButtons}>
              <TouchableOpacity style={[styles.modalBtnCancel, { backgroundColor: theme.subCardBg, borderColor: theme.cardBorder }]} onPress={() => setItemToEdit(null)}>
                <Text style={[styles.modalBtnCancelText, { color: theme.textColor }]}>Cancel</Text>
              </TouchableOpacity>
              <TouchableOpacity style={[styles.modalBtnSave, { backgroundColor: theme.textColor }]} onPress={handleSaveEdit} disabled={isUpdating}>
                {isUpdating ? <ActivityIndicator color={theme.cardBg} /> : <Text style={[styles.modalBtnSaveText, { color: theme.cardBg }]}>Save Changes</Text>}
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>

      <Modal visible={!!viewingImage} transparent animationType="fade">
        <TouchableOpacity
          style={styles.fullscreenOverlay}
          activeOpacity={1}
          onPress={() => setViewingImage(null)}
        >
          <View style={styles.closeFullscreen}>
            <FontAwesome name="times" size={16} color="#ffffff" style={{ marginRight: 6 }} />
            <Text style={{ color: '#ffffff', fontSize: 14, fontFamily: 'Roboto_500Medium' }}>Tap anywhere to close</Text>
          </View>
          {viewingImage && (
            <Image
              source={{ uri: viewingImage }}
              style={styles.fullscreenImage}
              resizeMode="contain"
            />
          )}
        </TouchableOpacity>
      </Modal>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  dashboardHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  headerTitle: { fontSize: 18, fontFamily: 'Roboto_700Bold', letterSpacing: -0.2 },
  badgeCount: { paddingHorizontal: 12, paddingVertical: 4, borderRadius: 20, borderWidth: 1 },
  badgeText: { fontSize: 12, fontFamily: 'Roboto_700Bold' },

  searchContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1,
    borderRadius: 12,
    paddingHorizontal: 14,
    height: 46,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.03,
    shadowRadius: 4,
    elevation: 1,
  },
  searchIcon: { marginRight: 10 },
  searchInput: { flex: 1, fontSize: 14, fontFamily: 'Roboto_400Regular', outlineStyle: 'none' } as any,

  filterRow: { flexDirection: 'row', gap: 6, flexWrap: 'wrap' },
  filterChip: { paddingHorizontal: 13, paddingVertical: 7, borderRadius: 20, borderWidth: 1 },
  filterChipText: { fontSize: 12, fontFamily: 'Roboto_600SemiBold' },

  emptyCard: { padding: 36, borderRadius: 20, borderWidth: 1, alignItems: 'center', justifyContent: 'center' },

  itemCard: {
    borderRadius: 18,
    borderWidth: 1,
    flexDirection: 'row',
    alignItems: 'stretch',
    overflow: 'hidden',
    shadowColor: '#0f172a',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.04,
    shadowRadius: 8,
    elevation: 3,
  },
  thumbnailWrapper: {
    justifyContent: 'center',
    paddingLeft: 14,
  },
  thumbnail: { width: 52, height: 52, borderRadius: 12, borderWidth: 1, borderColor: '#cbd5e1' },
  placeholderThumbnail: {
    width: 52,
    height: 52,
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1,
    marginLeft: 14,
    alignSelf: 'center',
  },

  itemContent: {
    flex: 1,
    justifyContent: 'center',
    paddingVertical: 14,
    paddingHorizontal: 12,
    gap: 4,
  },
  itemName: { fontSize: 15, fontFamily: 'Roboto_700Bold', letterSpacing: -0.2 },
  itemDate: { fontSize: 12, fontFamily: 'Roboto_500Medium' },
  statusPill: { alignSelf: 'flex-start', paddingHorizontal: 8, paddingVertical: 3, borderRadius: 8, marginTop: 4, borderWidth: 1 },
  statusText: { fontSize: 11, fontFamily: 'Roboto_700Bold' },

  edgeActionBar: {
    width: 52,
    borderLeftWidth: 1,
    alignItems: 'stretch',
    justifyContent: 'center',
  },
  edgeBtnEdit: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  actionDivider: {
    height: 1,
  },
  edgeBtnDelete: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },

  modalOverlay: { flex: 1, backgroundColor: 'rgba(15, 23, 42, 0.45)', justifyContent: 'center', alignItems: 'center', padding: 20 },
  modalContent: { borderRadius: 20, padding: 24, width: '100%', maxWidth: 380, alignItems: 'center', borderWidth: 1, shadowColor: '#000', shadowOffset: { width: 0, height: 8 }, shadowOpacity: 0.15, shadowRadius: 16, elevation: 8 },
  deleteIconWrapper: { width: 44, height: 44, borderRadius: 22, backgroundColor: '#fef2f2', justifyContent: 'center', alignItems: 'center', marginBottom: 12 },
  modalTitle: { fontSize: 18, fontFamily: 'Roboto_700Bold' },
  modalBody: { fontSize: 14, textAlign: 'center', marginTop: 6, marginBottom: 16, lineHeight: 20, fontFamily: 'Roboto_400Regular' },
  modalButtons: { flexDirection: 'row', gap: 10, width: '100%', justifyContent: 'flex-end' },
  modalBtnCancel: { paddingVertical: 10, paddingHorizontal: 16, borderRadius: 10, borderWidth: 1 },
  modalBtnCancelText: { fontFamily: 'Roboto_700Bold', fontSize: 14 },
  modalBtnConfirm: { paddingVertical: 10, paddingHorizontal: 16, borderRadius: 10, backgroundColor: '#dc2626' },
  modalBtnConfirmText: { color: '#ffffff', fontFamily: 'Roboto_700Bold', fontSize: 14 },
  modalBtnSave: { paddingVertical: 10, paddingHorizontal: 16, borderRadius: 10 },
  modalBtnSaveText: { fontFamily: 'Roboto_700Bold', fontSize: 14 },
  input: { borderWidth: 1, borderRadius: 10, padding: 12, fontSize: 15, width: '100%', outlineStyle: 'none', fontFamily: 'Roboto_400Regular' } as any,
  fullscreenOverlay: { flex: 1, backgroundColor: 'rgba(15, 23, 42, 0.95)', justifyContent: 'center', alignItems: 'center', padding: 20 },
  closeFullscreen: { position: 'absolute', top: 40, right: 24, zIndex: 10, backgroundColor: 'rgba(255,255,255,0.15)', flexDirection: 'row', alignItems: 'center', paddingHorizontal: 16, paddingVertical: 8, borderRadius: 20 },
  fullscreenImage: { width: '100%', height: '80%' },
});