import React, { useEffect, useMemo, useRef, useState } from 'react';
import {
  Home,
  Shirt,
  Wand2,
  Library,
  Users,
  History,
  UserCircle,
  CreditCard,
  Settings2,
  HelpCircle,
  Info,
  Plus,
  SlidersHorizontal,
  ChevronLeft,
  X,
  Check,
  ArrowRight,
  MonitorPlay,
  Code,
  Globe,
  Users2,
  Box,
  Layers,
  Sparkles,
  Palette,
  Sun,
  Cloud,
  Snowflake,
  Droplets,
  MapPin,
  TrendingUp,
  Upload,
  Search,
  Download,
  Share2,
  RotateCcw,
  Pencil,
  Trash2
} from 'lucide-react';
import { useLocation, useNavigate } from 'react-router';
import { toast } from 'sonner';

// Import images from local assets
import tshirtProduct from '@/assets/8a55393af5b2913bc9b718f78f6d9d7649ea15b6.png';
import modelWithTshirt from '@/assets/04a106332b46fd32e303290a6fcb306e80cb9a91.png';
import outfitComplete from '@/assets/d027e7715d02e5973bda20d895640cb4a33ba4d1.png';
import modelWhiteOutfit from '@/assets/027f9141fc5b4d041b83cbfd34283e0f6c08e067.png';
import { getStoredAuthSession } from '../lib/auth-storage';
import { ApiError, aiApi, aiPackageApi, getErrorMessage, productsApi, uploadApi } from '../lib/api';
import { useAuth } from '../contexts/AuthContext';
import type { AIOutfitHistoryItem, Product } from '../types';

const CLOTHES_IMAGES = [
  tshirtProduct, // Add the ICDN tshirt as first item
  "https://images.unsplash.com/photo-1621198059871-0d5f9b449233?auto=format&fit=crop&q=80&w=150&h=200", // clothing flat lay
  "https://images.unsplash.com/photo-1593030761757-71fae45fa0e7?auto=format&fit=crop&q=80&w=150&h=200", // fashion dress flat lay
  "https://images.unsplash.com/photo-1708523842501-800cd1c7505e?auto=format&fit=crop&q=80&w=150&h=200", // denim jacket isolated
  "https://images.unsplash.com/photo-1527332042004-0b1a4d8646a3?auto=format&fit=crop&q=80&w=150&h=200", // skirt flat lay
  "https://images.unsplash.com/photo-1767605520993-3351a27aae40?auto=format&fit=crop&q=80&w=150&h=200", // t-shirt folded flat
  "https://images.unsplash.com/photo-1765654603344-c0d4dda58f5c?auto=format&fit=crop&q=80&w=150&h=200"  // sweater isolated
];

const MODEL_IMAGES = [
  modelWhiteOutfit, // New model with white outfit
  modelWhiteOutfit, // Repeat new model
  modelWhiteOutfit,
  modelWhiteOutfit,
  modelWhiteOutfit,
  modelWhiteOutfit,
];

const UPLOADED_MODEL_STORAGE_PREFIX = 'outfio-ai-uploaded-models';
const UPLOADED_MODEL_PROFILE_STORAGE_PREFIX = 'outfio-ai-model-profiles';
const UPLOADED_CLOTHING_STORAGE_PREFIX = 'outfio-ai-uploaded-clothing';
const TRY_ON_CREDIT_COST = 1;
const MIX_MATCH_CREDIT_COST = 2;

type ClothingImageType = 'upper' | 'lower' | 'full_set';

interface SavedClothingImage {
  url: string;
  clothType: ClothingImageType;
  name: string;
  color: string;
  tags: string[];
  createdAt: string;
}

interface SavedModelProfile {
  url: string;
  name: string;
  gender: '' | 'men' | 'women' | 'unisex';
  ageGroup: string;
  ethnicity: string;
  skinTone: string;
  hairColor: string;
  tags: string[];
  createdAt: string;
}

type ComboClothingSlot = 'upper' | 'lower';

interface TryOnClothingSelection {
  source: 'shop' | 'uploaded';
  imageUrl: string;
  product?: Product;
}

interface UseAINavigationState {
  returnTo?: string;
  selectedProductId?: string;
}

function getUploadedModelStorageKey() {
  const userId = getStoredAuthSession()?.profile?._id || 'guest';
  return `${UPLOADED_MODEL_STORAGE_PREFIX}:${userId}`;
}

function getUploadedModelProfileStorageKey() {
  const userId = getStoredAuthSession()?.profile?._id || 'guest';
  return `${UPLOADED_MODEL_PROFILE_STORAGE_PREFIX}:${userId}`;
}

function getUploadedClothingStorageKey() {
  const userId = getStoredAuthSession()?.profile?._id || 'guest';
  return `${UPLOADED_CLOTHING_STORAGE_PREFIX}:${userId}`;
}

function getUniqueModelUrls(urls: unknown) {
  if (!Array.isArray(urls)) {
    return [];
  }

  return Array.from(
    new Set(
      urls
        .filter((url): url is string => typeof url === 'string')
        .map((url) => url.trim())
        .filter(Boolean)
    )
  );
}

function loadUploadedModelImages() {
  if (typeof window === 'undefined') {
    return [];
  }

  const storedValue = window.localStorage.getItem(getUploadedModelStorageKey());
  if (!storedValue) {
    return [];
  }

  try {
    return getUniqueModelUrls(JSON.parse(storedValue));
  } catch {
    window.localStorage.removeItem(getUploadedModelStorageKey());
    return [];
  }
}

function saveUploadedModelImages(urls: string[]) {
  if (typeof window === 'undefined') {
    return;
  }

  window.localStorage.setItem(getUploadedModelStorageKey(), JSON.stringify(getUniqueModelUrls(urls)));
}

function createDefaultModelProfile(url: string, index = 0): SavedModelProfile {
  return {
    url,
    name: `Mẫu của tôi ${index + 1}`,
    gender: '',
    ageGroup: '',
    ethnicity: '',
    skinTone: '',
    hairColor: '',
    tags: [],
    createdAt: '',
  };
}

function loadSavedModelProfiles(): SavedModelProfile[] {
  const urls = loadUploadedModelImages();
  if (typeof window === 'undefined') return urls.map(createDefaultModelProfile);

  let storedProfiles: unknown = [];
  const storedValue = window.localStorage.getItem(getUploadedModelProfileStorageKey());
  if (storedValue) {
    try {
      storedProfiles = JSON.parse(storedValue);
    } catch {
      window.localStorage.removeItem(getUploadedModelProfileStorageKey());
    }
  }

  const profileMap = new Map<string, Partial<SavedModelProfile>>();
  if (Array.isArray(storedProfiles)) {
    storedProfiles.forEach((profile) => {
      if (typeof profile === 'object' && profile !== null && typeof (profile as SavedModelProfile).url === 'string') {
        profileMap.set((profile as SavedModelProfile).url, profile as Partial<SavedModelProfile>);
      }
    });
  }

  return urls.map((url, index) => {
    const defaults = createDefaultModelProfile(url, index);
    const stored = profileMap.get(url);
    return {
      ...defaults,
      ...stored,
      url,
      tags: Array.isArray(stored?.tags) ? stored.tags.filter((tag): tag is string => typeof tag === 'string') : [],
    };
  });
}

function saveModelProfiles(profiles: SavedModelProfile[]) {
  if (typeof window === 'undefined') return;
  window.localStorage.setItem(getUploadedModelProfileStorageKey(), JSON.stringify(profiles));
}

function getUniqueClothingImages(items: unknown): SavedClothingImage[] {
  if (!Array.isArray(items)) return [];

  const seenUrls = new Set<string>();
  const normalizedItems: SavedClothingImage[] = [];
  for (const item of items) {
    const url = typeof item === 'string'
      ? item.trim()
      : typeof item === 'object' && item !== null && typeof (item as SavedClothingImage).url === 'string'
        ? (item as SavedClothingImage).url.trim()
        : '';
    if (!url || seenUrls.has(url)) continue;

    const rawType = typeof item === 'object' && item !== null
      ? (item as SavedClothingImage).clothType
      : 'upper';
    const clothType: ClothingImageType = ['upper', 'lower', 'full_set'].includes(rawType)
      ? rawType
      : 'upper';
    const savedItem = typeof item === 'object' && item !== null
      ? item as Partial<SavedClothingImage>
      : null;
    seenUrls.add(url);
    normalizedItems.push({
      url,
      clothType,
      name: typeof savedItem?.name === 'string' && savedItem.name.trim()
        ? savedItem.name.trim()
        : `Trang phục ${normalizedItems.length + 1}`,
      color: typeof savedItem?.color === 'string' ? savedItem.color : '',
      tags: Array.isArray(savedItem?.tags)
        ? savedItem.tags.filter((tag): tag is string => typeof tag === 'string')
        : [],
      createdAt: typeof savedItem?.createdAt === 'string' ? savedItem.createdAt : '',
    });
  }
  return normalizedItems;
}

function loadUploadedClothingImages() {
  if (typeof window === 'undefined') return [];

  const storedValue = window.localStorage.getItem(getUploadedClothingStorageKey());
  if (!storedValue) return [];

  try {
    return getUniqueClothingImages(JSON.parse(storedValue));
  } catch {
    window.localStorage.removeItem(getUploadedClothingStorageKey());
    return [];
  }
}

function saveUploadedClothingImages(items: SavedClothingImage[]) {
  if (typeof window === 'undefined') return;
  window.localStorage.setItem(
    getUploadedClothingStorageKey(),
    JSON.stringify(getUniqueClothingImages(items))
  );
}

const MIX_MATCH_KEYWORDS = [
  'ao',
  'top',
  'shirt',
  'tshirt',
  'tee',
  'blouse',
  'hoodie',
  'sweater',
  'jacket',
  'coat',
  'polo',
  'somi',
  'thun',
  'khoac',
  'quan',
  'bottom',
  'pants',
  'trousers',
  'jean',
  'jeans',
  'short',
  'shorts',
  'skirt',
  'legging',
  'jogger',
];

const TOP_KEYWORDS = [
  'ao',
  'top',
  'shirt',
  'tshirt',
  'tee',
  'blouse',
  'hoodie',
  'sweater',
  'jacket',
  'coat',
  'polo',
  'somi',
  'thun',
  'khoac',
];

const BOTTOM_KEYWORDS = [
  'quan',
  'bottom',
  'pants',
  'trousers',
  'jean',
  'jeans',
  'short',
  'shorts',
  'skirt',
  'chanvay',
  'legging',
  'jogger',
];

const FULL_SET_KEYWORDS = ['vay', 'dam', 'dress', 'jumpsuit', 'set', 'suit'];
const UNSAFE_MENS_TOP_KEYWORDS = [
  'babytee',
  'bralette',
  'bra',
  'bustier',
  'camisole',
  'boxy',
  'cropped',
  'croptop',
  'crop',
  'cutout',
  'halter',
  'strapless',
  'tank',
  'tube',
];

function normalizeSearchText(value = '') {
  return value
    .toString()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/đ/g, 'd')
    .replace(/Đ/g, 'D')
    .toLowerCase();
}

function formatProductPrice(price: number) {
  return new Intl.NumberFormat('vi-VN', {
    style: 'currency',
    currency: 'VND',
  }).format(price);
}

function hasProductTypeKeyword(text: string, keywords: string[]) {
  const compactText = text.replace(/\s+/g, '');
  const words = new Set(text.split(/[^a-z0-9]+/).filter(Boolean));

  return keywords.some((keyword) => {
    if (keyword.length <= 3) {
      return words.has(keyword);
    }

    return words.has(keyword) || compactText.includes(keyword);
  });
}

function getTryOnClothType(product: Product): 'upper' | 'lower' | 'full_set' {
  const categoryText = normalizeSearchText(
    [product.category, product.categorySlug].filter(Boolean).join(' ')
  );
  const fallbackText = normalizeSearchText(product.name);

  if (hasProductTypeKeyword(categoryText, FULL_SET_KEYWORDS)) {
    return 'full_set';
  }

  if (hasProductTypeKeyword(categoryText, BOTTOM_KEYWORDS)) {
    return 'lower';
  }

  if (hasProductTypeKeyword(categoryText, TOP_KEYWORDS)) {
    return 'upper';
  }

  if (hasProductTypeKeyword(fallbackText, FULL_SET_KEYWORDS)) {
    return 'full_set';
  }

  if (hasProductTypeKeyword(fallbackText, BOTTOM_KEYWORDS)) {
    return 'lower';
  }

  return 'upper';
}

function canMixMatchProduct(product: Product) {
  const text = normalizeSearchText(
    [product.name, product.category, product.categorySlug, product.description].filter(Boolean).join(' ')
  );
  const compactText = text.replace(/\s+/g, '');
  const words = new Set(text.split(/[^a-z0-9]+/).filter(Boolean));

  return MIX_MATCH_KEYWORDS.some((keyword) => words.has(keyword) || compactText.includes(keyword));
}

function isMixMatchProductSafeForGender(product: Product, modelGender?: Product["gender"]) {
  if (modelGender !== 'men' && modelGender !== 'unisex') {
    return true;
  }

  if (modelGender === 'men' && product.gender === 'women') {
    return false;
  }

  if (modelGender === 'unisex' && product.gender === 'women') {
    return false;
  }

  if (modelGender === 'unisex' && product.gender && product.gender !== 'unisex') {
    return false;
  }

  if (getTryOnClothType(product) !== 'upper') {
    return true;
  }

  const text = normalizeSearchText(
    [product.name, product.category, product.categorySlug, product.description].filter(Boolean).join(' ')
  );

  return product.gender !== 'women' && !hasProductTypeKeyword(text, UNSAFE_MENS_TOP_KEYWORDS);
}

const CLOTHING_CATEGORIES = [
  { name: 'Áo', icon: Shirt, items: 8 },
  { name: 'Quần', icon: Shirt, items: 12 },
  { name: 'Váy', icon: Shirt, items: 6 },
  { name: 'Phụ kiện', icon: Sparkles, items: 15 }
];

const STYLE_SUGGESTIONS = [
  {
    id: 1,
    name: 'Street Style',
    image: 'https://images.unsplash.com/photo-1515886657613-9f3515b0c78f?auto=format&fit=crop&q=80&w=300&h=400',
    items: ['Áo hoodie', 'Quần jean', 'Sneakers'],
    season: 'Mùa đông',
    occasion: 'Casual'
  },
  {
    id: 2,
    name: 'Office Chic',
    image: 'https://images.unsplash.com/photo-1487222477894-8943e31ef7b2?auto=format&fit=crop&q=80&w=300&h=400',
    items: ['Áo sơ mi', 'Quần tây', 'Giày cao gót'],
    season: 'Mọi mùa',
    occasion: 'Công sở'
  },
  {
    id: 3,
    name: 'Summer Vibes',
    image: 'https://images.unsplash.com/photo-1496747611176-843222e1e57c?auto=format&fit=crop&q=80&w=300&h=400',
    items: ['Váy maxi', 'Sandal', 'Túi cói'],
    season: 'Mùa hè',
    occasion: 'Dạo phố'
  },
  {
    id: 4,
    name: 'Elegant Evening',
    image: 'https://images.unsplash.com/photo-1539008835657-9e8e9680c956?auto=format&fit=crop&q=80&w=300&h=400',
    items: ['Váy dài', 'Clutch', 'Jewelry'],
    season: 'Mọi mùa',
    occasion: 'Dự tiệc'
  }
];

const WEATHER_CONDITIONS = [
  { icon: Sun, label: 'Nắng', temp: '28-32°C' },
  { icon: Cloud, label: 'Nhiều mây', temp: '24-28°C' },
  { icon: Droplets, label: 'Mưa', temp: '22-26°C' },
  { icon: Snowflake, label: 'Lạnh', temp: '15-20°C' }
];

// Reusable components
const NavItem = ({ icon: Icon, label, active = false, badge, onClick }: { icon: React.ElementType, label: string, active?: boolean, badge?: React.ReactNode, onClick?: () => void }) => (
  <button 
    onClick={onClick}
    className={`flex items-center justify-between w-full px-4 py-2.5 rounded-lg text-sm font-medium transition-colors ${
      active ? 'bg-gray-100 text-gray-900' : 'text-gray-600 hover:bg-gray-50 hover:text-gray-900'
    }`}
  >
    <div className="flex items-center gap-3">
      <Icon className={`w-5 h-5 ${active ? 'text-gray-900' : 'text-gray-500'}`} />
      <span>{label}</span>
    </div>
    {badge && <div>{badge}</div>}
  </button>
);

