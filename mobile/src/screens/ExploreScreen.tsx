import React, { useState, useEffect, useCallback, useRef } from 'react';
import {
  View,
  Text,
  TextInput,
  FlatList,
  TouchableOpacity,
  StyleSheet,
  ActivityIndicator,
  Modal,
  ScrollView,
  StatusBar,
  Dimensions,
  Animated,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useNavigation, useRoute, RouteProp } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '../context/ThemeContext';
import {
  fetchExploreBooks,
  fetchGenres,
  fetchLanguages,
  fetchAuthors,
  fetchArtists,
  fetchPublications,
} from '../services/api';
import {
  AudioBook,
  Genre,
  Language,
  Author,
  Artist,
  Publication,
  ExploreFilters,
  HomeStackParamList,
} from '../types';
import { StandardBookCard } from '../components/cards/StandardBookCard';
import { Image } from 'expo-image';
import { DefaultBookCover } from '../components/DefaultBookCover';
import { Analytics } from '../services/analytics';

type NavigationProp = NativeStackNavigationProp<HomeStackParamList>;
type ExploreRouteProp = RouteProp<HomeStackParamList, 'Explore'>;

interface FilterOption {
  id: string;
  name: string;
}

const DEBOUNCE_DELAY = 500;
const PAGE_SIZE = 20;
const { width: SCREEN_WIDTH } = Dimensions.get('window');
const DRAWER_WIDTH = SCREEN_WIDTH * 0.85;

