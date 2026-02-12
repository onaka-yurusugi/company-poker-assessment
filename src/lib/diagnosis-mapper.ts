import type { PokerStyle, PokerStats } from "@/types";
import { VPIP_THRESHOLD, AF_THRESHOLD, BUSINESS_TYPE_MAP } from "@/constants/diagnosis";

export const determinePokerStyle = (stats: PokerStats): PokerStyle => {
  const isLoose = stats.vpip >= VPIP_THRESHOLD;
  const isAggressive = stats.aggressionFactor >= AF_THRESHOLD;

  if (isLoose && isAggressive) return "loose-aggressive";
  if (!isLoose && isAggressive) return "tight-aggressive";
  if (isLoose && !isAggressive) return "loose-passive";
  return "tight-passive";
};

export const getBusinessType = (style: PokerStyle): { readonly name: string; readonly description: string } =>
  BUSINESS_TYPE_MAP[style];
