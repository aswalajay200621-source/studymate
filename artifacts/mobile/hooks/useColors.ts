import colors from "@/constants/colors";
import { useApp } from "@/context/AppContext";

export function useColors() {
  const { isDark } = useApp();
  const palette = isDark ? colors.dark : colors.light;
  return { ...palette, radius: colors.radius };
}