export function ExploreScreen() {
  const navigation = useNavigation<NavigationProp>();
  const route = useRoute<ExploreRouteProp>();
  const { colors, isDark } = useTheme();

  // Check if we can go back (to conditionally show back button)
  const canGoBack = navigation.canGoBack();

  // Get initial filters from route params
  const routeParams = route.params;
  const screenTitle = routeParams?.title || 'Explore';

  // Build initial filters from route params
  const getInitialFilters = (): ExploreFilters => {
    const initial: ExploreFilters = {};
    if (routeParams?.authorId) {
      initial.authorIds = [routeParams.authorId];
    }
    if (routeParams?.artistId) {
      initial.artistIds = [routeParams.artistId];
    }
    if (routeParams?.publisherId) {
      initial.publisherIds = [routeParams.publisherId];
    }
    if (routeParams?.genreId) {
      initial.genreIds = [routeParams.genreId];
    }
    return initial;
  };

  // Data state
  const [books, setBooks] = useState<AudioBook[]>([]);
  const [loading, setLoading] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);
  const [hasMore, setHasMore] = useState(true);
  const [offset, setOffset] = useState(0);

  // View mode state
  const [isGridView, setIsGridView] = useState(true);

  // Filter state (arrays for multi-select)
  const [searchText, setSearchText] = useState('');
  const [filters, setFilters] = useState<ExploreFilters>(getInitialFilters);
  const [tempFilters, setTempFilters] = useState<ExploreFilters>(getInitialFilters);

  // Filter options
  const [genres, setGenres] = useState<Genre[]>([]);
  const [languages, setLanguages] = useState<Language[]>([]);
  const [authors, setAuthors] = useState<Author[]>([]);
  const [artists, setArtists] = useState<Artist[]>([]);
  const [publications, setPublications] = useState<Publication[]>([]);

  // Filter search state
  const [genreSearch, setGenreSearch] = useState('');
  const [writerSearch, setWriterSearch] = useState('');
  const [artistSearch, setArtistSearch] = useState('');
  const [publicationSearch, setPublicationSearch] = useState('');

  // Drawer state
  const [drawerVisible, setDrawerVisible] = useState(false);
  const drawerAnimation = useRef(new Animated.Value(-DRAWER_WIDTH)).current;

  // Debounce ref
  const debounceRef = useRef<NodeJS.Timeout | null>(null);

  // Load filter options on mount
  useEffect(() => {
    const loadFilterOptions = async () => {
      try {
        const [genresData, languagesData, authorsData, artistsData, publicationsData] = await Promise.all([
          fetchGenres().catch(() => []),
          fetchLanguages().catch(() => []),
          fetchAuthors().catch(() => []),
          fetchArtists().catch(() => []),
          fetchPublications().catch(() => []),
        ]);
        // Client-side safety filter: exclude adult genres
        const safeGenres = genresData.filter(g => !g.is_adult);
        setGenres(safeGenres);
        setLanguages(languagesData);
        setAuthors(authorsData);
        setArtists(artistsData);
        setPublications(publicationsData);
      } catch (error) {
        console.error('Failed to load filter options:', error);
      }
    };
    loadFilterOptions();
  }, []);

  // Fetch books with debounce
  const fetchBooks = useCallback(async (currentFilters: ExploreFilters, currentOffset: number, append: boolean = false) => {
    try {
      if (!append) {
        setLoading(true);
      }
      const data = await fetchExploreBooks(currentFilters, PAGE_SIZE, currentOffset);

      if (append) {
        setBooks(prev => [...prev, ...data]);
      } else {
        setBooks(data);
      }

      setHasMore(data.length === PAGE_SIZE);

      // Track search if there's a search query and this is the initial load
      if (!append && currentFilters.search && currentFilters.search.length > 0) {
        Analytics.trackSearch(currentFilters.search, data.length);
      }
    } catch (error) {
      console.error('Failed to fetch books:', error);
    } finally {
      setLoading(false);
      setLoadingMore(false);
    }
  }, []);

  // Debounced search effect
  useEffect(() => {
    if (debounceRef.current) {
      clearTimeout(debounceRef.current);
    }

    debounceRef.current = setTimeout(() => {
      const newFilters = { ...filters, search: searchText || undefined };
      setFilters(newFilters);
      setOffset(0);
      fetchBooks(newFilters, 0);
    }, DEBOUNCE_DELAY);

    return () => {
      if (debounceRef.current) {
        clearTimeout(debounceRef.current);
      }
    };
  }, [searchText]);

  // Initial load - use initial filters from route params
  useEffect(() => {
    const initialFilters = getInitialFilters();
    fetchBooks(initialFilters, 0);
  }, []);

  // Drawer animation
  const openDrawer = () => {
    setTempFilters({ ...filters });
    // Reset filter searches
    setGenreSearch('');
    setWriterSearch('');
    setArtistSearch('');
    setPublicationSearch('');
    setDrawerVisible(true);
    Animated.timing(drawerAnimation, {
      toValue: 0,
      duration: 250,
      useNativeDriver: true,
    }).start();
  };

  const closeDrawer = () => {
    Animated.timing(drawerAnimation, {
      toValue: -DRAWER_WIDTH,
      duration: 250,
      useNativeDriver: true,
    }).start(() => {
      setDrawerVisible(false);
    });
  };

  // Apply filters from drawer
  const applyFilters = () => {
    const newFilters = { ...tempFilters, search: searchText || undefined };
    setFilters(newFilters);
    setOffset(0);
    fetchBooks(newFilters, 0);
    closeDrawer();

    // Track filter applied events
    if (tempFilters.genreIds?.length) {
      Analytics.trackFilterApplied('genre', tempFilters.genreIds.join(','));
    }
    if (tempFilters.languageIds?.length) {
      Analytics.trackFilterApplied('language', tempFilters.languageIds.join(','));
    }
    if (tempFilters.authorIds?.length) {
      Analytics.trackFilterApplied('author', tempFilters.authorIds.join(','));
    }
    if (tempFilters.artistIds?.length) {
      Analytics.trackFilterApplied('artist', tempFilters.artistIds.join(','));
    }
    if (tempFilters.publisherIds?.length) {
      Analytics.trackFilterApplied('publisher', tempFilters.publisherIds.join(','));
    }
  };

  // Clear all filters
  const clearAllFilters = () => {
    setTempFilters({});
  };

  // Load more on scroll
  const handleLoadMore = () => {
    if (!loadingMore && hasMore && !loading) {
      setLoadingMore(true);
      const newOffset = offset + PAGE_SIZE;
      setOffset(newOffset);
      fetchBooks(filters, newOffset, true);
    }
  };

  // Count active filters
  const activeFilterCount = [
    filters.genreIds?.length || 0,
    filters.languageIds?.length || 0,
    filters.authorIds?.length || 0,
    filters.artistIds?.length || 0,
    filters.publisherIds?.length || 0,
  ].reduce((a, b) => a + b, 0);

  const handleBookPress = (book: AudioBook) => {
    navigation.navigate('BookDetails', { book });
  };

  // Filter options by search
  const filterOptions = (options: FilterOption[], search: string): FilterOption[] => {
    if (!search.trim()) return options;
    const searchLower = search.toLowerCase().trim();
    return options.filter(opt => opt.name.toLowerCase().includes(searchLower));
  };

  // Toggle selection in array
  const toggleSelection = (
    currentIds: string[] | undefined,
    id: string
  ): string[] => {
    const current = currentIds || [];
    if (current.includes(id)) {
      return current.filter(i => i !== id);
    }
    return [...current, id];
  };

  // Grid view item
  const renderGridItem = ({ item }: { item: AudioBook }) => (
    <View style={styles.gridItemContainer}>
      <StandardBookCard book={item} onPress={handleBookPress} />
    </View>
  );

  // List view item
  const renderListItem = ({ item }: { item: AudioBook }) => {
    const chapterCount = item.chapters?.filter((c) => c.isPublished).length || 0;
    const hasThumbnail = item.thumbnail && item.thumbnail.length > 0;

    return (
      <TouchableOpacity
        style={[styles.listItem, { backgroundColor: colors.card }]}
        onPress={() => handleBookPress(item)}
        activeOpacity={0.8}
      >
        {hasThumbnail ? (
          <Image
            source={{ uri: item.thumbnail }}
            style={[styles.listThumbnail, { backgroundColor: colors.backgroundSecondary }]}
            contentFit="cover"
          />
        ) : (
          <DefaultBookCover title={item.title} style={styles.listThumbnail} />
        )}
        <View style={styles.listInfo}>
          <Text style={[styles.listTitle, { color: colors.text }]} numberOfLines={2}>
            {item.title}
          </Text>
          <Text style={[styles.listAuthor, { color: colors.textSecondary }]} numberOfLines={1}>
            {item.author}
          </Text>
          <Text style={[styles.listChapters, { color: colors.brand.orange }]}>
            {chapterCount} {chapterCount === 1 ? 'chapter' : 'chapters'}
          </Text>
        </View>
        <Ionicons name="chevron-forward" size={20} color={colors.textSecondary} />
      </TouchableOpacity>
    );
  };

  const renderFooter = () => {
    if (!loadingMore) return null;
    return (
      <View style={styles.footerLoader}>
        <ActivityIndicator size="small" color={colors.brand.orange} />
      </View>
    );
  };

  const renderEmpty = () => {
    if (loading) return null;
    return (
      <View style={styles.emptyContainer}>
        <Ionicons name="library-outline" size={64} color={colors.textSecondary} />
        <Text style={[styles.emptyTitle, { color: colors.text }]}>No Books Found</Text>
        <Text style={[styles.emptyText, { color: colors.textSecondary }]}>
          Try adjusting your search or filters
        </Text>
      </View>
    );
  };

  // Multi-select filter section in drawer with optional search
  const renderFilterSection = (
    title: string,
    options: FilterOption[],
    selectedIds: string[] | undefined,
    onToggle: (id: string) => void,
    onClearSection: () => void,
    searchValue?: string,
    onSearchChange?: (text: string) => void
  ) => {
    const filteredOptions = searchValue !== undefined
      ? filterOptions(options, searchValue)
      : options;
    const selectedCount = selectedIds?.length || 0;

    return (
      <View style={styles.filterSection}>
        <View style={styles.filterSectionHeader}>
          <Text style={[styles.filterSectionTitle, { color: colors.text }]}>
            {title}
            {selectedCount > 0 && (
              <Text style={{ color: colors.brand.orange }}> ({selectedCount})</Text>
            )}
          </Text>
          {selectedCount > 0 && (
            <TouchableOpacity onPress={onClearSection}>
              <Text style={[styles.clearSectionText, { color: colors.brand.orange }]}>Clear</Text>
            </TouchableOpacity>
          )}
        </View>

        {/* Search input for this filter section */}
        {onSearchChange && (
          <View style={[styles.filterSearchBar, { backgroundColor: colors.card, borderColor: colors.border }]}>
            <Ionicons name="search" size={16} color={colors.textSecondary} />
            <TextInput
              style={[styles.filterSearchInput, { color: colors.text }]}
              placeholder={`Search ${title.toLowerCase()}...`}
              placeholderTextColor={colors.textSecondary}
              value={searchValue}
              onChangeText={onSearchChange}
              autoCapitalize="none"
              autoCorrect={false}
            />
            {searchValue && searchValue.length > 0 && (
              <TouchableOpacity onPress={() => onSearchChange('')}>
                <Ionicons name="close-circle" size={16} color={colors.textSecondary} />
              </TouchableOpacity>
            )}
          </View>
        )}

        {/* Options list */}
        {filteredOptions.length === 0 && searchValue && searchValue.length > 0 ? (
          <Text style={[styles.noResultsText, { color: colors.textSecondary }]}>
            No {title.toLowerCase()} found
          </Text>
        ) : (
          filteredOptions.slice(0, 15).map((option) => {
            const isSelected = selectedIds?.includes(option.id) || false;
            return (
              <TouchableOpacity
                key={option.id}
                style={[
                  styles.filterOption,
                  { borderColor: colors.border },
                  isSelected && { borderColor: colors.brand.orange, backgroundColor: colors.brand.orange + '15' },
                ]}
                onPress={() => onToggle(option.id)}
              >
                <View style={[
                  styles.checkbox,
                  { borderColor: isSelected ? colors.brand.orange : colors.textSecondary },
                  isSelected && { backgroundColor: colors.brand.orange },
                ]}>
                  {isSelected && <Ionicons name="checkmark" size={14} color="#fff" />}
                </View>
                <Text
                  style={[
                    styles.filterOptionText,
                    { color: isSelected ? colors.brand.orange : colors.text },
                  ]}
                  numberOfLines={1}
                >
                  {option.name}
                </Text>
              </TouchableOpacity>
            );
          })
        )}

        {/* Show more indicator */}
        {filteredOptions.length > 15 && (
          <Text style={[styles.moreText, { color: colors.textSecondary }]}>
            +{filteredOptions.length - 15} more - use search to find
          </Text>
        )}
      </View>
    );
  };

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]} edges={['top']}>
      <StatusBar
        barStyle={isDark ? 'light-content' : 'dark-content'}
        backgroundColor={colors.background}
      />

      {/* Header */}
      <View style={styles.header}>
        {canGoBack ? (
          <TouchableOpacity
            onPress={() => navigation.goBack()}
            style={[styles.headerButton, { backgroundColor: colors.card }]}
          >
            <Ionicons name="arrow-back" size={24} color={colors.text} />
          </TouchableOpacity>
        ) : (
          <View style={styles.headerSpacer} />
        )}
        <Text style={[styles.headerTitle, { color: colors.text }]} numberOfLines={1}>{screenTitle}</Text>
        <View style={styles.headerSpacer} />
      </View>

      {/* Search Bar */}
      <View style={styles.searchContainer}>
        <View style={[styles.searchBar, { backgroundColor: colors.card }]}>
          <Ionicons name="search" size={20} color={colors.textSecondary} />
          <TextInput
            style={[styles.searchInput, { color: colors.text }]}
            placeholder="Search books by title..."
            placeholderTextColor={colors.textSecondary}
            value={searchText}
            onChangeText={setSearchText}
            autoCapitalize="none"
            autoCorrect={false}
          />
          {searchText.length > 0 && (
            <TouchableOpacity onPress={() => setSearchText('')}>
              <Ionicons name="close-circle" size={20} color={colors.textSecondary} />
            </TouchableOpacity>
          )}
        </View>
      </View>

      {/* Filter & View Toggle Row */}
      <View style={styles.actionRow}>
        <TouchableOpacity
          style={[styles.filterButton, { backgroundColor: colors.card }]}
          onPress={openDrawer}
          activeOpacity={0.7}
        >
          <Ionicons name="options-outline" size={20} color={colors.text} />
          <Text style={[styles.filterButtonText, { color: colors.text }]}>Filters</Text>
          {activeFilterCount > 0 && (
            <View style={[styles.filterBadge, { backgroundColor: colors.brand.orange }]}>
              <Text style={styles.filterBadgeText}>{activeFilterCount}</Text>
            </View>
          )}
        </TouchableOpacity>

        <TouchableOpacity
          style={[styles.viewToggle, { backgroundColor: colors.card }]}
          onPress={() => setIsGridView(!isGridView)}
          activeOpacity={0.7}
        >
          <Ionicons
            name={isGridView ? 'list' : 'grid'}
            size={20}
            color={colors.text}
          />
        </TouchableOpacity>
      </View>

      {/* Books List */}
      {loading ? (
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={colors.brand.orange} />
        </View>
      ) : (
        <FlatList
          data={books}
          keyExtractor={(item) => item.id}
          renderItem={isGridView ? renderGridItem : renderListItem}
          numColumns={isGridView ? 2 : 1}
          key={isGridView ? 'grid' : 'list'}
          columnWrapperStyle={isGridView ? styles.row : undefined}
          contentContainerStyle={styles.listContent}
          onEndReached={handleLoadMore}
          onEndReachedThreshold={0.5}
          ListFooterComponent={renderFooter}
          ListEmptyComponent={renderEmpty}
          showsVerticalScrollIndicator={false}
        />
      )}

      {/* Filter Drawer Modal */}
      <Modal
        visible={drawerVisible}
        transparent={true}
        animationType="none"
        onRequestClose={closeDrawer}
      >
        <View style={styles.drawerOverlay}>
          <TouchableOpacity
            style={styles.drawerBackdrop}
            activeOpacity={1}
            onPress={closeDrawer}
          />
          <Animated.View
            style={[
              styles.drawer,
              { backgroundColor: colors.background, transform: [{ translateX: drawerAnimation }] },
            ]}
          >
            <SafeAreaView style={styles.drawerContent} edges={['top', 'bottom']}>
              {/* Drawer Header */}
              <View style={[styles.drawerHeader, { borderBottomColor: colors.border }]}>
                <Text style={[styles.drawerTitle, { color: colors.text }]}>Filters</Text>
                <TouchableOpacity onPress={closeDrawer}>
                  <Ionicons name="close" size={24} color={colors.text} />
                </TouchableOpacity>
              </View>

              {/* Filter Options */}
              <ScrollView
                style={styles.drawerScroll}
                showsVerticalScrollIndicator={false}
                keyboardShouldPersistTaps="handled"
              >
                {/* Genre - with search, multi-select */}
                {renderFilterSection(
                  'Genre',
                  genres,
                  tempFilters.genreIds,
                  (id) => setTempFilters({ ...tempFilters, genreIds: toggleSelection(tempFilters.genreIds, id) }),
                  () => setTempFilters({ ...tempFilters, genreIds: undefined }),
                  genreSearch,
                  setGenreSearch
                )}

                {/* Language - without search, multi-select */}
                {renderFilterSection(
                  'Language',
                  languages,
                  tempFilters.languageIds,
                  (id) => setTempFilters({ ...tempFilters, languageIds: toggleSelection(tempFilters.languageIds, id) }),
                  () => setTempFilters({ ...tempFilters, languageIds: undefined })
                )}

                {/* Writer - with search, multi-select */}
                {renderFilterSection(
                  'Writer',
                  authors,
                  tempFilters.authorIds,
                  (id) => setTempFilters({ ...tempFilters, authorIds: toggleSelection(tempFilters.authorIds, id) }),
                  () => setTempFilters({ ...tempFilters, authorIds: undefined }),
                  writerSearch,
                  setWriterSearch
                )}

                {/* Artist - with search, multi-select */}
                {renderFilterSection(
                  'Artist',
                  artists,
                  tempFilters.artistIds,
                  (id) => setTempFilters({ ...tempFilters, artistIds: toggleSelection(tempFilters.artistIds, id) }),
                  () => setTempFilters({ ...tempFilters, artistIds: undefined }),
                  artistSearch,
                  setArtistSearch
                )}

                {/* Publication - with search, multi-select */}
                {renderFilterSection(
                  'Publication',
                  publications,
                  tempFilters.publisherIds,
                  (id) => setTempFilters({ ...tempFilters, publisherIds: toggleSelection(tempFilters.publisherIds, id) }),
                  () => setTempFilters({ ...tempFilters, publisherIds: undefined }),
                  publicationSearch,
                  setPublicationSearch
                )}

                {/* Bottom padding */}
                <View style={{ height: 20 }} />
              </ScrollView>

              {/* Drawer Footer */}
              <View style={[styles.drawerFooter, { borderTopColor: colors.border }]}>
                <TouchableOpacity
                  style={[styles.clearButton, { borderColor: colors.border }]}
                  onPress={clearAllFilters}
                >
                  <Text style={[styles.clearButtonText, { color: colors.text }]}>Clear All</Text>
                </TouchableOpacity>
                <TouchableOpacity
                  style={[styles.applyButton, { backgroundColor: colors.brand.orange }]}
                  onPress={applyFilters}
                >
                  <Text style={styles.applyButtonText}>Apply Filters</Text>
                </TouchableOpacity>
              </View>
            </SafeAreaView>
          </Animated.View>
        </View>
      </Modal>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 12,
  },
  headerButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    justifyContent: 'center',
    alignItems: 'center',
  },
  headerTitle: {
    flex: 1,
    fontSize: 24,
    fontWeight: '700',
    textAlign: 'center',
  },
  headerSpacer: {
    width: 40,
  },
  searchContainer: {
    paddingHorizontal: 16,
    marginBottom: 12,
  },
  searchBar: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderRadius: 12,
    gap: 12,
  },
  searchInput: {
    flex: 1,
    fontSize: 16,
  },
  actionRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 16,
    marginBottom: 16,
  },
  filterButton: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 10,
    gap: 8,
  },
  filterButtonText: {
    fontSize: 15,
    fontWeight: '600',
  },
  filterBadge: {
    minWidth: 20,
    height: 20,
    borderRadius: 10,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 6,
  },
  filterBadgeText: {
    color: '#fff',
    fontSize: 12,
    fontWeight: '700',
  },
  viewToggle: {
    width: 44,
    height: 44,
    borderRadius: 10,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  listContent: {
    paddingHorizontal: 16,
    paddingBottom: 100,
  },
  row: {
    justifyContent: 'space-between',
    marginBottom: 16,
  },
  gridItemContainer: {
    width: '48%',
  },
  listItem: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 12,
    borderRadius: 12,
    marginBottom: 12,
  },
  listThumbnail: {
    width: 70,
    height: 70,
    borderRadius: 8,
  },
  listInfo: {
    flex: 1,
    marginLeft: 12,
    marginRight: 8,
  },
  listTitle: {
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 4,
  },
  listAuthor: {
    fontSize: 14,
    marginBottom: 4,
  },
  listChapters: {
    fontSize: 12,
    fontWeight: '500',
  },
  footerLoader: {
    paddingVertical: 20,
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingTop: 60,
  },
  emptyTitle: {
    fontSize: 20,
    fontWeight: '600',
    marginTop: 16,
  },
  emptyText: {
    fontSize: 14,
    marginTop: 8,
  },
  // Drawer styles
  drawerOverlay: {
    flex: 1,
    flexDirection: 'row',
  },
  drawerBackdrop: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.5)',
  },
  drawer: {
    position: 'absolute',
    left: 0,
    top: 0,
    bottom: 0,
    width: DRAWER_WIDTH,
    shadowColor: '#000',
    shadowOffset: { width: 2, height: 0 },
    shadowOpacity: 0.25,
    shadowRadius: 10,
    elevation: 10,
  },
  drawerContent: {
    flex: 1,
  },
  drawerHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 20,
    borderBottomWidth: 1,
  },
  drawerTitle: {
    fontSize: 22,
    fontWeight: '700',
  },
  drawerScroll: {
    flex: 1,
    paddingHorizontal: 20,
  },
  filterSection: {
    marginTop: 20,
  },
  filterSectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  filterSectionTitle: {
    fontSize: 16,
    fontWeight: '700',
  },
  clearSectionText: {
    fontSize: 14,
    fontWeight: '600',
  },
  filterSearchBar: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
    paddingVertical: 10,
    borderRadius: 8,
    borderWidth: 1,
    marginBottom: 10,
    gap: 8,
  },
  filterSearchInput: {
    flex: 1,
    fontSize: 14,
    paddingVertical: 0,
  },
  filterOption: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 12,
    paddingHorizontal: 14,
    borderRadius: 10,
    borderWidth: 1,
    marginBottom: 8,
    gap: 12,
  },
  checkbox: {
    width: 22,
    height: 22,
    borderRadius: 6,
    borderWidth: 2,
    justifyContent: 'center',
    alignItems: 'center',
  },
  filterOptionText: {
    fontSize: 15,
    flex: 1,
  },
  noResultsText: {
    fontSize: 14,
    fontStyle: 'italic',
    paddingVertical: 12,
    textAlign: 'center',
  },
  moreText: {
    fontSize: 12,
    fontStyle: 'italic',
    textAlign: 'center',
    marginTop: 4,
  },
  drawerFooter: {
    flexDirection: 'row',
    padding: 20,
    gap: 12,
    borderTopWidth: 1,
  },
  clearButton: {
    flex: 1,
    paddingVertical: 14,
    borderRadius: 12,
    borderWidth: 1,
    alignItems: 'center',
  },
  clearButtonText: {
    fontSize: 16,
    fontWeight: '600',
  },
  applyButton: {
    flex: 1,
    paddingVertical: 14,
    borderRadius: 12,
    alignItems: 'center',
  },
  applyButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
});
