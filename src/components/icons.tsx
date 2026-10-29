import { HugeiconsIcon, type HugeiconsIconProps, type IconSvgElement } from '@hugeicons/react';
import {
  Activity01Icon,
  Add01Icon,
  AlertCircleIcon,
  ArrowRight01Icon,
  ArrowUpRight01Icon,
  BoxesIcon,
  ChartLineIcon,
  Clock01Icon,
  Delete01Icon,
  Edit01Icon,
  FlashIcon,
  Layers01Icon,
  LayoutDashboardIcon,
  Menu01Icon,
  PackageIcon,
  RefreshIcon,
  Search01Icon,
  Tick01Icon,
  Wallet01Icon,
  Cancel01Icon,
} from '@hugeicons/core-free-icons';

type Props = Omit<HugeiconsIconProps, 'icon'>;

function createIcon(icon: IconSvgElement) {
  return function Icon({ strokeWidth = 1.8, ...props }: Props) {
    return <HugeiconsIcon icon={icon} strokeWidth={strokeWidth} {...props} />;
  };
}

export const Activity = createIcon(Activity01Icon);
export const ArrowRight = createIcon(ArrowRight01Icon);
export const ArrowUpRight = createIcon(ArrowUpRight01Icon);
export const Boxes = createIcon(BoxesIcon);
export const ChartNoAxesCombined = createIcon(ChartLineIcon);
export const Check = createIcon(Tick01Icon);
export const CircleAlert = createIcon(AlertCircleIcon);
export const Clock3 = createIcon(Clock01Icon);
export const LayoutDashboard = createIcon(LayoutDashboardIcon);
export const Layers3 = createIcon(Layers01Icon);
export const Menu = createIcon(Menu01Icon);
export const Package = createIcon(PackageIcon);
export const Pencil = createIcon(Edit01Icon);
export const Plus = createIcon(Add01Icon);
export const RefreshCw = createIcon(RefreshIcon);
export const Search = createIcon(Search01Icon);
export const Trash2 = createIcon(Delete01Icon);
export const Wallet = createIcon(Wallet01Icon);
export const X = createIcon(Cancel01Icon);
export const Zap = createIcon(FlashIcon);
