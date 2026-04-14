import { useAppStore } from "../store/useAppStore";
import translations, { type TranslationKey } from "../i18n/translations";

export const useT = () => {
  const language = useAppStore((state) => state.language);
  const t = (key: TranslationKey): string => {
    return translations[language][key] || key;
  };
  return t;
};