const SectionHeading = ({ title, showTip = true }: { title: string, showTip?: boolean }) => (
  <div className="flex justify-between items-center mb-4">
    <h2 className="text-base font-semibold text-gray-900">{title}</h2>
    {showTip && (
      <button className="flex items-center gap-1.5 text-xs font-medium text-gray-500 hover:text-gray-700">
        <Info className="w-4 h-4" />
        Mẹo
      </button>
    )}
  </div>
);

const SegmentedControl = ({ options, activeIndex, onChange }: { options: string[], activeIndex: number, onChange: (index: number) => void }) => (
  <div className="flex p-1 bg-gray-100/80 rounded-lg mb-4">
    {options.map((option, idx) => (
      <button
        key={option}
        onClick={() => onChange(idx)}
        className={`flex-1 text-sm py-1.5 rounded-md font-medium transition-all ${
          activeIndex === idx ? 'bg-white text-gray-900 shadow-sm' : 'text-gray-600 hover:text-gray-900'
        }`}
      >
        {option}
      </button>
    ))}
  </div>
);

function formatHistoryDate(value?: string) {
  if (!value) {
    return 'Vua tao';
  }

  return new Intl.DateTimeFormat('vi-VN', {
    dateStyle: 'medium',
    timeStyle: 'short',
  }).format(new Date(value));
}

function historyTypeLabel(item: AIOutfitHistoryItem) {
  return item.clothType === 'combo' ? 'Mix and match' : 'AI try on';
}

function getLowerClothingImageUrl(item: AIOutfitHistoryItem) {
  const value = item.rawResponse?.lowerClothingImageUrl;
  return typeof value === 'string' ? value : '';
}

const AIHistoryView = ({
  historyItems,
  isLoading,
  onRefresh,
}: {
  historyItems: AIOutfitHistoryItem[];
  isLoading: boolean;
  onRefresh: () => void;
}) => (
  <div className="flex-1 overflow-y-auto bg-[#F9F9FB] p-4 md:p-6">
    <div className="mx-auto max-w-[1180px]">
      <div className="mb-6 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Lịch sử AI</h1>
          <p className="mt-1 text-sm text-gray-600">Các ảnh AI try on và mix and match đã tạo theo tài khoản hiện tại.</p>
        </div>
        <button
          onClick={onRefresh}
          disabled={isLoading}
          className="inline-flex items-center justify-center gap-2 rounded-lg border border-gray-200 bg-white px-4 py-2 text-sm font-medium text-gray-700 transition-colors hover:bg-gray-50 disabled:cursor-not-allowed disabled:opacity-60"
        >
          <RotateCcw className={`h-4 w-4 ${isLoading ? 'animate-spin' : ''}`} />
          Làm mới
        </button>
      </div>

      {isLoading && (
        <div className="rounded-lg border border-gray-200 bg-white p-8 text-center text-sm text-gray-500">
          Đang tải lịch sử...
        </div>
      )}

      {!isLoading && historyItems.length === 0 && (
        <div className="rounded-lg border border-dashed border-gray-200 bg-white p-10 text-center">
          <History className="mx-auto mb-3 h-8 w-8 text-gray-300" />
          <p className="font-medium text-gray-900">Chưa có ảnh nào trong lịch sử</p>
          <p className="mt-1 text-sm text-gray-500">Sau khi tạo AI try on hoặc mix and match, kết quả sẽ hiển thị ở đây.</p>
        </div>
      )}

      {!isLoading && historyItems.length > 0 && (
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
          {historyItems.map((item) => {
            const lowerClothingImageUrl = getLowerClothingImageUrl(item);

            return (
            <div key={item._id} className="overflow-hidden rounded-lg border border-gray-200 bg-white shadow-sm">
              <div className="relative aspect-[3/4] bg-gray-100">
                <img
                  src={item.resultImageUrl}
                  alt={historyTypeLabel(item)}
                  className="h-full w-full object-cover"
                />
                <div className="absolute left-2 top-2 rounded-md bg-white/90 px-2 py-1 text-[11px] font-semibold text-gray-800 shadow-sm">
                  {historyTypeLabel(item)}
                </div>
                <div className="absolute right-2 top-2 rounded-md bg-white/90 px-2 py-1 text-[11px] font-semibold text-gray-800 shadow-sm">
                  {item.status}
                </div>
              </div>

              <div className="space-y-3 p-3">
                <div>
                  <p className="line-clamp-1 text-sm font-semibold text-gray-900">
                    {item.product?.name || (item.clothType === 'combo' ? 'Outfit mix and match' : 'Thử đồ AI')}
                  </p>
                  <p className="mt-0.5 text-xs text-gray-500">{formatHistoryDate(item.createdAt)}</p>
                </div>

                <div className={`grid gap-2 ${lowerClothingImageUrl ? 'grid-cols-3' : 'grid-cols-2'}`}>
                  <div className="aspect-[3/4] overflow-hidden rounded-md bg-gray-100">
                    <img src={item.modelImageUrl} alt="Model" className="h-full w-full object-cover" />
                  </div>
                  <div className="aspect-[3/4] overflow-hidden rounded-md bg-gray-100">
                    <img src={item.clothingImageUrl} alt="Clothing" className="h-full w-full object-cover" />
                  </div>
                  {lowerClothingImageUrl && (
                    <div className="aspect-[3/4] overflow-hidden rounded-md bg-gray-100">
                      <img src={lowerClothingImageUrl} alt="Lower clothing" className="h-full w-full object-cover" />
                    </div>
                  )}
                </div>

                <a
                  href={item.resultImageUrl}
                  target="_blank"
                  rel="noreferrer"
                  className="flex items-center justify-center gap-2 rounded-lg bg-[#20B29A] px-3 py-2 text-xs font-semibold text-white transition-colors hover:bg-[#1a9682]"
                >
                  <Download className="h-4 w-4" />
                  Mở ảnh kết quả
                </a>
              </div>
            </div>
            );
          })}
        </div>
      )}
    </div>
  </div>
);

