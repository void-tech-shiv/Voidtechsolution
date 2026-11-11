import * as React from "react";
import {
  Globe,
  Smartphone,
  Code2,
  Cpu,
  Bot,
  Send,
  MessageSquare,
  PlaySquare,
  Palette,
  ImageIcon,
  Cloud,
  ShoppingCart,
  Layers,
  GraduationCap,
  Store,
  Database,
  CreditCard,
  Wrench,
  Sparkles,
} from "lucide-react";

interface ServiceIconProps {
  name: string;
  className?: string;
}

export function ServiceIcon({ name, className = "h-5 w-5" }: ServiceIconProps) {
  switch (name) {
    case "Globe":
      return <Globe className={className} aria-hidden="true" />;
    case "Smartphone":
      return <Smartphone className={className} aria-hidden="true" />;
    case "Code":
    case "Code2":
      return <Code2 className={className} aria-hidden="true" />;
    case "Cpu":
      return <Cpu className={className} aria-hidden="true" />;
    case "Bot":
      return <Bot className={className} aria-hidden="true" />;
    case "Send":
      return <Send className={className} aria-hidden="true" />;
    case "MessageSquare":
      return <MessageSquare className={className} aria-hidden="true" />;
    case "Video":
    case "Play":
    case "PlaySquare":
      return <PlaySquare className={className} aria-hidden="true" />;
    case "Palette":
      return <Palette className={className} aria-hidden="true" />;
    case "Image":
      return <ImageIcon className={className} aria-hidden="true" />;
    case "Cloud":
    case "Server":
      return <Cloud className={className} aria-hidden="true" />;
    case "ShoppingCart":
      return <ShoppingCart className={className} aria-hidden="true" />;
    case "Layers":
      return <Layers className={className} aria-hidden="true" />;
    case "GraduationCap":
      return <GraduationCap className={className} aria-hidden="true" />;
    case "Store":
      return <Store className={className} aria-hidden="true" />;
    case "Database":
      return <Database className={className} aria-hidden="true" />;
    case "CreditCard":
      return <CreditCard className={className} aria-hidden="true" />;
    case "Wrench":
    case "Terminal":
      return <Wrench className={className} aria-hidden="true" />;
    default:
      return <Sparkles className={className} aria-hidden="true" />;
  }
}
