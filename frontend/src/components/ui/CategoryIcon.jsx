import {
  Globe, ShoppingBag, Smartphone, Palette, Sparkles, Store, GraduationCap,
  Megaphone, Wrench, MessageCircle, MoreHorizontal, HelpCircle,
} from 'lucide-react';

const MAP = {
  Globe, ShoppingBag, Smartphone, Palette, Sparkles, Store, GraduationCap,
  Megaphone, Wrench, MessageCircle, MoreHorizontal,
};

export default function CategoryIcon({ name, size = 18, className = '' }) {
  const Icon = MAP[name] || HelpCircle;
  return <Icon size={size} className={className} />;
}
