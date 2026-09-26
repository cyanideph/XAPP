import type { LucideIcon } from 'lucide-react-native';
import {
  AlertCircle,
  Bell,
  Camera,
  Check,
  ChevronLeft,
  ChevronRight,
  Circle,
  CircleDot,
  Eye,
  EyeOff,
  Globe,
  Home,
  Image as ImageIcon,
  LoaderCircle,
  Lock,
  LogIn,
  LogOut,
  Mail,
  Map,
  MapPin,
  Menu,
  MessageCircle,
  Mic,
  MoreHorizontal,
  MoreVertical,
  Paperclip,
  Pencil,
  Plus,
  RefreshCw,
  Search,
  Send,
  Settings,
  Shield,
  Smile,
  Trash2,
  User,
  UserCheck,
  UserPlus,
  UserX,
  Users,
  X,
} from 'lucide-react-native';

export const XAPP_ICON_NAMES = {
  alert: AlertCircle,
  bell: Bell,
  camera: Camera,
  check: Check,
  chevronLeft: ChevronLeft,
  chevronRight: ChevronRight,
  circle: Circle,
  circleDot: CircleDot,
  eye: Eye,
  eyeOff: EyeOff,
  globe: Globe,
  home: Home,
  image: ImageIcon,
  loading: LoaderCircle,
  lock: Lock,
  login: LogIn,
  logout: LogOut,
  mail: Mail,
  map: Map,
  mapPin: MapPin,
  menu: Menu,
  message: MessageCircle,
  mic: Mic,
  moreHorizontal: MoreHorizontal,
  moreVertical: MoreVertical,
  paperclip: Paperclip,
  pencil: Pencil,
  plus: Plus,
  refresh: RefreshCw,
  search: Search,
  send: Send,
  settings: Settings,
  shield: Shield,
  smile: Smile,
  trash: Trash2,
  user: User,
  userCheck: UserCheck,
  userPlus: UserPlus,
  userX: UserX,
  users: Users,
  close: X,
} as const;

export type XAPPIconName = keyof typeof XAPP_ICON_NAMES;

export type XAPPIconProps = {
  name: XAPPIconName;
  size?: number;
  color?: string;
  strokeWidth?: number;
  accessibilityLabel?: string;
};

export function XIcon({
  name,
  size = 22,
  color = '#FFFFFF',
  strokeWidth = 2.25,
  accessibilityLabel,
}: XAPPIconProps) {
  const Icon = XAPP_ICON_NAMES[name] as LucideIcon;

  return (
    <Icon
      size={size}
      color={color}
      strokeWidth={strokeWidth}
      accessibilityLabel={accessibilityLabel ?? name}
      accessibilityRole="image"
    />
  );
}
