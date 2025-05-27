import React, { createContext, useContext, useState, useEffect } from "react";
import i18n from "../translations/i18n";

type LanguageContextType = {
  language: string;
  switchLanguage: (lang: string) => void;
};

const LanguageContext = createContext<LanguageContextType>({
  language: i18n.locale,
  switchLanguage: () => {},
});

export const LanguageProvider = ({
  children,
}: {
  children: React.ReactNode;
}) => {
  const [language, setLanguage] = useState(i18n.locale);

  const switchLanguage = (lang: string) => {
    i18n.locale = lang;
    setLanguage(lang);
  };

  return (
    <LanguageContext.Provider value={{ language, switchLanguage }}>
      {children}
    </LanguageContext.Provider>
  );
};

export const useLanguage = () => useContext(LanguageContext);
