import {
    Activity,
    Airplay,
    Baby,
    Beer,
    Bike,
    Book,
    Briefcase,
    Camera,
    Car,
    Coffee,
    CreditCard,
    Dumbbell,
    FileText,
    Film,
    Gamepad2,
    Gift,
    GraduationCap,
    Heart,
    Home,
    Layers,
    MapPin,
    Music,
    PawPrint,
    PiggyBank,
    Plane,
    ShoppingBag,
    Smartphone,
    Stethoscope,
    Trees,
    Tv,
    Utensils,
    Wallet,
    Wifi,
    Wine,
    Zap,
} from "lucide-react-native";

export const CATEGORY_ICONS = [
  { name: "utensils", icon: Utensils },
  { name: "shopping-bag", icon: ShoppingBag },
  { name: "home", icon: Home },
  { name: "car", icon: Car },
  { name: "plane", icon: Plane },
  { name: "film", icon: Film },
  { name: "gamepad-2", icon: Gamepad2 },
  { name: "music", icon: Music },
  { name: "camera", icon: Camera },
  { name: "map-pin", icon: MapPin },
  { name: "briefcase", icon: Briefcase },
  { name: "coffee", icon: Coffee },
  { name: "beer", icon: Beer },
  { name: "wine", icon: Wine },
  { name: "dumbbell", icon: Dumbbell },
  { name: "heart", icon: Heart },
  { name: "stethoscope", icon: Stethoscope },
  { name: "graduation-cap", icon: GraduationCap },
  { name: "book", icon: Book },
  { name: "file-text", icon: FileText },
  { name: "credit-card", icon: CreditCard },
  { name: "wallet", icon: Wallet },
  { name: "piggy-bank", icon: PiggyBank },
  { name: "gift", icon: Gift },
  { name: "paw-print", icon: PawPrint },
  { name: "baby", icon: Baby },
  { name: "smartphone", icon: Smartphone },
  { name: "tv", icon: Tv },
  { name: "wifi", icon: Wifi },
  { name: "zap", icon: Zap },
  { name: "activity", icon: Activity },
  { name: "bike", icon: Bike },
  { name: "trees", icon: Trees },
  { name: "airplay", icon: Airplay },
  { name: "layers", icon: Layers },
];

export const ICON_MAP: Record<string, any> = CATEGORY_ICONS.reduce((acc, item) => {
  acc[item.name] = item.icon;
  return acc;
}, {} as Record<string, any>);

export const CATEGORY_COLORS = [
  "#FF6B6B", // Red
  "#FF9F43", // Orange
  "#F1C40F", // Yellow
  "#2ECC71", // Green
  "#1ABC9C", // Turquoise
  "#3498DB", // Blue
  "#9B59B6", // Purple
  "#E84393", // Pink
  "#2D3436", // Dark Gray
  "#636E72", // Gray
  "#A29BFE", // Lavender
  "#FAB1A0", // Peach
  "#00B894", // Mint
  "#00CEC9", // Cyan
  "#0984E3", // Royal Blue
  "#6C5CE7", // Indigo
  "#D63031", // Crimson
  "#E17055", // Terra Cotta
  "#FDCB6E", // Marigold
  "#55E6C1", // Seafoam
  "#7ED6DF", // Middle Blue
  "#E056FD", // Heliotrope
  "#686DE0", // Excalibur
  "#30336B", // Deep Cove
];
