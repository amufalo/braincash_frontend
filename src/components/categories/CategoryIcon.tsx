import {
  Tags,
  UtensilsCrossed,
  Bus,
  Home,
  Stethoscope,
  BookOpen,
  Gamepad2,
  ShoppingBag,
  Wrench,
  Cat,
  ShoppingCart,
  Utensils,
  Bike,
  Zap,
  Wifi,
  Shirt,
  Plane,
  Gift,
  FileText,
  MoreHorizontal,
  Wallet,
  User,
  TrendingUp,
  Award,
  RotateCcw,
  Building2,
  ArrowLeftRight,
  type LucideIcon,
} from "lucide-react";

const RI_TO_LUCIDE: Record<string, LucideIcon> = {
  RiRestaurant2Line: UtensilsCrossed,
  RiBusLine: Bus,
  RiHomeLine: Home,
  RiStethoscopeLine: Stethoscope,
  RiBook2Line: BookOpen,
  RiGamepadLine: Gamepad2,
  RiShoppingBagLine: ShoppingBag,
  RiServiceLine: Wrench,
  RiBearSmileLine: Cat,
  RiShoppingBasketLine: ShoppingCart,
  RiRestaurantLine: Utensils,
  RiMotorbikeLine: Bike,
  RiFlashlightLine: Zap,
  RiWifiLine: Wifi,
  RiTShirtLine: Shirt,
  RiFlightTakeoffLine: Plane,
  RiGiftLine: Gift,
  RiBillLine: FileText,
  RiMore2Line: MoreHorizontal,
  RiWallet3Line: Wallet,
  RiWallet2Line: Wallet,
  RiUserStarLine: User,
  RiStockLine: TrendingUp,
  RiShoppingCartLine: ShoppingCart,
  RiMedalLine: Award,
  RiRefundLine: RotateCcw,
  RiBuilding2Line: Building2,
  RiArrowLeftRightLine: ArrowLeftRight,
};

export interface CategoryIconProps {
  icon?: string | null;
  color?: string | null;
  className?: string;
}

export function CategoryIcon({ icon, color, className = "h-4 w-4" }: CategoryIconProps) {
  const IconComponent = icon ? RI_TO_LUCIDE[icon] ?? Tags : Tags;
  return (
    <IconComponent
      className={className}
      style={color ? { color } : undefined}
    />
  );
}
