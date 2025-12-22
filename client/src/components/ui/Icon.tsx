/**
 * Icon Library - Single Source of Truth
 * 
 * This file re-exports commonly used icons from lucide-react for consistency.
 * Lucide provides a clean, consistent design system with excellent tree-shaking.
 * 
 * Usage:
 * import { Icon } from '../components/ui';
 * <Icon.Settings size={24} />
 */

// Import from Lucide React
import {
  Settings,
  QrCode,
  Rocket,
  Images,
  CreditCard,
  CheckCircle2,
  BarChart3,
  LogOut,
  Users,
  X,
  Trash2,
  Upload,
  Plus,
  Minus,
  Check,
  ArrowRight,
  ArrowLeft,
  RefreshCw,
  Info,
  AlertTriangle,
  Home,
  Play,
  Pause,
  Star,
  Heart,
  Eye,
  EyeOff,
  Menu,
  Search,
  Filter,
  Download,
  Share2,
  Copy,
  Camera,
  Image,
  Crown,
  Trophy,
  Sparkles,
  GalleryHorizontalEnd,
} from "lucide-react";

/**
 * Icon namespace for organized access
 * 
 * Categories:
 * - Navigation: Settings, Home, Menu
 * - Actions: Play, Pause, Refresh, Add, Remove
 * - Game: Card, Images, Vote, Results, Star, Trophy
 * - Social: People, Share, Heart
 * - Utility: QR, Close, Trash, Upload, Download
 * - Feedback: Info, Warning, Checkmark
 * - Media: Camera, Image, Eye
 * - Special: Crown, Sparkles
 */
export const Icon = {
  // Navigation & UI
  Settings,
  Home,
  Menu,
  ArrowForward: ArrowRight,
  ArrowBack: ArrowLeft,
  Close: X,
  
  // Game Actions
  Rocket,
  Play,
  Pause,
  Refresh: RefreshCw,
  
  // Cards & Content
  Card: CreditCard,
  Cards: GalleryHorizontalEnd,
  Images,
  Image,
  Camera,
  
  // Voting & Scoring
  Vote: CheckCircle2,
  Checkmark: Check,
  Results: BarChart3,
  Star,
  Heart,
  Trophy,
  Crown,
  Sparkles,
  
  // Social & Players
  People: Users,
  Share: Share2,
  
  // Utilities
  QRCode: QrCode,
  Logout: LogOut,
  Trash: Trash2,
  Upload,
  Download,
  Copy,
  Add: Plus,
  Remove: Minus,
  Search,
  Filter,
  
  // Visibility & Info
  Eye,
  EyeOff,
  Info,
  Warning: AlertTriangle,
};

/**
 * Common icon sizes for consistency
 */
export const IconSize = {
  small: 16,
  medium: 20,
  large: 24,
  xlarge: 32,
  xxlarge: 48,
} as const;

/**
 * Default icon props for accessibility and consistency
 * Lucide icons are inline by default and scale with font-size
 */
export const defaultIconProps = {
  strokeWidth: 2,
  "aria-hidden": "true" as const,
};