const ProductBrowserModal = ({
  open,
  products,
  selectedProductId,
  onClose,
  onSelect,
}: {
  open: boolean;
  products: Product[];
  selectedProductId?: string;
  onClose: () => void;
  onSelect: (product: Product) => void;
}) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [categoryFilter, setCategoryFilter] = useState('all');
  const [genderFilter, setGenderFilter] = useState('all');
  const [sortBy, setSortBy] = useState<'newest' | 'name' | 'price_asc' | 'price_desc'>('newest');

  const categories = useMemo(
    () => Array.from(new Set(products.map((product) => product.category).filter(Boolean))).sort(),
    [products]
  );

  const filteredProducts = useMemo(() => {
    const normalizedQuery = normalizeSearchText(searchQuery.trim());
    const result = products.filter((product) => {
      const searchableText = normalizeSearchText(
        [product.name, product.category, product.brand, product.material, product.description]
          .filter(Boolean)
          .join(' ')
      );
      const matchesSearch = !normalizedQuery || searchableText.includes(normalizedQuery);
      const matchesCategory = categoryFilter === 'all' || product.category === categoryFilter;
      const matchesGender = genderFilter === 'all' || product.gender === genderFilter;
      return matchesSearch && matchesCategory && matchesGender;
    });

    if (sortBy === 'name') {
      return [...result].sort((a, b) => a.name.localeCompare(b.name, 'vi'));
    }
    if (sortBy === 'price_asc') {
      return [...result].sort((a, b) => a.price - b.price);
    }
    if (sortBy === 'price_desc') {
      return [...result].sort((a, b) => b.price - a.price);
    }
    return result;
  }, [categoryFilter, genderFilter, products, searchQuery, sortBy]);

  useEffect(() => {
    if (!open) return;

    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') onClose();
    };
    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    window.addEventListener('keydown', handleKeyDown);

    return () => {
      document.body.style.overflow = previousOverflow;
      window.removeEventListener('keydown', handleKeyDown);
    };
  }, [onClose, open]);

  if (!open) return null;

  return (
    <div
      className="fixed inset-0 z-[100] flex items-center justify-center bg-slate-950/45 p-3 backdrop-blur-sm md:p-6"
      onMouseDown={(event) => {
        if (event.target === event.currentTarget) onClose();
      }}
    >
      <div
        role="dialog"
        aria-modal="true"
        aria-labelledby="product-browser-title"
        className="flex max-h-[90vh] w-full max-w-5xl flex-col overflow-hidden rounded-2xl bg-white shadow-2xl"
      >
        <div className="flex items-start justify-between border-b border-gray-100 px-5 py-4 md:px-6">
          <div>
            <h2 id="product-browser-title" className="text-lg font-bold text-gray-900">
              Tất cả sản phẩm trong shop
            </h2>
            <p className="mt-1 text-xs text-gray-500">
              Tìm kiếm và chọn sản phẩm bạn muốn thử với AI.
            </p>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="rounded-lg p-2 text-gray-400 transition-colors hover:bg-gray-100 hover:text-gray-700"
            aria-label="Đóng danh sách sản phẩm"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        <div className="grid gap-2 border-b border-gray-100 bg-gray-50/70 p-4 md:grid-cols-[minmax(240px,1fr)_180px_140px_150px] md:px-6">
          <label className="relative block">
            <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
            <input
              autoFocus
              value={searchQuery}
              onChange={(event) => setSearchQuery(event.target.value)}
              placeholder="Tìm theo tên, thương hiệu, chất liệu..."
              className="h-10 w-full rounded-lg border border-gray-200 bg-white pl-9 pr-3 text-sm outline-none transition focus:border-[#20B29A] focus:ring-2 focus:ring-[#20B29A]/15"
            />
          </label>
          <select
            value={categoryFilter}
            onChange={(event) => setCategoryFilter(event.target.value)}
            className="h-10 rounded-lg border border-gray-200 bg-white px-3 text-sm text-gray-700 outline-none focus:border-[#20B29A]"
            aria-label="Lọc theo danh mục"
          >
            <option value="all">Mọi danh mục</option>
            {categories.map((category) => (
              <option key={category} value={category}>{category}</option>
            ))}
          </select>
          <select
            value={genderFilter}
            onChange={(event) => setGenderFilter(event.target.value)}
            className="h-10 rounded-lg border border-gray-200 bg-white px-3 text-sm text-gray-700 outline-none focus:border-[#20B29A]"
            aria-label="Lọc theo giới tính"
          >
            <option value="all">Mọi giới tính</option>
            <option value="men">Nam</option>
            <option value="women">Nữ</option>
            <option value="unisex">Unisex</option>
            <option value="kids">Trẻ em</option>
          </select>
          <select
            value={sortBy}
            onChange={(event) => setSortBy(event.target.value as typeof sortBy)}
            className="h-10 rounded-lg border border-gray-200 bg-white px-3 text-sm text-gray-700 outline-none focus:border-[#20B29A]"
            aria-label="Sắp xếp sản phẩm"
          >
            <option value="newest">Mới nhất</option>
            <option value="name">Tên A–Z</option>
            <option value="price_asc">Giá thấp đến cao</option>
            <option value="price_desc">Giá cao đến thấp</option>
          </select>
        </div>

        <div className="min-h-0 flex-1 overflow-y-auto p-4 md:p-6">
          <div className="mb-4 flex items-center justify-between text-xs text-gray-500">
            <span>Tìm thấy {filteredProducts.length} sản phẩm</span>
            {(searchQuery || categoryFilter !== 'all' || genderFilter !== 'all') && (
              <button
                type="button"
                onClick={() => {
                  setSearchQuery('');
                  setCategoryFilter('all');
                  setGenderFilter('all');
                }}
                className="font-semibold text-[#168f7c] hover:underline"
              >
                Xóa bộ lọc
              </button>
            )}
          </div>

          {filteredProducts.length === 0 ? (
            <div className="rounded-xl border border-dashed border-gray-200 py-14 text-center">
              <Search className="mx-auto mb-3 h-7 w-7 text-gray-300" />
              <p className="font-medium text-gray-700">Không tìm thấy sản phẩm phù hợp</p>
              <p className="mt-1 text-xs text-gray-500">Hãy thử từ khóa hoặc bộ lọc khác.</p>
            </div>
          ) : (
            <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5">
              {filteredProducts.map((product) => {
                const productId = product.productId || product._id || product.id;
                const selected = selectedProductId === productId;
                return (
                  <button
                    type="button"
                    key={productId}
                    onClick={() => onSelect(product)}
                    className={`group overflow-hidden rounded-xl border bg-white text-left transition-all hover:-translate-y-0.5 hover:shadow-md ${
                      selected ? 'border-[#20B29A] ring-2 ring-[#20B29A]/20' : 'border-gray-200'
                    }`}
                  >
                    <div className="relative aspect-[3/4] overflow-hidden bg-gray-100">
                      <img
                        src={product.image}
                        alt={product.name}
                        className="h-full w-full object-cover transition-transform duration-300 group-hover:scale-105"
                      />
                      {selected && (
                        <span className="absolute right-2 top-2 rounded-full bg-[#20B29A] p-1 text-white shadow">
                          <Check className="h-3.5 w-3.5" />
                        </span>
                      )}
                    </div>
                    <div className="p-2.5">
                      <p className="line-clamp-2 min-h-9 text-xs font-semibold text-gray-900">{product.name}</p>
                      <p className="mt-1 truncate text-[11px] text-gray-500">{product.category || 'Sản phẩm'}</p>
                      <p className="mt-1 text-xs font-bold text-[#168f7c]">{formatProductPrice(product.price)}</p>
                    </div>
                  </button>
                );
              })}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

const AssetLibraryView = ({
  kind,
  items,
  isUploading,
  onUpload,
  onEdit,
  onDelete,
  onTryOn,
}: {
  kind: 'clothing' | 'model';
  items: Array<SavedClothingImage | SavedModelProfile>;
  isUploading: boolean;
  onUpload: (event: React.ChangeEvent<HTMLInputElement>) => void;
  onEdit: (item: SavedClothingImage | SavedModelProfile) => void;
  onDelete: (item: SavedClothingImage | SavedModelProfile) => void;
  onTryOn: (item: SavedClothingImage | SavedModelProfile) => void;
}) => {
  const isClothing = kind === 'clothing';

  return (
    <div className="min-h-0 flex-1 overflow-y-auto bg-[#F9F9FB] p-4 md:p-6">
      <div className="mx-auto max-w-[1180px]">
        <div className="mb-6 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">
              {isClothing ? 'Tủ đồ của tôi' : 'Mẫu của tôi'}
            </h1>
            <p className="mt-1 text-sm text-gray-600">
              {isClothing
                ? 'Quản lý ảnh trang phục riêng dùng cho AI thử đồ.'
                : 'Quản lý ảnh người mẫu, thông tin và thẻ phân loại.'}
            </p>
          </div>
          <label className={`inline-flex cursor-pointer items-center justify-center gap-2 rounded-xl bg-[#20B29A] px-4 py-2.5 text-sm font-semibold text-white shadow-sm transition-colors hover:bg-[#1a9682] ${isUploading ? 'pointer-events-none opacity-70' : ''}`}>
            {isUploading ? (
              <span className="h-4 w-4 animate-spin rounded-full border-2 border-white border-t-transparent" />
            ) : (
              <Plus className="h-4 w-4" />
            )}
            {isUploading ? 'Đang tải lên...' : isClothing ? 'Thêm quần áo' : 'Thêm mẫu'}
            <input type="file" accept="image/*" className="hidden" disabled={isUploading} onChange={onUpload} />
          </label>
        </div>

        {items.length === 0 ? (
          <div className="rounded-2xl border border-dashed border-gray-200 bg-white px-6 py-16 text-center">
            {isClothing ? (
              <Library className="mx-auto mb-3 h-9 w-9 text-gray-300" />
            ) : (
              <Users className="mx-auto mb-3 h-9 w-9 text-gray-300" />
            )}
            <p className="font-semibold text-gray-900">
              {isClothing ? 'Tủ đồ đang trống' : 'Bạn chưa lưu mẫu nào'}
            </p>
            <p className="mt-1 text-sm text-gray-500">Nhấn nút thêm để tải ảnh đầu tiên lên Cloudinary.</p>
          </div>
        ) : (
          <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5">
            {items.map((item) => {
              const clothingItem = isClothing ? item as SavedClothingImage : null;
              const modelItem = !isClothing ? item as SavedModelProfile : null;
              const subtitle = clothingItem
                ? clothingItem.clothType === 'lower' ? 'Phần dưới' : clothingItem.clothType === 'full_set' ? 'Bộ liền' : 'Phần trên'
                : modelItem?.gender === 'men' ? 'Nam' : modelItem?.gender === 'women' ? 'Nữ' : modelItem?.gender === 'unisex' ? 'Unisex' : 'Chưa phân loại';

              return (
                <article key={item.url} className="group overflow-hidden rounded-2xl border border-gray-200 bg-white shadow-sm transition-all hover:-translate-y-0.5 hover:shadow-md">
                  <div className="relative aspect-[3/4] overflow-hidden bg-gray-100">
                    <img src={item.url} alt={item.name} className="h-full w-full object-cover transition-transform duration-300 group-hover:scale-105" />
                    <div className="absolute right-2 top-2 flex gap-1 opacity-0 transition-opacity group-hover:opacity-100 focus-within:opacity-100">
                      <button
                        type="button"
                        onClick={() => onEdit(item)}
                        className="rounded-lg bg-white/95 p-2 text-gray-600 shadow hover:text-[#168f7c]"
                        aria-label={`Chỉnh sửa ${item.name}`}
                      >
                        <Pencil className="h-4 w-4" />
                      </button>
                      <button
                        type="button"
                        onClick={() => onDelete(item)}
                        className="rounded-lg bg-white/95 p-2 text-gray-600 shadow hover:text-red-600"
                        aria-label={`Xóa ${item.name}`}
                      >
                        <Trash2 className="h-4 w-4" />
                      </button>
                    </div>
                  </div>
                  <div className="p-3">
                    <h3 className="truncate text-sm font-semibold text-gray-900">{item.name}</h3>
                    <p className="mt-0.5 text-xs text-gray-500">{subtitle}</p>
                    {item.tags.length > 0 && (
                      <div className="mt-2 flex flex-wrap gap-1">
                        {item.tags.slice(0, 3).map((tag) => (
                          <span key={tag} className="rounded-full bg-gray-100 px-2 py-0.5 text-[10px] text-gray-600">#{tag}</span>
                        ))}
                      </div>
                    )}
                    <div className="mt-3 grid grid-cols-2 gap-2">
                      <button
                        type="button"
                        onClick={() => onEdit(item)}
                        className="rounded-lg border border-gray-200 px-2 py-2 text-xs font-semibold text-gray-700 hover:bg-gray-50"
                      >
                        Chỉnh sửa
                      </button>
                      <button
                        type="button"
                        onClick={() => onTryOn(item)}
                        className="rounded-lg bg-[#20B29A] px-2 py-2 text-xs font-semibold text-white hover:bg-[#1a9682]"
                      >
                        Thử đồ
                      </button>
                    </div>
                  </div>
                </article>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
};

const AssetEditorModal = ({
  kind,
  item,
  onClose,
  onSave,
  onTryOn,
}: {
  kind: 'clothing' | 'model';
  item: SavedClothingImage | SavedModelProfile | null;
  onClose: () => void;
  onSave: (item: SavedClothingImage | SavedModelProfile) => void;
  onTryOn: (item: SavedClothingImage | SavedModelProfile) => void;
}) => {
  const [name, setName] = useState('');
  const [clothType, setClothType] = useState<ClothingImageType>('upper');
  const [color, setColor] = useState('');
  const [gender, setGender] = useState<SavedModelProfile['gender']>('');
  const [ageGroup, setAgeGroup] = useState('');
  const [ethnicity, setEthnicity] = useState('');
  const [skinTone, setSkinTone] = useState('');
  const [hairColor, setHairColor] = useState('');
  const [tagsText, setTagsText] = useState('');

  useEffect(() => {
    if (!item) return;
    setName(item.name);
    setTagsText(item.tags.join(', '));
    if (kind === 'clothing') {
      const clothing = item as SavedClothingImage;
      setClothType(clothing.clothType);
      setColor(clothing.color);
    } else {
      const model = item as SavedModelProfile;
      setGender(model.gender);
      setAgeGroup(model.ageGroup);
      setEthnicity(model.ethnicity);
      setSkinTone(model.skinTone);
      setHairColor(model.hairColor);
    }
  }, [item, kind]);

  if (!item) return null;

  const getUpdatedItem = () => {
    const tags = tagsText.split(',').map((tag) => tag.trim()).filter(Boolean);
    if (kind === 'clothing') {
      return { ...(item as SavedClothingImage), name: name.trim(), clothType, color: color.trim(), tags };
    }
    return {
      ...(item as SavedModelProfile),
      name: name.trim(),
      gender,
      ageGroup,
      ethnicity,
      skinTone,
      hairColor,
      tags,
    };
  };

  const save = (tryOn = false) => {
    if (!name.trim()) {
      toast.error('Vui lòng nhập tên');
      return;
    }
    const updatedItem = getUpdatedItem();
    onSave(updatedItem);
    if (tryOn) onTryOn(updatedItem);
  };

  return (
    <div className="fixed inset-0 z-[120] flex items-center justify-center overflow-y-auto bg-slate-950/55 p-3 backdrop-blur-sm md:p-6">
      <div role="dialog" aria-modal="true" className="w-full max-w-4xl overflow-hidden rounded-2xl bg-white shadow-2xl">
        <div className="flex items-center justify-between border-b border-gray-100 px-5 py-4 md:px-6">
          <h2 className="text-xl font-bold text-gray-900">Chỉnh sửa {kind === 'clothing' ? 'quần áo' : 'mẫu'}</h2>
          <button type="button" onClick={onClose} className="rounded-lg p-2 text-gray-400 hover:bg-gray-100 hover:text-gray-700" aria-label="Đóng">
            <X className="h-5 w-5" />
          </button>
        </div>

        <div className="grid max-h-[72vh] overflow-y-auto md:grid-cols-[360px_1fr]">
          <div className="border-b border-gray-100 bg-gray-50 p-5 md:border-b-0 md:border-r md:p-6">
            <div className="mx-auto aspect-[3/4] max-h-[480px] overflow-hidden rounded-xl border border-gray-200 bg-white">
              <img src={item.url} alt={name || 'Ảnh chỉnh sửa'} className="h-full w-full object-contain" />
            </div>
          </div>

          <div className="space-y-4 p-5 md:p-6">
            <label className="block">
              <span className="mb-1.5 block text-sm font-medium text-gray-700">Tên <span className="text-red-500">*</span></span>
              <input value={name} onChange={(event) => setName(event.target.value)} className="h-10 w-full rounded-lg border border-gray-200 px-3 text-sm outline-none focus:border-[#20B29A] focus:ring-2 focus:ring-[#20B29A]/15" />
            </label>

            {kind === 'clothing' ? (
              <div className="grid gap-4 sm:grid-cols-2">
                <label className="block">
                  <span className="mb-1.5 block text-sm font-medium text-gray-700">Loại trang phục</span>
                  <select value={clothType} onChange={(event) => setClothType(event.target.value as ClothingImageType)} className="h-10 w-full rounded-lg border border-gray-200 bg-white px-3 text-sm">
                    <option value="upper">Áo / phần trên</option>
                    <option value="lower">Quần / phần dưới</option>
                    <option value="full_set">Váy / bộ liền</option>
                  </select>
                </label>
                <label className="block">
                  <span className="mb-1.5 block text-sm font-medium text-gray-700">Màu sắc</span>
                  <input value={color} onChange={(event) => setColor(event.target.value)} placeholder="Ví dụ: Đen, trắng..." className="h-10 w-full rounded-lg border border-gray-200 px-3 text-sm outline-none focus:border-[#20B29A]" />
                </label>
              </div>
            ) : (
              <div className="grid gap-4 sm:grid-cols-2">
                <label className="block"><span className="mb-1.5 block text-sm font-medium text-gray-700">Giới tính</span><select value={gender} onChange={(event) => setGender(event.target.value as SavedModelProfile['gender'])} className="h-10 w-full rounded-lg border border-gray-200 bg-white px-3 text-sm"><option value="">Chưa chọn</option><option value="men">Nam</option><option value="women">Nữ</option><option value="unisex">Khác / Unisex</option></select></label>
                <label className="block"><span className="mb-1.5 block text-sm font-medium text-gray-700">Nhóm tuổi</span><select value={ageGroup} onChange={(event) => setAgeGroup(event.target.value)} className="h-10 w-full rounded-lg border border-gray-200 bg-white px-3 text-sm"><option value="">Chưa chọn</option><option value="teen">Thiếu niên</option><option value="young-adult">18–30</option><option value="adult">31–50</option><option value="senior">Trên 50</option></select></label>
                <label className="block"><span className="mb-1.5 block text-sm font-medium text-gray-700">Ngoại hình dân tộc</span><input value={ethnicity} onChange={(event) => setEthnicity(event.target.value)} className="h-10 w-full rounded-lg border border-gray-200 px-3 text-sm outline-none focus:border-[#20B29A]" /></label>
                <label className="block"><span className="mb-1.5 block text-sm font-medium text-gray-700">Tông da</span><input value={skinTone} onChange={(event) => setSkinTone(event.target.value)} className="h-10 w-full rounded-lg border border-gray-200 px-3 text-sm outline-none focus:border-[#20B29A]" /></label>
                <label className="block sm:col-span-2"><span className="mb-1.5 block text-sm font-medium text-gray-700">Màu tóc</span><input value={hairColor} onChange={(event) => setHairColor(event.target.value)} className="h-10 w-full rounded-lg border border-gray-200 px-3 text-sm outline-none focus:border-[#20B29A]" /></label>
              </div>
            )}

            <label className="block">
              <span className="mb-1.5 block text-sm font-medium text-gray-700">Thẻ</span>
              <input value={tagsText} onChange={(event) => setTagsText(event.target.value)} placeholder="casual, mùa hè, yêu thích..." className="h-10 w-full rounded-lg border border-gray-200 px-3 text-sm outline-none focus:border-[#20B29A]" />
              <span className="mt-1 block text-[11px] text-gray-500">Ngăn cách các thẻ bằng dấu phẩy.</span>
            </label>
          </div>
        </div>

        <div className="flex justify-end gap-2 border-t border-gray-100 bg-white px-5 py-4 md:px-6">
          <button type="button" onClick={onClose} className="rounded-lg bg-gray-100 px-5 py-2.5 text-sm font-semibold text-gray-700 hover:bg-gray-200">Hủy</button>
          <button type="button" onClick={() => save(true)} className="rounded-lg bg-gray-100 px-5 py-2.5 text-sm font-semibold text-gray-700 hover:bg-gray-200">Thử đồ</button>
          <button type="button" onClick={() => save(false)} className="rounded-lg bg-[#20B29A] px-5 py-2.5 text-sm font-semibold text-white hover:bg-[#1a9682]">Xong</button>
        </div>
      </div>
    </div>
  );
};

export function UseAIPage() {
  const navigate = useNavigate();
  const location = useLocation();
  const { isAuthenticated } = useAuth();
  const navigationState = (location.state || null) as UseAINavigationState | null;
  const [activeResource, setActiveResource] = useState<'create' | 'wardrobe' | 'models' | 'history'>('create');
  const [mainMode, setMainMode] = useState(0); // 0: Thử đồ AI, 1: Phối đồ với AI
  const [clothesTab, setClothesTab] = useState(0);
  const [modelTab, setModelTab] = useState(0);
  const [highQuality, setHighQuality] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [isPlanModalOpen, setIsPlanModalOpen] = useState(false);
  const [selectedWeather, setSelectedWeather] = useState(0);
  const [selectedOccasion, setSelectedOccasion] = useState('');
  const [isGenerating, setIsGenerating] = useState(false);
  const [generatedResult, setGeneratedResult] = useState<string | null>(null);
  const [selectedClothing, setSelectedClothing] = useState<number | null>(null);
  const [activeComboSlot, setActiveComboSlot] = useState<ComboClothingSlot>('upper');
  const [comboUpperSelection, setComboUpperSelection] = useState<TryOnClothingSelection | null>(null);
  const [comboLowerSelection, setComboLowerSelection] = useState<TryOnClothingSelection | null>(null);
  const [clothingLibraryTab, setClothingLibraryTab] = useState(0);
  const [uploadedClothingImages, setUploadedClothingImages] = useState<SavedClothingImage[]>(
    () => loadUploadedClothingImages()
  );
  const [customClothingImageUrl, setCustomClothingImageUrl] = useState<string | null>(null);
  const [customClothingType, setCustomClothingType] = useState<ClothingImageType>('upper');
  const [isUploadingClothing, setIsUploadingClothing] = useState(false);
  const [isDraggingClothingImage, setIsDraggingClothingImage] = useState(false);
  const [selectedModel, setSelectedModel] = useState<number | null>(null);
  
  // State for "Phối đồ với AI" mode
  const [stylingClothing, setStylingClothing] = useState<number | null>(null);
  const [stylingModel, setStylingModel] = useState<number | null>(null);
  const [stylingModelGender, setStylingModelGender] = useState<Product["gender"]>("men");
  const [isGeneratingStyling, setIsGeneratingStyling] = useState(false);
  const [stylingResult, setStylingResult] = useState<string | null>(null);
  const [stylingOutfit, setStylingOutfit] = useState<{ top?: Product; bottom?: Product } | null>(null);
  const [products, setProducts] = useState<Product[]>([]);
  const [isLoadingProducts, setIsLoadingProducts] = useState(true);
  const [uploadedModelImages, setUploadedModelImages] = useState<string[]>(() => loadUploadedModelImages());
  const [savedModelProfiles, setSavedModelProfiles] = useState<SavedModelProfile[]>(() => loadSavedModelProfiles());
  const [isUploadingModel, setIsUploadingModel] = useState(false);
  const [brokenImageUrls, setBrokenImageUrls] = useState<Set<string>>(() => new Set());
  const [historyItems, setHistoryItems] = useState<AIOutfitHistoryItem[]>([]);
  const [isLoadingHistory, setIsLoadingHistory] = useState(false);
  const [creditBalance, setCreditBalance] = useState<number | null>(null);
  const [isLoadingCredits, setIsLoadingCredits] = useState(false);
  const [isProductBrowserOpen, setIsProductBrowserOpen] = useState(false);
  const [isDraggingModelImage, setIsDraggingModelImage] = useState(false);
  const [editingClothing, setEditingClothing] = useState<SavedClothingImage | null>(null);
  const [editingModel, setEditingModel] = useState<SavedModelProfile | null>(null);
  const generationLockRef = useRef(false);
  const initialProductSelectionAppliedRef = useRef(false);

  const navigateFromSidebar = (path: string) => {
    setMobileMenuOpen(false);
    navigate(path);
  };

  const openCreateMode = (mode: 0 | 1) => {
    setActiveResource('create');
    setMainMode(mode);
    setMobileMenuOpen(false);
  };

  const openHistory = () => {
    setActiveResource('history');
    setMobileMenuOpen(false);
  };

  const openLibrary = (resource: 'wardrobe' | 'models') => {
    setActiveResource(resource);
    setMobileMenuOpen(false);
  };

  useEffect(() => {
    let cancelled = false;

    const loadProducts = async () => {
      setIsLoadingProducts(true);
      try {
        const firstPage = await productsApi.getAll({
          page: 1,
          limit: 100,
          sort: 'newest',
          inStock: true,
        });
        const remainingPages = firstPage.pagination.totalPages > 1
          ? await Promise.all(
              Array.from({ length: firstPage.pagination.totalPages - 1 }, (_, index) =>
                productsApi.getAll({
                  page: index + 2,
                  limit: 100,
                  sort: 'newest',
                  inStock: true,
                })
              )
            )
          : [];
        const allProducts = [
          ...firstPage.products,
          ...remainingPages.flatMap((page) => page.products),
        ];

        if (!cancelled) {
          setProducts(allProducts);
        }
      } catch (error) {
        if (!cancelled) {
          setProducts([]);
          toast.error('Không thể tải sản phẩm', { description: getErrorMessage(error) });
        }
      } finally {
        if (!cancelled) {
          setIsLoadingProducts(false);
        }
      }
    };

    void loadProducts();

    return () => {
      cancelled = true;
    };
  }, []);

  useEffect(() => {
    let cancelled = false;

    if (!isAuthenticated) {
      setCreditBalance(null);
      setIsLoadingCredits(false);
      return;
    }

    const loadCreditBalance = async () => {
      setIsLoadingCredits(true);
      try {
        const response = await aiPackageApi.getMyBalance();
        if (!cancelled) setCreditBalance(response.balance);
      } catch {
        if (!cancelled) setCreditBalance(null);
      } finally {
        if (!cancelled) setIsLoadingCredits(false);
      }
    };

    void loadCreditBalance();

    return () => {
      cancelled = true;
    };
  }, [isAuthenticated]);

  const loadHistory = async () => {
    setIsLoadingHistory(true);
    try {
      const response = await aiApi.getMyTryOns();
      setHistoryItems(response.recommendations);
    } catch (error) {
      setHistoryItems([]);
      alert(getErrorMessage(error));
    } finally {
      setIsLoadingHistory(false);
    }
  };

  useEffect(() => {
    if (activeResource === 'history') {
      void loadHistory();
    }
  }, [activeResource]);

  const productChoices = useMemo(
    () => products.filter((product) => Boolean(product.image) && !brokenImageUrls.has(product.image)),
    [brokenImageUrls, products]
  );

  const availableShopClothingChoices = useMemo(
    () => clothesTab === 0
      ? productChoices
      : productChoices.filter((product) => getTryOnClothType(product) === activeComboSlot),
    [activeComboSlot, clothesTab, productChoices]
  );

  const availableUploadedClothingChoices = useMemo(
    () => clothesTab === 0
      ? uploadedClothingImages
      : uploadedClothingImages.filter((item) => item.clothType === activeComboSlot),
    [activeComboSlot, clothesTab, uploadedClothingImages]
  );

  const stylingProductChoices = useMemo(
    () => productChoices.filter((product) =>
      canMixMatchProduct(product) && isMixMatchProductSafeForGender(product, stylingModelGender)
    ),
    [productChoices, stylingModelGender]
  );

  const modelChoices = useMemo(
    () => [...uploadedModelImages, ...MODEL_IMAGES],
    [uploadedModelImages]
  );

  const tryOnModelChoices = useMemo(
    () => (modelTab === 1 ? uploadedModelImages : MODEL_IMAGES),
    [modelTab, uploadedModelImages]
  );

  const getModelChoiceIndex = (displayIndex: number) => (
    modelTab === 1 ? displayIndex : uploadedModelImages.length + displayIndex
  );

  useEffect(() => {
    if (stylingClothing !== null && stylingClothing >= stylingProductChoices.length) {
      setStylingClothing(null);
    }
  }, [stylingClothing, stylingProductChoices.length]);

  useEffect(() => {
    if (selectedClothing !== null && selectedClothing >= productChoices.length) {
      setSelectedClothing(null);
    }
  }, [productChoices.length, selectedClothing]);

  useEffect(() => {
    if (initialProductSelectionAppliedRef.current || isLoadingProducts) return;

    const requestedProductId = navigationState?.selectedProductId;
    if (requestedProductId) {
      const productIndex = productChoices.findIndex((product) =>
        [product.productId, product._id, product.id, product.slug].includes(requestedProductId)
      );
      if (productIndex >= 0) {
        setSelectedClothing(productIndex);
        setClothingLibraryTab(0);
      }
    }

    initialProductSelectionAppliedRef.current = true;
  }, [isLoadingProducts, navigationState?.selectedProductId, productChoices]);

  const selectedTryOnProduct = selectedClothing === null ? null : productChoices[selectedClothing];
  const selectedTryOnProductId = selectedTryOnProduct?.productId || selectedTryOnProduct?._id || selectedTryOnProduct?.id;
  const activeComboSelection = activeComboSlot === 'upper' ? comboUpperSelection : comboLowerSelection;
  const selectedShopClothingId = clothesTab === 0
    ? selectedTryOnProductId
    : activeComboSelection?.product?.productId || activeComboSelection?.product?._id || activeComboSelection?.product?.id;
  const selectedUploadedClothingUrl = clothesTab === 0
    ? customClothingImageUrl
    : activeComboSelection?.source === 'uploaded'
      ? activeComboSelection.imageUrl
      : null;

  const handleBackToProduct = () => {
    if (navigationState?.returnTo?.startsWith('/product/')) {
      navigate(navigationState.returnTo);
      return;
    }

    const selectedProductRouteId = selectedTryOnProduct?._id || selectedTryOnProduct?.slug || selectedTryOnProduct?.id;
    if (selectedProductRouteId) {
      navigate(`/product/${selectedProductRouteId}`);
      return;
    }

    if (window.history.length > 1) {
      navigate(-1);
    } else {
      navigate('/');
    }
  };

  const selectTryOnProduct = (product: Product) => {
    if (clothesTab === 1) {
      const selection: TryOnClothingSelection = {
        source: 'shop',
        imageUrl: product.image,
        product,
      };
      if (activeComboSlot === 'upper') {
        setComboUpperSelection(selection);
        setActiveComboSlot('lower');
      } else {
        setComboLowerSelection(selection);
      }
      setClothingLibraryTab(0);
      setIsProductBrowserOpen(false);
      return;
    }

    const productIndex = productChoices.findIndex((item) =>
      (item.productId || item._id || item.id) === (product.productId || product._id || product.id)
    );
    if (productIndex >= 0) {
      setSelectedClothing(productIndex);
      setCustomClothingImageUrl(null);
      setClothingLibraryTab(0);
      setIsProductBrowserOpen(false);
    }
  };

  const uploadModelImage = async (
    file: File,
    target: 'try-on' | 'styling',
    openEditor = false,
    selectAfterUpload = true
  ) => {
    if (!file.type.startsWith('image/')) {
      toast.error('Tệp không hợp lệ', { description: 'Vui lòng chọn một tệp hình ảnh.' });
      return;
    }

    setIsUploadingModel(true);
    try {
      const response = await uploadApi.uploadImage(file);
      const newProfile: SavedModelProfile = {
        ...createDefaultModelProfile(response.url, savedModelProfiles.length),
        createdAt: new Date().toISOString(),
      };
      setUploadedModelImages((prev) => {
        const next = getUniqueModelUrls([response.url, ...prev]);
        saveUploadedModelImages(next);
        return next;
      });
      setSavedModelProfiles((previousProfiles) => {
        const nextProfiles = [newProfile, ...previousProfiles.filter((profile) => profile.url !== response.url)];
        saveModelProfiles(nextProfiles);
        return nextProfiles;
      });
      if (openEditor) setEditingModel(newProfile);

      if (selectAfterUpload) {
        if (target === 'try-on') {
          setModelTab(1);
          setSelectedModel(0);
        } else {
          setStylingModel(0);
        }
      }
    } catch (error) {
      alert(getErrorMessage(error));
    } finally {
      setIsUploadingModel(false);
    }
  };

  const handleUploadModelImage = (
    event: React.ChangeEvent<HTMLInputElement>,
    target: 'try-on' | 'styling'
  ) => {
    const file = event.target.files?.[0];
    event.target.value = '';
    if (file) void uploadModelImage(file, target);
  };

  const handleDropModelImage = (
    event: React.DragEvent<HTMLLabelElement>,
    target: 'try-on' | 'styling'
  ) => {
    event.preventDefault();
    setIsDraggingModelImage(false);
    const file = event.dataTransfer.files?.[0];
    if (file) void uploadModelImage(file, target);
  };

  const uploadClothingImage = async (file: File, openEditor = false, selectAfterUpload = true) => {
    if (!file.type.startsWith('image/')) {
      toast.error('Tệp không hợp lệ', { description: 'Vui lòng chọn một tệp hình ảnh quần áo.' });
      return;
    }

    setIsUploadingClothing(true);
    try {
      const response = await uploadApi.uploadImage(file);
      const uploadedClothingType = selectAfterUpload && clothesTab === 1 ? activeComboSlot : customClothingType;
      const uploadedItem: SavedClothingImage = {
        url: response.url,
        clothType: uploadedClothingType,
        name: `Trang phục ${uploadedClothingImages.length + 1}`,
        color: '',
        tags: [],
        createdAt: new Date().toISOString(),
      };
      setUploadedClothingImages((previousItems) => {
        const nextItems = getUniqueClothingImages([uploadedItem, ...previousItems]);
        saveUploadedClothingImages(nextItems);
        return nextItems;
      });
      if (selectAfterUpload && clothesTab === 1) {
        const selection: TryOnClothingSelection = {
          source: 'uploaded',
          imageUrl: response.url,
        };
        if (activeComboSlot === 'upper') {
          setComboUpperSelection(selection);
          setActiveComboSlot('lower');
        } else {
          setComboLowerSelection(selection);
        }
      } else if (selectAfterUpload) {
        setCustomClothingImageUrl(response.url);
        setCustomClothingType(uploadedClothingType);
        setSelectedClothing(null);
      }
      if (selectAfterUpload) setClothingLibraryTab(1);
      if (openEditor) setEditingClothing(uploadedItem);
      toast.success('Đã tải ảnh quần áo lên', {
        description: 'Ảnh quần áo riêng đã được chọn để thử với AI.',
      });
    } catch (error) {
      toast.error('Không thể tải ảnh quần áo', { description: getErrorMessage(error) });
    } finally {
      setIsUploadingClothing(false);
    }
  };

  const handleUploadClothingImage = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    event.target.value = '';
    if (file) void uploadClothingImage(file);
  };

  const handleDropClothingImage = (event: React.DragEvent<HTMLLabelElement>) => {
    event.preventDefault();
    setIsDraggingClothingImage(false);
    const file = event.dataTransfer.files?.[0];
    if (file) void uploadClothingImage(file);
  };

  const selectUploadedClothing = (item: SavedClothingImage) => {
    if (clothesTab === 1) {
      const selection: TryOnClothingSelection = {
        source: 'uploaded',
        imageUrl: item.url,
      };
      if (activeComboSlot === 'upper') {
        setComboUpperSelection(selection);
        setActiveComboSlot('lower');
      } else {
        setComboLowerSelection(selection);
      }
      setClothingLibraryTab(1);
      return;
    }

    setCustomClothingImageUrl(item.url);
    setCustomClothingType(item.clothType);
    setSelectedClothing(null);
    setClothingLibraryTab(1);
  };

  const updateCustomClothingType = (clothType: ClothingImageType) => {
    setCustomClothingType(clothType);
    if (!customClothingImageUrl) return;

    setUploadedClothingImages((previousItems) => {
      const nextItems = previousItems.map((item) =>
        item.url === customClothingImageUrl ? { ...item, clothType } : item
      );
      saveUploadedClothingImages(nextItems);
      return nextItems;
    });
  };

  const removeUploadedClothing = (url: string) => {
    setUploadedClothingImages((previousItems) => {
      const nextItems = previousItems.filter((item) => item.url !== url);
      saveUploadedClothingImages(nextItems);
      return nextItems;
    });
    if (customClothingImageUrl === url) setCustomClothingImageUrl(null);
    if (comboUpperSelection?.source === 'uploaded' && comboUpperSelection.imageUrl === url) {
      setComboUpperSelection(null);
    }
    if (comboLowerSelection?.source === 'uploaded' && comboLowerSelection.imageUrl === url) {
      setComboLowerSelection(null);
    }
  };

  const handleWardrobeUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    event.target.value = '';
    if (file) void uploadClothingImage(file, true, false);
  };

  const handleModelLibraryUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    event.target.value = '';
    if (file) void uploadModelImage(file, 'try-on', true, false);
  };

  const saveClothingDetails = (updatedItem: SavedClothingImage) => {
    setUploadedClothingImages((previousItems) => {
      const nextItems = previousItems.map((item) => item.url === updatedItem.url ? updatedItem : item);
      saveUploadedClothingImages(nextItems);
      return nextItems;
    });
    if (customClothingImageUrl === updatedItem.url) setCustomClothingType(updatedItem.clothType);
    setEditingClothing(null);
    toast.success('Đã cập nhật quần áo');
  };

  const saveModelDetails = (updatedItem: SavedModelProfile) => {
    setSavedModelProfiles((previousProfiles) => {
      const nextProfiles = previousProfiles.map((profile) => profile.url === updatedItem.url ? updatedItem : profile);
      saveModelProfiles(nextProfiles);
      return nextProfiles;
    });
    setEditingModel(null);
    toast.success('Đã cập nhật mẫu');
  };

  const useClothingFromLibrary = (item: SavedClothingImage) => {
    setClothesTab(0);
    setClothingLibraryTab(1);
    setCustomClothingImageUrl(item.url);
    setCustomClothingType(item.clothType);
    setSelectedClothing(null);
    setEditingClothing(null);
    setMainMode(0);
    setActiveResource('create');
  };

  const useModelFromLibrary = (item: SavedModelProfile) => {
    const modelIndex = uploadedModelImages.indexOf(item.url);
    if (modelIndex < 0) return;
    setModelTab(1);
    setSelectedModel(modelIndex);
    setEditingModel(null);
    setMainMode(0);
    setActiveResource('create');
  };

  const deleteClothingFromLibrary = (item: SavedClothingImage) => {
    if (!window.confirm(`Xóa "${item.name}" khỏi tủ đồ?`)) return;
    removeUploadedClothing(item.url);
    if (editingClothing?.url === item.url) setEditingClothing(null);
    toast.success('Đã xóa khỏi tủ đồ');
  };

  const deleteModelFromLibrary = (item: SavedModelProfile) => {
    if (!window.confirm(`Xóa "${item.name}" khỏi danh sách mẫu?`)) return;
    setUploadedModelImages((previousUrls) => {
      const nextUrls = previousUrls.filter((url) => url !== item.url);
      saveUploadedModelImages(nextUrls);
      return nextUrls;
    });
    setSavedModelProfiles((previousProfiles) => {
      const nextProfiles = previousProfiles.filter((profile) => profile.url !== item.url);
      saveModelProfiles(nextProfiles);
      return nextProfiles;
    });
    setSelectedModel(null);
    setStylingModel(null);
    if (editingModel?.url === item.url) setEditingModel(null);
    toast.success('Đã xóa mẫu');
  };

  const markBrokenImage = (url?: string) => {
    if (!url) {
      return;
    }

    setBrokenImageUrls((prev) => {
      const next = new Set(prev);
      next.add(url);
      return next;
    });
  };

  const ensureAvailableCredits = async (requiredCredits: number) => {
    if (!isAuthenticated) {
      toast.info('Đăng nhập để sử dụng AI', {
        description: 'Bạn cần đăng nhập để kiểm tra và sử dụng số dư AI credit.',
      });
      navigate('/login', { state: { from: '/use-ai' } });
      return false;
    }

    try {
      const response = await aiPackageApi.getMyBalance();
      setCreditBalance(response.balance);

      if (response.balance < requiredCredits) {
        toast.error('Không đủ AI credit', {
          description: `Tính năng này cần ${requiredCredits} credit, trong khi tài khoản của bạn còn ${response.balance}.`,
          duration: 8000,
          action: {
            label: 'Mua credit',
            onClick: () => navigate('/ai-packages'),
          },
        });
        return false;
      }

      return true;
    } catch (error) {
      toast.error('Không thể kiểm tra số dư', {
        description: getErrorMessage(error),
      });
      return false;
    }
  };

  const consumeCredits = async (credits: number) => {
    try {
      const response = await aiPackageApi.useCredits(credits);
      setCreditBalance(response.remainingBalance);
      toast.success(`Đã sử dụng ${credits} AI credit`, {
        description: `Số dư còn lại: ${response.remainingBalance} credit.`,
      });
      return true;
    } catch (error) {
      toast.error('Không thể ghi nhận lượt sử dụng', {
        description: getErrorMessage(error),
        duration: 7000,
      });
      return false;
    }
  };

  const showGenerationError = (error: unknown, featureName: string) => {
    if (error instanceof ApiError && error.status === 402) {
      toast.error('Dịch vụ AI tạm hết lượt xử lý', {
        description: `Nhà cung cấp chưa thể xử lý ${featureName}. AI credit trong tài khoản của bạn chưa bị trừ.`,
        duration: 8000,
      });
      return;
    }

    toast.error(`Không thể ${featureName}`, {
      description: `${getErrorMessage(error)} AI credit của bạn chưa bị trừ.`,
      duration: 7000,
    });
  };

  const handleGenerate = async () => {
    if (generationLockRef.current) {
      return;
    }

    if (selectedModel === null) {
      return;
    }

    const selectedModelImage = modelChoices[selectedModel];
    const selectedProduct = clothesTab === 1
      ? comboUpperSelection?.product || null
      : selectedClothing === null ? null : productChoices[selectedClothing];
    const clothingImageUrl = clothesTab === 1
      ? comboUpperSelection?.imageUrl
      : customClothingImageUrl || selectedProduct?.image;
    const lowerClothingImageUrl = clothesTab === 1 ? comboLowerSelection?.imageUrl : undefined;

    if (!clothingImageUrl || !selectedModelImage || (clothesTab === 1 && !lowerClothingImageUrl)) {
      return;
    }

    const selectedShopImages = clothesTab === 1
      ? [comboUpperSelection, comboLowerSelection]
          .filter((selection) => selection?.source === 'shop')
          .map((selection) => selection?.imageUrl)
      : [selectedProduct?.image];
    if (selectedShopImages.some((imageUrl) => imageUrl && brokenImageUrls.has(imageUrl))) {
      toast.error('Ảnh sản phẩm không khả dụng', {
        description: 'Vui lòng chọn sản phẩm khác hoặc tải ảnh quần áo riêng của bạn.',
      });
      return;
    }

    generationLockRef.current = true;
    setIsGenerating(true);
    try {
      if (!(await ensureAvailableCredits(TRY_ON_CREDIT_COST))) {
        return;
      }

      const response = await aiApi.createTryOn({
        modelImageUrl: selectedModelImage,
        clothingImageUrl,
        lowerClothingImageUrl,
        productId: selectedProduct?.productId,
        clothType: clothesTab === 1
          ? 'combo'
          : selectedProduct ? getTryOnClothType(selectedProduct) : customClothingType,
        hdMode: highQuality,
      });

      if (!response.resultImageUrl) {
        toast.info('Ảnh đang được xử lý', {
          description: 'Kết quả chưa sẵn sàng nên AI credit chưa bị trừ. Vui lòng kiểm tra lại sau.',
        });
        return;
      }

      if (!(await consumeCredits(TRY_ON_CREDIT_COST))) {
        return;
      }
      setGeneratedResult(response.resultImageUrl);
    } catch (error) {
      showGenerationError(error, 'tạo ảnh thử đồ');
    } finally {
      generationLockRef.current = false;
      setIsGenerating(false);
    }
  };

  const handleReset = () => {
    setGeneratedResult(null);
    setSelectedClothing(null);
    setCustomClothingImageUrl(null);
    setComboUpperSelection(null);
    setComboLowerSelection(null);
    setActiveComboSlot('upper');
    setSelectedModel(null);
  };
  
  const handleGenerateStyling = async () => {
    if (generationLockRef.current) {
      return;
    }

    if (stylingClothing === null || stylingModel === null) {
      return;
    }

    const selectedProduct = stylingProductChoices[stylingClothing];
    const selectedModelImage = modelChoices[stylingModel];

    if (!selectedProduct || !selectedModelImage) {
      return;
    }

    if (brokenImageUrls.has(selectedProduct.image)) {
      alert('Ảnh sản phẩm này đang lỗi 404. Vui lòng chọn sản phẩm có ảnh hợp lệ.');
      return;
    }

    generationLockRef.current = true;
    setIsGeneratingStyling(true);
    try {
      if (!(await ensureAvailableCredits(MIX_MATCH_CREDIT_COST))) {
        return;
      }

      const response = await aiApi.createMixMatchTryOn({
        modelImageUrl: selectedModelImage,
        productId: selectedProduct.productId,
        modelGender: stylingModelGender,
        hdMode: highQuality,
      });

      if (!response.resultImageUrl) {
        toast.info('Ảnh phối đồ đang được xử lý', {
          description: 'Kết quả chưa sẵn sàng nên AI credit chưa bị trừ. Vui lòng kiểm tra lại sau.',
        });
        return;
      }

      if (!(await consumeCredits(response.creditCost || MIX_MATCH_CREDIT_COST))) {
        return;
      }
      setStylingResult(response.resultImageUrl);
      setStylingOutfit(response.outfit);
    } catch (error) {
      showGenerationError(error, 'tạo ảnh phối đồ');
    } finally {
      generationLockRef.current = false;
      setIsGeneratingStyling(false);
    }
  };

  const handleResetStyling = () => {
    setStylingResult(null);
    setStylingOutfit(null);
    setStylingClothing(null);
    setStylingModel(null);
  };

  const hasSelectedClothing = clothesTab === 1
    ? Boolean(comboUpperSelection && comboLowerSelection)
    : selectedClothing !== null || Boolean(customClothingImageUrl);
  const canGenerate = hasSelectedClothing && selectedModel !== null;
  const canGenerateStyling = stylingClothing !== null && stylingModel !== null;
  const tryOnSelectionWarning = (() => {
    if (canGenerate) return '';
    if (clothesTab === 1) {
      const missingClothes = [
        !comboUpperSelection ? 'phần trên' : '',
        !comboLowerSelection ? 'phần dưới' : '',
      ].filter(Boolean).join(' và ');
      if (missingClothes && selectedModel === null) {
        return `⚠️ Vui lòng chọn ${missingClothes} và người mẫu`;
      }
      if (missingClothes) return `⚠️ Vui lòng chọn ${missingClothes}`;
      return '⚠️ Vui lòng chọn người mẫu';
    }
    if (!hasSelectedClothing && selectedModel === null) return '⚠️ Vui lòng chọn quần áo và người mẫu';
    if (hasSelectedClothing && selectedModel === null) return '⚠️ Vui lòng chọn người mẫu';
    return '⚠️ Vui lòng chọn quần áo';
  })();

  return (
    <div className="flex h-screen bg-[#F9F9FB] font-sans text-sm overflow-hidden flex-col md:flex-row">
      {/* Mobile Header */}
      <div className="md:hidden flex items-center justify-between bg-white border-b border-gray-200 p-4 shrink-0">
        <div className="font-semibold text-gray-900 flex items-center gap-2">
          {activeResource === 'history' ? (
            <>
              <History className="w-5 h-5 text-[#20B29A]" />
              Lịch sử AI
            </>
          ) : activeResource === 'wardrobe' ? (
            <>
              <Library className="w-5 h-5 text-[#20B29A]" />
              Tủ đồ của tôi
            </>
          ) : activeResource === 'models' ? (
            <>
              <Users className="w-5 h-5 text-[#20B29A]" />
              Mẫu của tôi
            </>
          ) : mainMode === 0 ? (
            <>
              <Shirt className="w-5 h-5 text-[#20B29A]" />
              Thử đồ AI
            </>
          ) : (
            <>
              <Sparkles className="w-5 h-5 text-[#20B29A]" />
              Phối đồ với AI
            </>
          )}
        </div>
        <div className="flex items-center gap-1">
          <button
            onClick={handleBackToProduct}
            className="p-2 text-gray-600 hover:text-gray-900"
            aria-label="Quay lại sản phẩm"
            title="Quay lại sản phẩm"
          >
            <ChevronLeft className="w-5 h-5" />
          </button>
          <button onClick={() => setMobileMenuOpen(!mobileMenuOpen)} className="p-2 text-gray-600">
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16m-7 6h7" /></svg>
          </button>
        </div>
      </div>

      {/* Sidebar - Desktop & Mobile overlay */}
      <aside className={`fixed inset-y-0 left-0 z-50 w-[240px] bg-white border-r border-gray-200 flex flex-col h-full transition-transform transform md:relative md:translate-x-0 ${mobileMenuOpen ? 'translate-x-0' : '-translate-x-full'}`}>
        <div className="p-4 flex items-center justify-between md:block">
          <NavItem icon={Home} label="Trang chủ" onClick={() => navigateFromSidebar('/')} />
          <button className="md:hidden p-2 text-gray-400" onClick={() => setMobileMenuOpen(false)}>
            <ChevronLeft className="w-5 h-5" />
          </button>
        </div>
        
        <div className="flex-1 overflow-y-auto px-4 py-2">
          <div className="mb-6">
            <h3 className="px-4 text-xs font-medium text-gray-400 uppercase tracking-wider mb-2">Tạo</h3>
            <NavItem icon={Shirt} label="Thử đồ AI" active={activeResource === 'create' && mainMode === 0} onClick={() => openCreateMode(0)} />
            <NavItem icon={Sparkles} label="Phối đồ với AI" active={activeResource === 'create' && mainMode === 1} onClick={() => openCreateMode(1)} />
          </div>

          <div className="mb-6">
            <h3 className="px-4 text-xs font-medium text-gray-400 uppercase tracking-wider mb-2">Tài nguyên</h3>
            <NavItem icon={Library} label="Tủ đồ của tôi" active={activeResource === 'wardrobe'} onClick={() => openLibrary('wardrobe')} />
            <NavItem icon={Users} label="Mẫu của tôi" active={activeResource === 'models'} onClick={() => openLibrary('models')} />
            <NavItem icon={History} label="Lịch sử" active={activeResource === 'history'} onClick={openHistory} />
          </div>
        </div>

        <div className="p-4 border-t border-gray-200 space-y-1">
          <NavItem icon={UserCircle} label="Tài khoản của tôi" onClick={() => navigateFromSidebar('/profile')} />
          <NavItem 
            icon={CreditCard} 
            label="Gói của tôi" 
            onClick={() => navigateFromSidebar('/ai-packages')}
            badge={
              <span className="flex items-center gap-1 text-[10px] font-bold bg-gradient-to-r from-amber-200 to-yellow-400 text-yellow-900 px-1.5 py-0.5 rounded shadow-sm whitespace-nowrap">
                {isAuthenticated
                  ? isLoadingCredits
                    ? 'Đang tải...'
                    : `${creditBalance ?? '--'} credit`
                  : 'Mua credit'}
              </span>
            } 
          />
          <NavItem icon={HelpCircle} label="Hỗ trợ" />
        </div>
      </aside>

      {/* Main Content Area */}
      <div className="relative flex h-full min-h-0 min-w-0 flex-1 flex-col overflow-y-auto md:flex-row md:overflow-hidden">
        {/* Mobile Sidebar Overlay */}
        {mobileMenuOpen && (
          <div className="fixed inset-0 bg-black/50 z-40 md:hidden" onClick={() => setMobileMenuOpen(false)} />
        )}

        {activeResource === 'history' ? (
          <AIHistoryView
            historyItems={historyItems}
            isLoading={isLoadingHistory}
            onRefresh={() => void loadHistory()}
          />
        ) : activeResource === 'wardrobe' ? (
          <AssetLibraryView
            kind="clothing"
            items={uploadedClothingImages}
            isUploading={isUploadingClothing}
            onUpload={handleWardrobeUpload}
            onEdit={(item) => setEditingClothing(item as SavedClothingImage)}
            onDelete={(item) => deleteClothingFromLibrary(item as SavedClothingImage)}
            onTryOn={(item) => useClothingFromLibrary(item as SavedClothingImage)}
          />
        ) : activeResource === 'models' ? (
          <AssetLibraryView
            kind="model"
            items={savedModelProfiles}
            isUploading={isUploadingModel}
            onUpload={handleModelLibraryUpload}
            onEdit={(item) => setEditingModel(item as SavedModelProfile)}
            onDelete={(item) => deleteModelFromLibrary(item as SavedModelProfile)}
            onTryOn={(item) => useModelFromLibrary(item as SavedModelProfile)}
          />
        ) : (
          <>

        {/* Configuration Panel */}
        <div className="relative z-10 flex h-auto min-h-0 w-full shrink-0 flex-col border-b border-gray-200 bg-white shadow-none md:h-full md:w-[360px] md:border-b-0 md:border-r md:shadow-[4px_0_24px_-12px_rgba(0,0,0,0.1)]">
          {/* Mobile-like header back button (hidden on mobile) */}
          <div className="hidden shrink-0 items-center px-4 pb-2 pt-4 text-gray-400 md:flex">
            <button
              type="button"
              onClick={handleBackToProduct}
              className="rounded-lg p-1 transition-colors hover:bg-gray-100 hover:text-gray-700"
              aria-label="Quay lại trang sản phẩm"
              title="Quay lại trang sản phẩm"
            >
              <ChevronLeft className="h-5 w-5" />
            </button>
          </div>

          <div className="min-h-0 flex-1 overflow-y-auto px-5 pb-6 pt-4 md:pt-0">
            {mainMode === 0 ? (
              <>
                {/* Thử đồ AI Mode */}
                {/* Section 1: Chọn quần áo */}
                <div className="mb-8">
                  <SectionHeading title="Chọn quần áo" />
                  <SegmentedControl
                    options={["Quần áo đơn", "Trên & dưới"]}
                    activeIndex={clothesTab}
                    onChange={setClothesTab}
                  />

                  {clothesTab === 1 && (
                    <div className="mb-4 grid grid-cols-2 gap-2">
                      {([
                        { slot: 'upper' as const, label: 'Phần trên', selection: comboUpperSelection },
                        { slot: 'lower' as const, label: 'Phần dưới', selection: comboLowerSelection },
                      ]).map(({ slot, label, selection }) => (
                        <div key={slot} className="group relative">
                          <button
                            type="button"
                            onClick={() => setActiveComboSlot(slot)}
                            className={`flex min-h-[92px] w-full items-center gap-2 rounded-xl border-2 p-2 text-left transition-all ${
                              activeComboSlot === slot
                                ? 'border-[#20B29A] bg-[#20B29A]/5 ring-2 ring-[#20B29A]/10'
                                : 'border-gray-200 bg-white hover:border-gray-300'
                            }`}
                          >
                            {selection ? (
                              <img
                                src={selection.imageUrl}
                                alt={label}
                                className="h-[68px] w-14 shrink-0 rounded-lg object-cover"
                              />
                            ) : (
                              <span className="flex h-[68px] w-14 shrink-0 items-center justify-center rounded-lg bg-gray-100 text-gray-400">
                                <Shirt className="h-5 w-5" />
                              </span>
                            )}
                            <span className="min-w-0">
                              <span className="block text-xs font-semibold text-gray-900">{label}</span>
                              <span className="mt-1 block text-[10px] text-gray-500">
                                {selection
                                  ? selection.source === 'shop' ? 'Sản phẩm shop' : 'Ảnh của tôi'
                                  : 'Chưa chọn'}
                              </span>
                            </span>
                          </button>
                          {selection && (
                            <button
                              type="button"
                              onClick={() => slot === 'upper' ? setComboUpperSelection(null) : setComboLowerSelection(null)}
                              className="absolute right-1.5 top-1.5 rounded-full bg-white/90 p-1 text-gray-500 opacity-0 shadow-sm transition-opacity hover:text-red-600 group-hover:opacity-100 focus:opacity-100"
                              aria-label={`Bỏ chọn ${label.toLowerCase()}`}
                            >
                              <X className="h-3 w-3" />
                            </button>
                          )}
                        </div>
                      ))}
                    </div>
                  )}

                  <label
                    onDragEnter={(event) => {
                      event.preventDefault();
                      setIsDraggingClothingImage(true);
                    }}
                    onDragOver={(event) => event.preventDefault()}
                    onDragLeave={() => setIsDraggingClothingImage(false)}
                    onDrop={handleDropClothingImage}
                    className={`mb-3 flex cursor-pointer items-center justify-center gap-3 rounded-xl border-2 border-dashed px-4 py-5 transition-all ${
                      isDraggingClothingImage
                        ? 'border-[#20B29A] bg-[#20B29A]/10 ring-4 ring-[#20B29A]/10'
                        : selectedUploadedClothingUrl
                          ? 'border-[#20B29A] bg-[#20B29A]/5'
                          : 'border-gray-200 bg-gray-50 hover:border-[#20B29A]/60 hover:bg-[#20B29A]/5'
                    } ${isUploadingClothing ? 'pointer-events-none opacity-70' : ''}`}
                  >
                    {selectedUploadedClothingUrl ? (
                      <img
                        src={selectedUploadedClothingUrl}
                        alt="Quần áo riêng đã tải lên"
                        className="h-16 w-14 rounded-lg border border-white object-cover shadow-sm"
                      />
                    ) : (
                      <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full bg-white text-[#20B29A] shadow-sm">
                        {isUploadingClothing ? (
                          <span className="h-5 w-5 animate-spin rounded-full border-2 border-[#20B29A] border-t-transparent" />
                        ) : (
                          <Plus className="h-5 w-5" />
                        )}
                      </span>
                    )}
                    <span className="min-w-0 text-left">
                      <span className="block font-semibold text-gray-900">
                        {isUploadingClothing
                          ? 'Đang tải ảnh quần áo...'
                          : selectedUploadedClothingUrl
                            ? `Đổi ảnh ${clothesTab === 1 ? (activeComboSlot === 'upper' ? 'phần trên' : 'phần dưới') : 'quần áo riêng'}`
                            : `Tải ảnh ${clothesTab === 1 ? (activeComboSlot === 'upper' ? 'phần trên' : 'phần dưới') : 'quần áo riêng'}`}
                      </span>
                      <span className="mt-1 block text-xs text-gray-500">
                        Nhấn để chọn hoặc kéo và thả ảnh quần áo vào đây
                      </span>
                    </span>
                    <input
                      type="file"
                      accept="image/*"
                      disabled={isUploadingClothing}
                      className="hidden"
                      onChange={handleUploadClothingImage}
                    />
                  </label>

                  {clothesTab === 0 && customClothingImageUrl && (
                    <div className="mb-5 flex items-center gap-2 rounded-lg border border-gray-200 bg-white p-2">
                      <select
                        value={customClothingType}
                        onChange={(event) => updateCustomClothingType(event.target.value as ClothingImageType)}
                        className="h-9 min-w-0 flex-1 rounded-md border border-gray-200 bg-white px-2 text-xs text-gray-700 outline-none focus:border-[#20B29A]"
                        aria-label="Loại quần áo tải lên"
                      >
                        <option value="upper">Áo / phần trên</option>
                        <option value="lower">Quần / phần dưới</option>
                        <option value="full_set">Váy / bộ liền</option>
                      </select>
                      <button
                        type="button"
                        onClick={() => setCustomClothingImageUrl(null)}
                        className="inline-flex h-9 items-center gap-1 rounded-md px-2 text-xs font-semibold text-red-600 hover:bg-red-50"
                      >
                        <X className="h-3.5 w-3.5" />
                        Bỏ chọn
                      </button>
                    </div>
                  )}

                  <SegmentedControl
                    options={["Sản phẩm shop", "Quần áo của tôi"]}
                    activeIndex={clothingLibraryTab}
                    onChange={setClothingLibraryTab}
                  />

                  {clothingLibraryTab === 0 ? (
                    <>
                  <div className="flex justify-between items-center mb-3">
                    <div>
                      <h3 className="text-sm font-semibold text-gray-900">Sản phẩm trong shop</h3>
                      <p className="mt-0.5 text-[11px] text-gray-500">
                        {clothesTab === 1
                          ? `Chọn sản phẩm cho ${activeComboSlot === 'upper' ? 'phần trên' : 'phần dưới'}`
                          : 'Chọn sản phẩm bạn muốn thử'}
                      </p>
                    </div>
                    <button
                      type="button"
                      onClick={() => setIsProductBrowserOpen(true)}
                      className="text-xs font-semibold text-[#168f7c] hover:underline"
                    >
                      Xem tất cả
                    </button>
                  </div>

                  <div className="flex overflow-x-auto gap-2 pb-2 -mx-1 px-1 scrollbar-hide">
                    {isLoadingProducts && (
                      <div className="text-xs text-gray-500 py-4">Đang tải sản phẩm...</div>
                    )}
                    {!isLoadingProducts && availableShopClothingChoices.length === 0 && (
                      <div className="text-xs text-gray-500 py-4">
                        {clothesTab === 0
                          ? 'Chưa có sản phẩm có ảnh trong API.'
                          : `Chưa có sản phẩm phù hợp cho ${activeComboSlot === 'upper' ? 'phần trên' : 'phần dưới'}.`}
                      </div>
                    )}
                    {availableShopClothingChoices.map((product) => {
                      const productId = product.productId || product._id || product.id;
                      const selected = selectedShopClothingId === productId;

                      return (
                      <button 
                        key={productId}
                        onClick={() => selectTryOnProduct(product)}
                        className={`relative w-14 h-[76px] flex-shrink-0 rounded-lg overflow-hidden border-2 cursor-pointer transition-all ${
                          selected
                            ? 'border-[#20B29A] ring-2 ring-[#20B29A] ring-offset-1' 
                            : 'border-gray-200 hover:border-[#20B29A]'
                        }`}
                      >
                        <img
                          src={product.image}
                          alt={product.name}
                          className="w-full h-full object-cover"
                          onError={() => markBrokenImage(product.image)}
                        />
                        {selected && (
                          <div className="absolute top-1 right-1 bg-[#20B29A] rounded-full p-0.5">
                            <Check className="w-3 h-3 text-white" />
                          </div>
                        )}
                        <div className="absolute bottom-0 left-0 right-0 bg-black/40 text-white text-[9px] px-1 py-0.5 font-medium text-center">
                          {product.name}
                        </div>
                      </button>
                      );
                    })}
                  </div>
                    </>
                  ) : (
                    <div>
                      <div className="mb-3 flex items-center justify-between">
                        <div>
                          <h3 className="text-sm font-semibold text-gray-900">Quần áo của tôi</h3>
                          <p className="mt-0.5 text-[11px] text-gray-500">
                            {clothesTab === 1
                              ? `${availableUploadedClothingChoices.length} ảnh phù hợp · ${uploadedClothingImages.length} ảnh đã lưu`
                              : `${uploadedClothingImages.length} ảnh đã lưu theo tài khoản`}
                          </p>
                        </div>
                      </div>

                      {availableUploadedClothingChoices.length === 0 ? (
                        <div className="rounded-xl border border-dashed border-gray-200 bg-gray-50 px-4 py-7 text-center text-xs text-gray-500">
                          {uploadedClothingImages.length === 0
                            ? 'Chưa có ảnh quần áo riêng. Hãy tải ảnh lên ở phía trên để lưu và sử dụng lại.'
                            : `Chưa có ảnh ${activeComboSlot === 'upper' ? 'phần trên' : 'phần dưới'} trong thư viện.`}
                        </div>
                      ) : (
                        <div className="grid grid-cols-4 gap-2">
                          {availableUploadedClothingChoices.map((item) => {
                            const selected = selectedUploadedClothingUrl === item.url;
                            const typeLabel = item.clothType === 'lower'
                              ? 'Phần dưới'
                              : item.clothType === 'full_set'
                                ? 'Bộ liền'
                                : 'Phần trên';

                            return (
                              <div key={item.url} className="group relative">
                                <button
                                  type="button"
                                  onClick={() => selectUploadedClothing(item)}
                                  className={`relative aspect-[3/4] w-full overflow-hidden rounded-lg border-2 transition-all ${
                                    selected
                                      ? 'border-[#20B29A] ring-2 ring-[#20B29A] ring-offset-1'
                                      : 'border-gray-200 hover:border-[#20B29A]'
                                  }`}
                                >
                                  <img src={item.url} alt="Quần áo của tôi" className="h-full w-full object-cover" />
                                  {selected && (
                                    <span className="absolute right-1 top-1 rounded-full bg-[#20B29A] p-0.5">
                                      <Check className="h-3 w-3 text-white" />
                                    </span>
                                  )}
                                  <span className="absolute inset-x-0 bottom-0 bg-black/55 px-1 py-1 text-center text-[9px] font-medium text-white">
                                    {typeLabel}
                                  </span>
                                </button>
                                <button
                                  type="button"
                                  onClick={() => removeUploadedClothing(item.url)}
                                  className="absolute left-1 top-1 rounded-full bg-white/90 p-1 text-gray-500 opacity-0 shadow-sm transition-opacity hover:text-red-600 group-hover:opacity-100 focus:opacity-100"
                                  aria-label="Xóa ảnh quần áo đã lưu"
                                  title="Xóa ảnh đã lưu"
                                >
                                  <X className="h-3 w-3" />
                                </button>
                              </div>
                            );
                          })}
                        </div>
                      )}
                    </div>
                  )}
                </div>

                <hr className="border-gray-100 mb-8" />

                {/* Section 2: Chọn một mẫu */}
                <div>
                  <SectionHeading title="Chọn một mẫu" />
                  <p className="text-xs text-gray-500 mb-4">Chọn mẫu của chúng tôi hoặc tải lên mẫu của bạn để thử</p>

                  <label
                    onDragEnter={(event) => {
                      event.preventDefault();
                      setIsDraggingModelImage(true);
                    }}
                    onDragOver={(event) => event.preventDefault()}
                    onDragLeave={() => setIsDraggingModelImage(false)}
                    onDrop={(event) => handleDropModelImage(event, 'try-on')}
                    className={`mb-5 flex cursor-pointer flex-col items-center justify-center rounded-xl border-2 border-dashed px-4 py-6 text-center transition-all ${
                      isDraggingModelImage
                        ? 'border-[#20B29A] bg-[#20B29A]/10 ring-4 ring-[#20B29A]/10'
                        : 'border-gray-200 bg-gray-50 hover:border-[#20B29A]/60 hover:bg-[#20B29A]/5'
                    } ${isUploadingModel ? 'pointer-events-none opacity-70' : ''}`}
                  >
                    <span className="mb-2 flex h-10 w-10 items-center justify-center rounded-full bg-white text-[#20B29A] shadow-sm">
                      {isUploadingModel ? (
                        <span className="h-5 w-5 animate-spin rounded-full border-2 border-[#20B29A] border-t-transparent" />
                      ) : (
                        <Upload className="h-5 w-5" />
                      )}
                    </span>
                    <span className="font-semibold text-gray-900">
                      {isUploadingModel ? 'Đang tải ảnh lên...' : 'Tải ảnh người mẫu của bạn'}
                    </span>
                    <span className="mt-1 text-xs text-gray-500">
                      Nhấn để chọn ảnh hoặc kéo và thả ảnh vào đây
                    </span>
                    <input
                      type="file"
                      accept="image/*"
                      disabled={isUploadingModel}
                      className="hidden"
                      onChange={(event) => handleUploadModelImage(event, 'try-on')}
                    />
                  </label>

                  <div className="flex items-center gap-2 mb-4">
                    <div className="flex-1">
                      <SegmentedControl
                        options={["Mẫu của chúng tôi", "Mẫu của bạn"]}
                        activeIndex={modelTab}
                        onChange={setModelTab}
                      />
                    </div>
                    <button className="flex items-center gap-1.5 text-xs font-medium text-gray-700 bg-white border border-gray-200 rounded-lg px-3 py-1.5 hover:bg-gray-50 h-[34px] mb-4">
                      <SlidersHorizontal className="w-3.5 h-3.5" />
                      Tất cả
                    </button>
                  </div>

                  <div className="grid grid-cols-4 gap-2">
                    {modelTab === 1 && uploadedModelImages.length === 0 && (
                      <div className="col-span-4 rounded-lg border border-dashed border-gray-200 bg-gray-50 px-3 py-6 text-center text-xs text-gray-500">
                        Chưa có mẫu nào. Upload ảnh lên Cloudinary để lưu vào mẫu của tôi.
                      </div>
                    )}

                    {tryOnModelChoices.map((src, i) => {
                      const modelIndex = getModelChoiceIndex(i);

                      return (
                      <button
                        key={`${modelTab}-${src}-${i}`}
                        onClick={() => setSelectedModel(modelIndex)}
                        className={`relative aspect-[3/4] rounded-lg overflow-hidden cursor-pointer transition-all border-2 ${
                          selectedModel === modelIndex
                            ? 'border-[#20B29A] ring-2 ring-[#20B29A] ring-offset-1'
                            : 'border-transparent hover:border-[#20B29A]'
                        }`}
                      >
                        <img src={src} alt="Model" className="w-full h-full object-cover" />
                        {selectedModel === modelIndex && (
                          <div className="absolute top-1 right-1 bg-[#20B29A] rounded-full p-0.5">
                            <Check className="w-3 h-3 text-white" />
                          </div>
                        )}
                      </button>
                      );
                    })}
                  </div>
                </div>
              </>
            ) : (
              <>
                {/* Phối đồ với AI Mode */}
                {/* Chọn sản phẩm từ tủ đồ */}
                <div className="mb-8">
                  <SectionHeading title="Chọn sản phẩm" />
                  <p className="text-xs text-gray-500 mb-4">Chọn sản phẩm bạn muốn phối đồ</p>

                  <div className="flex overflow-x-auto gap-2 pb-2 -mx-1 px-1 scrollbar-hide mb-4">
                    {isLoadingProducts && (
                      <div className="text-xs text-gray-500 py-4">Đang tải sản phẩm...</div>
                    )}
                    {!isLoadingProducts && stylingProductChoices.length === 0 && (
                      <div className="text-xs text-gray-500 py-4">Chưa có sản phẩm áo/quần có ảnh trong API.</div>
                    )}
                    {stylingProductChoices.map((product, i) => (
                      <button 
                        key={product.productId || product.id} 
                        onClick={() => setStylingClothing(i)}
                        className={`relative w-14 h-[76px] flex-shrink-0 rounded-lg overflow-hidden border-2 cursor-pointer transition-all ${
                          stylingClothing === i 
                            ? 'border-[#20B29A] ring-2 ring-[#20B29A] ring-offset-1' 
                            : 'border-gray-200 hover:border-[#20B29A]'
                        }`}
                      >
                        <img
                          src={product.image}
                          alt={product.name}
                          className="w-full h-full object-cover"
                          onError={() => markBrokenImage(product.image)}
                        />
                        {stylingClothing === i && (
                          <div className="absolute top-1 right-1 bg-[#20B29A] rounded-full p-0.5">
                            <Check className="w-3 h-3 text-white" />
                          </div>
                        )}
                        <div className="absolute bottom-0 left-0 right-0 bg-black/40 text-white text-[9px] px-1 py-0.5 font-medium text-center">
                          {product.name}
                        </div>
                      </button>
                    ))}
                  </div>

                </div>

                <hr className="border-gray-100 mb-8" />

                {/* Chọn người mẫu */}
                <div className="mb-8">
                  <SectionHeading title="Chọn người mẫu" />
                  <p className="text-xs text-gray-500 mb-4">Chọn người mẫu để xem gợi ý phối đồ</p>

                  <div className="grid grid-cols-4 gap-2">
                    <label className="border border-dashed border-gray-300 rounded-lg flex flex-col items-center justify-center aspect-[3/4] bg-gray-50 hover:bg-gray-100 text-gray-500 transition-colors cursor-pointer">
                      <Upload className="w-5 h-5 mb-1" />
                      <span className="text-xs font-medium">{isUploadingModel ? 'Đang tải' : 'Cloudinary'}</span>
                      <input
                        type="file"
                        accept="image/*"
                        className="hidden"
                        onChange={(event) => void handleUploadModelImage(event, 'styling')}
                      />
                    </label>

                    {modelChoices.slice(0, 8).map((src, i) => (
                      <button
                        key={i}
                        onClick={() => {
                          setStylingModel(i);
                          if (i >= uploadedModelImages.length) {
                            setStylingModelGender("women");
                            setStylingClothing(null);
                          }
                        }}
                        className={`relative aspect-[3/4] rounded-lg overflow-hidden cursor-pointer transition-all border-2 ${
                          stylingModel === i
                            ? 'border-[#20B29A] ring-2 ring-[#20B29A] ring-offset-1'
                            : 'border-transparent hover:border-[#20B29A]'
                        }`}
                      >
                        <img src={src} alt="Model" className="w-full h-full object-cover" />
                        {stylingModel === i && (
                          <div className="absolute top-1 right-1 bg-[#20B29A] rounded-full p-0.5">
                            <Check className="w-3 h-3 text-white" />
                          </div>
                        )}
                      </button>
                    ))}
                  </div>

                  <div className="mt-4 rounded-lg border border-gray-200 bg-gray-50 p-2">
                    <p className="mb-2 text-xs font-medium text-gray-600">Phối theo giới tính mẫu</p>
                    <div className="grid grid-cols-3 gap-1 rounded-md bg-white p-1">
                      {[
                        { label: 'Nam', value: 'men' },
                        { label: 'Nữ', value: 'women' },
                        { label: 'Unisex', value: 'unisex' },
                      ].map((option) => (
                        <button
                          key={option.value}
                          type="button"
                          onClick={() => {
                            setStylingModelGender(option.value as Product["gender"]);
                            setStylingClothing(null);
                          }}
                          className={`rounded-md px-2 py-1.5 text-xs font-medium transition-colors ${
                            stylingModelGender === option.value
                              ? 'bg-[#20B29A] text-white shadow-sm'
                              : 'text-gray-600 hover:bg-gray-100 hover:text-gray-900'
                          }`}
                        >
                          {option.label}
                        </button>
                      ))}
                    </div>
                  </div>
                </div>

                <hr className="border-gray-100 mb-8" />

                {/* Tủ đồ hiện tại */}
                <div className="mb-8">
                  <div className="flex items-center justify-between mb-4">
                    <h2 className="text-base font-semibold text-gray-900">Tủ đồ hiện tại</h2>
                    <button className="text-xs font-medium text-[#20B29A] hover:underline flex items-center gap-1">
                      <Plus className="w-3.5 h-3.5" />
                      Thêm mới
                    </button>
                  </div>

                  <div className="grid grid-cols-4 gap-3">
                    {CLOTHING_CATEGORIES.map((category, idx) => (
                      <div key={idx} className="bg-gray-50 rounded-lg p-3 text-center hover:bg-gray-100 cursor-pointer transition-colors border border-gray-200">
                        <category.icon className="w-8 h-8 mx-auto mb-2 text-gray-600" />
                        <p className="text-xs font-medium text-gray-900 mb-0.5">{category.name}</p>
                        <p className="text-[10px] text-gray-500">{category.items} items</p>
                      </div>
                    ))}
                  </div>
                </div>

                <hr className="border-gray-100 mb-8" />

                {/* Điều kiện thời tiết */}
                <div className="mb-8">
                  <div className="flex items-center gap-2 mb-4">
                    <h2 className="text-base font-semibold text-gray-900">Thời tiết hôm nay</h2>
                    <MapPin className="w-4 h-4 text-gray-400" />
                  </div>

                  <div className="grid grid-cols-2 gap-2">
                    {WEATHER_CONDITIONS.map((weather, idx) => (
                      <button
                        key={idx}
                        onClick={() => setSelectedWeather(idx)}
                        className={`p-3 rounded-lg border-2 transition-all flex flex-col items-center gap-2 ${
                          selectedWeather === idx
                            ? 'border-[#20B29A] bg-[#20B29A]/5'
                            : 'border-gray-200 hover:border-gray-300'
                        }`}
                      >
                        <weather.icon className={`w-6 h-6 ${selectedWeather === idx ? 'text-[#20B29A]' : 'text-gray-500'}`} />
                        <div className="text-center">
                          <p className="text-xs font-medium text-gray-900">{weather.label}</p>
                          <p className="text-[10px] text-gray-500">{weather.temp}</p>
                        </div>
                      </button>
                    ))}
                  </div>
                </div>

                <hr className="border-gray-100 mb-8" />

                {/* Dịp sự kiện */}
                <div className="mb-8">
                  <h2 className="text-base font-semibold text-gray-900 mb-4">Dịp sự kiện</h2>

                  <div className="space-y-2">
                    {['Đi làm', 'Đi chơi', 'Dự tiệc', 'Du lịch', 'Thể thao'].map((occasion) => (
                      <button
                        key={occasion}
                        onClick={() => setSelectedOccasion(occasion)}
                        className={`w-full px-4 py-2.5 rounded-lg text-sm font-medium text-left transition-all ${
                          selectedOccasion === occasion
                            ? 'bg-[#20B29A] text-white shadow-sm'
                            : 'bg-gray-50 text-gray-700 hover:bg-gray-100'
                        }`}
                      >
                        {occasion}
                      </button>
                    ))}
                  </div>
                </div>

                <hr className="border-gray-100 mb-8" />

                {/* Phong cách yêu thích */}
                <div>
                  <div className="flex items-center justify-between mb-4">
                    <h2 className="text-base font-semibold text-gray-900">Phong cách yêu thích</h2>
                    <button className="text-xs font-medium text-gray-500 hover:text-gray-700 flex items-center gap-1">
                      <Settings2 className="w-3.5 h-3.5" />
                      Tùy chỉnh
                    </button>
                  </div>

                  <div className="flex flex-wrap gap-2">
                    {['Hiện đại', 'Cổ điển', 'Tối giản', 'Năng động', 'Sang trọng'].map((style) => (
                      <button
                        key={style}
                        className="px-3 py-1.5 bg-gray-100 hover:bg-gray-200 text-gray-700 text-xs font-medium rounded-full transition-colors"
                      >
                        {style}
                      </button>
                    ))}
                  </div>
                </div>
              </>
            )}
          </div>

        {/* Bottom Sticky Action Area */}
        <div className="z-20 shrink-0 border-t border-gray-100 bg-white p-4 md:p-5">
          <div className="mb-3 flex items-center justify-between rounded-lg bg-slate-50 px-3 py-2 text-xs">
            <span className="font-medium text-slate-600">Số dư AI credit</span>
            <button
              type="button"
              onClick={() => navigate(isAuthenticated ? '/ai-packages' : '/login', isAuthenticated ? undefined : { state: { from: '/use-ai' } })}
              className="font-bold text-[#168f7c] hover:text-[#117565]"
            >
              {isAuthenticated
                ? isLoadingCredits
                  ? 'Đang tải...'
                  : `${creditBalance ?? '--'} credit · Mua thêm`
                : 'Đăng nhập để sử dụng'}
            </button>
          </div>
          {mainMode === 0 ? (
            <>
              {/* Selection Status */}
              {!canGenerate && (
                <div className="mb-3 p-2 bg-amber-50 border border-amber-200 rounded-lg">
                  <p className="text-xs text-amber-800 text-center">
                    {tryOnSelectionWarning}
                  </p>
                </div>
              )}
              
              <div className="flex items-center justify-between mb-3 md:mb-4">
                <div className="flex items-center gap-2">
                  {/* Custom Toggle Switch */}
                  <button
                    onClick={() => setHighQuality(!highQuality)}
                    className={`w-9 h-5 rounded-full p-0.5 transition-colors ${highQuality ? 'bg-[#20B29A]' : 'bg-gray-200'}`}
                  >
                    <div className={`w-4 h-4 rounded-full bg-white shadow-sm transform transition-transform ${highQuality ? 'translate-x-4' : 'translate-x-0'}`} />
                  </button>
                  <span className="text-sm font-medium text-gray-800">Chế độ chất lượng cao</span>
                  <span className="text-[10px] font-bold text-white bg-blue-500 rounded-full px-1.5 py-0.5 leading-none">HD</span>
                </div>
              </div>

              <button 
                onClick={handleGenerate}
                disabled={isGenerating || !canGenerate}
                className={`w-full font-medium rounded-xl py-3.5 flex items-center justify-center relative transition-colors shadow-sm ${
                  canGenerate 
                    ? 'bg-[#20B29A] hover:bg-[#1a9682] text-white' 
                    : 'bg-gray-300 text-gray-500 cursor-not-allowed'
                } ${isGenerating ? 'opacity-75' : ''}`}
              >
                {isGenerating ? (
                  <>
                    <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin mr-2" />
                    <span>Đang tạo...</span>
                  </>
                ) : (
                  <>
                    <span>Tạo</span>
                    {canGenerate && (
                      <span className="absolute right-4 text-xs font-semibold bg-white/20 px-2 py-1 rounded-md">Nhanh - 1 credit</span>
                    )}
                  </>
                )}
              </button>
            </>
          ) : (
            <>
              {/* Selection Status for Styling */}
              {!canGenerateStyling && (
                <div className="mb-3 p-2 bg-amber-50 border border-amber-200 rounded-lg">
                  <p className="text-xs text-amber-800 text-center">
                    {stylingClothing === null && stylingModel === null && '⚠️ Vui lòng chọn sản phẩm và người mẫu'}
                    {stylingClothing !== null && stylingModel === null && '⚠️ Vui lòng chọn người mẫu'}
                    {stylingClothing === null && stylingModel !== null && '⚠️ Vui lòng chọn sản phẩm'}
                  </p>
                </div>
              )}

              <button
                onClick={handleGenerateStyling}
                disabled={isGeneratingStyling || !canGenerateStyling}
                className={`relative w-full font-semibold rounded-xl py-3.5 flex items-center justify-center gap-2 transition-colors shadow-sm ${
                  canGenerateStyling
                    ? 'bg-[#20B29A] hover:bg-[#1a9682] text-white'
                    : 'bg-gray-300 text-gray-500 cursor-not-allowed'
                } ${isGeneratingStyling ? 'opacity-75' : ''}`}
              >
                {isGeneratingStyling ? (
                  <>
                    <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                    <span>Đang tạo gợi ý...</span>
                  </>
                ) : (
                  <>
                    <Sparkles className="w-5 h-5" />
                    <span>Tạo gợi ý phối đồ</span>
                    {canGenerateStyling && (
                      <span className="absolute right-4 text-xs font-semibold bg-white/20 px-2 py-1 rounded-md">2 credits</span>
                    )}
                  </>
                )}
              </button>
            </>
          )}
        </div>
      </div>

      {/* Main Preview Area */}
      {mainMode === 0 ? (
        <div className="w-full md:flex-1 flex items-center justify-center p-4 md:p-8 bg-[#F9F9FB] relative min-h-[500px] md:h-full">
          {!generatedResult ? (
            <div className="bg-white rounded-2xl shadow-[0_4px_40px_-12px_rgba(0,0,0,0.08)] p-6 md:p-10 w-full max-w-[800px] flex flex-col md:flex-row items-center gap-8 md:gap-10">
              {/* Illustration Side */}
              <div className="w-full md:flex-1 relative flex items-center justify-center h-[250px] md:h-[300px]">
                {/* Mocking the graphic with composed elements */}
                <div className="relative w-full h-full max-w-[280px]">
                  {/* Back model shadow/outline */}
                  <div className="absolute right-0 bottom-0 w-[140px] h-[220px] rounded-t-full bg-blue-50 overflow-hidden">
                    <img src="https://images.unsplash.com/photo-1663248473494-44e1908f52c2?auto=format&fit=crop&q=80&w=300&h=400" className="w-full h-full object-cover object-top opacity-50 grayscale" alt="Silhouette" />
                  </div>
                  {/* Front colored model */}
                  <div className="absolute left-10 bottom-0 w-[160px] h-[260px] rounded-t-[80px] overflow-hidden shadow-lg border-4 border-white z-10 bg-white">
                    <img src="https://images.unsplash.com/photo-1658860547138-1e28dfb90867?auto=format&fit=crop&q=80&w=300&h=500" className="w-full h-full object-cover object-top" alt="Final Model" />
                  </div>
                  {/* Floating Clothing Item */}
                  <div className="absolute left-0 top-10 w-24 h-28 bg-white rounded-xl shadow-xl border border-indigo-100 p-2 z-20 transform -rotate-6">
                    <div className="w-full h-full rounded-lg overflow-hidden bg-gray-50 flex items-center justify-center relative">
                      <img src={tshirtProduct} alt="Clothes" className="w-full h-full object-cover" />
                      <div className="absolute -right-2 -top-2 bg-indigo-500 rounded-full p-1 text-white shadow-sm">
                        <Plus className="w-3 h-3" />
                      </div>
                    </div>
                  </div>
                  {/* Arrow */}
                  <svg className="absolute top-1/2 left-[40%] w-16 h-8 text-[#20B29A] z-20" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={2}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M14 5l7 7m0 0l-7 7m7-7H3" />
                  </svg>
                </div>
              </div>

              {/* Text Steps Side */}
              <div className="flex-1 space-y-8">
                <div className="flex gap-4">
                  <div className="w-6 h-6 rounded-full bg-gray-800 text-white flex items-center justify-center font-bold text-xs flex-shrink-0 mt-0.5">1</div>
                  <div>
                    <h3 className="font-semibold text-gray-900 mb-1 text-base">Chọn quần áo</h3>
                    <p className="text-gray-500 text-sm leading-relaxed">Chọn quần áo bạn muốn thử, vui lòng làm theo hướng dẫn</p>
                  </div>
                </div>

                <div className="flex gap-4">
                  <div className="w-6 h-6 rounded-full bg-gray-800 text-white flex items-center justify-center font-bold text-xs flex-shrink-0 mt-0.5">2</div>
                  <div>
                    <h3 className="font-semibold text-gray-900 mb-1 text-base">Chọn hoặc tải lên mẫu</h3>
                    <p className="text-gray-500 text-sm leading-relaxed">Chọn mẫu hoặc tải lên mẫu của bạn để thử!</p>
                  </div>
                </div>

                <div className="flex gap-4">
                  <div className="w-6 h-6 rounded-full bg-gray-800 text-white flex items-center justify-center font-bold text-xs flex-shrink-0 mt-0.5">3</div>
                  <div>
                    <h3 className="font-semibold text-gray-900 mb-1 text-base">Thử ngay!</h3>
                    <p className="text-gray-500 text-sm leading-relaxed">Nhấp vào 'Tạo' để xem bộ đồ trở nên sống động trên mẫu!</p>
                  </div>
                </div>
              </div>
            </div>
          ) : (
            /* Result View */
            <div className="w-full max-w-[900px]">
              <div className="bg-white rounded-2xl shadow-[0_4px_40px_-12px_rgba(0,0,0,0.08)] overflow-hidden">
                {/* Header */}
                <div className="p-4 md:p-6 border-b border-gray-100 flex items-center justify-between">
                  <div>
                    <h3 className="text-lg font-semibold text-gray-900 mb-1">Kết quả thử đồ AI</h3>
                    <p className="text-sm text-gray-500">Đã tạo thành công với {highQuality ? 'chất lượng HD' : 'chất lượng chuẩn'}</p>
                  </div>
                  <button 
                    onClick={handleReset}
                    className="flex items-center gap-2 px-4 py-2 text-sm font-medium text-gray-700 hover:text-gray-900 hover:bg-gray-50 rounded-lg transition-colors"
                  >
                    <RotateCcw className="w-4 h-4" />
                    Tạo mới
                  </button>
                </div>

                {/* Image Result */}
                <div className="relative bg-gray-50">
                  <img 
                    src={generatedResult} 
                    alt="AI Generated Result" 
                    className="w-full h-auto object-contain max-h-[600px] mx-auto"
                  />
                  <div className="absolute top-4 right-4 bg-white/90 backdrop-blur-sm rounded-lg px-3 py-1.5 shadow-sm">
                    <span className="text-xs font-semibold text-gray-900">AI Generated</span>
                  </div>
                </div>

                {/* Action Buttons */}
                <div className="p-4 md:p-6 bg-gray-50 border-t border-gray-100">
                  <div className="flex flex-col md:flex-row gap-3">
                    <button className="flex-1 bg-[#20B29A] hover:bg-[#1a9682] text-white font-medium py-3 px-4 rounded-xl flex items-center justify-center gap-2 transition-colors shadow-sm">
                      <Download className="w-5 h-5" />
                      Tải xuống
                    </button>
                    <button className="flex-1 bg-white hover:bg-gray-50 text-gray-700 font-medium py-3 px-4 rounded-xl flex items-center justify-center gap-2 border border-gray-200 transition-colors">
                      <Share2 className="w-5 h-5" />
                      Chia sẻ
                    </button>
                    <button className="md:w-auto px-6 bg-white hover:bg-gray-50 text-gray-700 font-medium py-3 rounded-xl flex items-center justify-center gap-2 border border-gray-200 transition-colors">
                      <Plus className="w-5 h-5" />
                      Lưu vào bộ sưu tập
                    </button>
                  </div>
                </div>
              </div>

              {/* Quick Actions Below */}
              <div className="mt-6 grid grid-cols-2 md:grid-cols-4 gap-3">
                <button className="bg-white hover:bg-gray-50 p-4 rounded-xl border border-gray-200 text-center transition-colors">
                  <div className="text-2xl mb-2">✨</div>
                  <p className="text-xs font-medium text-gray-900">Thử trang phục khác</p>
                </button>
                <button className="bg-white hover:bg-gray-50 p-4 rounded-xl border border-gray-200 text-center transition-colors">
                  <div className="text-2xl mb-2">👥</div>
                  <p className="text-xs font-medium text-gray-900">Đổi mẫu</p>
                </button>
                <button className="bg-white hover:bg-gray-50 p-4 rounded-xl border border-gray-200 text-center transition-colors">
                  <div className="text-2xl mb-2">🎨</div>
                  <p className="text-xs font-medium text-gray-900">Chỉnh sửa</p>
                </button>
                <button className="bg-white hover:bg-gray-50 p-4 rounded-xl border border-gray-200 text-center transition-colors">
                  <div className="text-2xl mb-2">📸</div>
                  <p className="text-xs font-medium text-gray-900">Tạo biến thể</p>
                </button>
              </div>
            </div>
          )}
        </div>
      ) : (
        <div className="flex-1 overflow-y-auto p-4 md:p-6 bg-[#F9F9FB]">
          {!stylingResult ? (
            <div className="max-w-[1200px] mx-auto">
              {/* Header */}
              <div className="mb-6">
                <div className="flex items-center justify-between mb-2">
                  <h1 className="text-2xl font-bold text-gray-900">Gợi ý phối đồ AI</h1>
                  <button className="flex items-center gap-2 px-4 py-2 bg-white border border-gray-200 rounded-lg text-sm font-medium text-gray-700 hover:bg-gray-50 transition-colors">
                    <TrendingUp className="w-4 h-4" />
                    Xu hướng
                  </button>
                </div>
                <p className="text-sm text-gray-600">Dựa trên thời tiết, dịp sự kiện và phong cách của bạn</p>
              </div>

              {/* Style Cards Grid */}
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-2 gap-6">
                {STYLE_SUGGESTIONS.map((style) => (
                  <div key={style.id} className="bg-white rounded-2xl shadow-sm hover:shadow-md transition-all overflow-hidden border border-gray-100">
                    <div className="aspect-[3/4] relative overflow-hidden bg-gray-100">
                      <img
                        src={style.image}
                        alt={style.name}
                        className="w-full h-full object-cover hover:scale-105 transition-transform duration-300"
                      />
                      <div className="absolute top-3 right-3">
                        <button className="w-8 h-8 bg-white/90 backdrop-blur-sm rounded-full flex items-center justify-center hover:bg-white transition-colors shadow-sm">
                          <svg className="w-4 h-4 text-gray-700" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z" />
                          </svg>
                        </button>
                      </div>
                    </div>

                    <div className="p-4">
                      <div className="flex items-center justify-between mb-3">
                        <h3 className="font-semibold text-gray-900 text-base">{style.name}</h3>
                        <div className="flex gap-1">
                          <span className="text-xs px-2 py-1 bg-blue-50 text-blue-700 rounded-md font-medium">{style.season}</span>
                          <span className="text-xs px-2 py-1 bg-purple-50 text-purple-700 rounded-md font-medium">{style.occasion}</span>
                        </div>
                      </div>

                      <div className="mb-4">
                        <p className="text-xs text-gray-500 mb-2">Gồm có:</p>
                        <div className="flex flex-wrap gap-1.5">
                          {style.items.map((item, idx) => (
                            <span key={idx} className="text-xs px-2 py-1 bg-gray-100 text-gray-700 rounded-md">
                              {item}
                            </span>
                          ))}
                        </div>
                      </div>

                      <div className="flex gap-2">
                        <button className="flex-1 bg-[#20B29A] hover:bg-[#1a9682] text-white text-sm font-medium py-2.5 rounded-lg transition-colors">
                          Thử ngay
                        </button>
                        <button className="px-4 bg-gray-100 hover:bg-gray-200 text-gray-700 text-sm font-medium rounded-lg transition-colors flex items-center justify-center">
                          <Upload className="w-4 h-4" />
                        </button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>

              {/* Load More */}
              <div className="mt-8 text-center">
                <button className="px-6 py-3 bg-white border border-gray-200 text-gray-700 font-medium rounded-lg hover:bg-gray-50 transition-colors">
                  Xem thêm gợi ý
                </button>
              </div>
            </div>
          ) : (
            /* Styling Result View */
            <div className="w-full max-w-[900px] mx-auto">
              <div className="bg-white rounded-2xl shadow-[0_4px_40px_-12px_rgba(0,0,0,0.08)] overflow-hidden">
                {/* Header */}
                <div className="p-4 md:p-6 border-b border-gray-100 flex items-center justify-between">
                  <div>
                    <h3 className="text-lg font-semibold text-gray-900 mb-1">Gợi ý phối đồ AI</h3>
                    <p className="text-sm text-gray-500">Dựa trên sản phẩm và phong cách bạn chọn</p>
                  </div>
                  <button 
                    onClick={handleResetStyling}
                    className="flex items-center gap-2 px-4 py-2 text-sm font-medium text-gray-700 hover:text-gray-900 hover:bg-gray-50 rounded-lg transition-colors"
                  >
                    <RotateCcw className="w-4 h-4" />
                    Tạo mới
                  </button>
                </div>

                {/* Image Result */}
                <div className="relative bg-gray-50">
                  <img 
                    src={stylingResult} 
                    alt="AI Styling Suggestion" 
                    className="w-full h-auto object-contain max-h-[600px] mx-auto"
                  />
                  <div className="absolute top-4 right-4 bg-white/90 backdrop-blur-sm rounded-lg px-3 py-1.5 shadow-sm">
                    <span className="text-xs font-semibold text-gray-900">AI Styled</span>
                  </div>
                  
                  {/* Outfit Details Overlay */}
                  <div className="absolute bottom-4 left-4 right-4 bg-white/95 backdrop-blur-sm rounded-lg p-4">
                    <h4 className="text-sm font-semibold text-gray-900 mb-2">Chi tiết outfit</h4>
                    <div className="flex flex-wrap gap-2">
                      {stylingOutfit?.top && (
                        <span className="text-xs px-2 py-1 bg-[#20B29A]/10 text-[#20B29A] rounded-md font-medium">
                          {stylingOutfit.top.name}
                        </span>
                      )}
                      {stylingOutfit?.bottom && (
                        <span className="text-xs px-2 py-1 bg-blue-50 text-blue-700 rounded-md font-medium">
                          {stylingOutfit.bottom.name}
                        </span>
                      )}
                    </div>
                    </div>
                  </div>

                {/* Action Buttons */}
                <div className="p-4 md:p-6 bg-gray-50 border-t border-gray-100">
                  <div className="flex flex-col md:flex-row gap-3">
                    <button className="flex-1 bg-[#20B29A] hover:bg-[#1a9682] text-white font-medium py-3 px-4 rounded-xl flex items-center justify-center gap-2 transition-colors shadow-sm">
                      <Download className="w-5 h-5" />
                      Tải xuống
                    </button>
                    <button className="flex-1 bg-white hover:bg-gray-50 text-gray-700 font-medium py-3 px-4 rounded-xl flex items-center justify-center gap-2 border border-gray-200 transition-colors">
                      <Share2 className="w-5 h-5" />
                      Chia sẻ
                    </button>
                    <button className="md:w-auto px-6 bg-white hover:bg-gray-50 text-gray-700 font-medium py-3 rounded-xl flex items-center justify-center gap-2 border border-gray-200 transition-colors">
                      <Plus className="w-5 h-5" />
                      Lưu vào bộ sưu tập
                    </button>
                  </div>
                </div>
              </div>

              {/* Additional Suggestions */}
              <div className="mt-6">
                <h3 className="text-base font-semibold text-gray-900 mb-4">Gợi ý khác</h3>
                <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
                  {STYLE_SUGGESTIONS.slice(0, 3).map((style) => (
                    <div key={style.id} className="bg-white rounded-xl overflow-hidden border border-gray-100 hover:shadow-md transition-all cursor-pointer">
                      <div className="aspect-[3/4] relative">
                        <img src={style.image} alt={style.name} className="w-full h-full object-cover" />
                      </div>
                      <div className="p-3">
                        <p className="text-xs font-medium text-gray-900 mb-1">{style.name}</p>
                        <span className="text-[10px] px-2 py-0.5 bg-gray-100 text-gray-600 rounded-md">{style.occasion}</span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}
        </div>
      )}
          </>
        )}
    </div>

    <ProductBrowserModal
      open={isProductBrowserOpen}
      products={availableShopClothingChoices}
      selectedProductId={selectedShopClothingId}
      onClose={() => setIsProductBrowserOpen(false)}
      onSelect={selectTryOnProduct}
    />

    <AssetEditorModal
      kind="clothing"
      item={editingClothing}
      onClose={() => setEditingClothing(null)}
      onSave={(item) => saveClothingDetails(item as SavedClothingImage)}
      onTryOn={(item) => useClothingFromLibrary(item as SavedClothingImage)}
    />

    <AssetEditorModal
      kind="model"
      item={editingModel}
      onClose={() => setEditingModel(null)}
      onSave={(item) => saveModelDetails(item as SavedModelProfile)}
      onTryOn={(item) => useModelFromLibrary(item as SavedModelProfile)}
    />

    {/* Plan Modal */}
    {isPlanModalOpen && (
      <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/50 backdrop-blur-sm p-4 animate-in fade-in duration-200">
        <div className="bg-[#222222] text-white rounded-2xl w-full max-w-[840px] shadow-2xl relative border border-[#333333]">
          {/* Close button */}
          <button 
            onClick={() => setIsPlanModalOpen(false)}
            className="absolute top-4 right-4 text-gray-400 hover:text-white transition-colors"
          >
            <X className="w-5 h-5" />
          </button>

          <div className="p-8">
            <h2 className="text-2xl font-bold mb-2">Sẵn sàng trải nghiệm AI Premium?</h2>
            <p className="text-gray-400 text-[15px] mb-8">Nâng cấp lên Professional để mở khóa toàn bộ tính năng và sáng tạo không giới hạn.</p>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-8 relative">
              {/* Divider */}
              <div className="hidden md:block absolute left-1/2 top-0 bottom-0 w-[1px] bg-[#333333] -translate-x-1/2"></div>

              {/* Left Column: Starter */}
              <div className="flex flex-col">
                <div className="flex items-center gap-3 mb-2">
                  <h3 className="text-2xl font-bold">Starter</h3>
                  <span className="text-[11px] font-medium px-2 py-0.5 rounded-full border border-gray-500 text-gray-300">Gói hiện tại</span>
                </div>
                <p className="text-[#a3a3a3] text-sm mb-12">Tốt nhất cho những ai muốn dùng thử nghiệm ứng dụng AI</p>

                <div className="mt-auto">
                  <p className="font-medium text-[15px] mb-4 pb-4 border-b border-[#333333]">Miễn phí, nhưng giới hạn tính năng</p>
                  
                  <ul className="space-y-4 text-sm text-[#d4d4d4]">
                    <li className="flex items-start gap-3 opacity-80">
                      <X className="w-4 h-4 text-gray-500 shrink-0 mt-0.5" />
                      <span>Không thể tải ảnh chất lượng siêu cao (HD)</span>
                    </li>
                    <li className="flex items-start gap-3">
                      <Check className="w-4 h-4 text-gray-300 shrink-0 mt-0.5" />
                      <span>3 lượt thử đồ AI mỗi ngày</span>
                    </li>
                    <li className="flex items-start gap-3">
                      <Check className="w-4 h-4 text-gray-300 shrink-0 mt-0.5" />
                      <span>Tải lên tối đa 1 người mẫu cá nhân</span>
                    </li>
                  </ul>
                </div>
              </div>

              {/* Right Column: Professional */}
              <div className="flex flex-col">
                <h3 className="text-2xl font-bold mb-2">Professional</h3>
                <p className="text-[#a3a3a3] text-sm mb-8">Tốt nhất cho nhà sáng tạo và người dùng thường xuyên</p>

                <div className="space-y-4 mb-8">
                  <div className="flex justify-between items-center pb-4 border-b border-[#333333]">
                    <div>
                      <span className="font-medium block mb-2 text-[15px]">Full</span>
                      <div className="flex items-center gap-1.5">
                        <div className="bg-[#8b5cf6] p-1 rounded-sm"><MonitorPlay className="w-3 h-3 text-white" /></div>
                        <div className="bg-[#f97316] p-1 rounded-sm"><Box className="w-3 h-3 text-white" /></div>
                        <div className="bg-[#22c55e] p-1 rounded-sm"><Code className="w-3 h-3 text-white" /></div>
                        <div className="bg-[#a855f7] p-1 rounded-sm"><Layers className="w-3 h-3 text-white" /></div>
                        <div className="bg-[#3b82f6] p-1 rounded-sm"><Globe className="w-3 h-3 text-white" /></div>
                        <div className="bg-[#0ea5e9] p-1 rounded-sm"><Users2 className="w-3 h-3 text-white" /></div>
                      </div>
                    </div>
                    <span className="font-bold text-lg">199.000đ<span className="text-[#a3a3a3] text-sm font-normal">/tháng</span></span>
                  </div>

                  <div className="flex justify-between items-center pb-4 border-b border-[#333333]">
                    <div>
                      <span className="font-medium block mb-2 text-[15px]">Dev</span>
                      <div className="flex items-center gap-1.5">
                        <div className="bg-[#8b5cf6] p-1 rounded-sm"><MonitorPlay className="w-3 h-3 text-white" /></div>
                        <div className="bg-[#f97316] p-1 rounded-sm"><Box className="w-3 h-3 text-white" /></div>
                        <div className="bg-[#22c55e] p-1 rounded-sm"><Code className="w-3 h-3 text-white" /></div>
                        <div className="bg-[#a855f7] p-1 rounded-sm"><Layers className="w-3 h-3 text-white" /></div>
                      </div>
                    </div>
                    <span className="font-bold text-lg">149.000đ<span className="text-[#a3a3a3] text-sm font-normal">/tháng</span></span>
                  </div>

                  <div className="flex justify-between items-center pb-4 border-b border-[#333333]">
                    <div>
                      <span className="font-medium block mb-2 text-[15px]">Collab</span>
                      <div className="flex items-center gap-1.5">
                        <div className="bg-[#8b5cf6] p-1 rounded-sm"><MonitorPlay className="w-3 h-3 text-white" /></div>
                        <div className="bg-[#f97316] p-1 rounded-sm"><Box className="w-3 h-3 text-white" /></div>
                      </div>
                    </div>
                    <span className="font-bold text-lg">49.000đ<span className="text-[#a3a3a3] text-sm font-normal">/tháng</span></span>
                  </div>
                </div>

                <ul className="space-y-4 text-sm text-[#d4d4d4] mb-6">
                  <li className="flex items-start gap-3">
                    <Check className="w-4 h-4 text-white shrink-0 mt-0.5" />
                    <span className="font-medium text-white">Lưu và tải hình ảnh độ phân giải siêu cao (HD)</span>
                  </li>
                  <li className="flex items-start gap-3">
                    <Check className="w-4 h-4 text-white shrink-0 mt-0.5" />
                    <span className="font-medium text-white">Không giới hạn số lượt tạo ảnh và thử đồ AI</span>
                  </li>
                  <li className="flex items-start gap-3">
                    <Check className="w-4 h-4 text-white shrink-0 mt-0.5" />
                    <span className="font-medium text-white">Quản lý không giới hạn người mẫu cá nhân</span>
                  </li>
                </ul>

                <button className="text-blue-400 hover:text-blue-300 text-sm font-medium flex items-center gap-1 mb-8 w-fit transition-colors">
                  Xem tất cả tính năng <ArrowRight className="w-3.5 h-3.5" />
                </button>

                <button className="w-full bg-white hover:bg-gray-100 text-black font-semibold py-3 rounded-lg transition-colors mt-auto">
                  Nâng cấp lên Professional
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    )}
  </div>
  );
}
