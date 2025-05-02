
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useTranslation } from 'react-i18next';
import { useState, useEffect } from 'react';

const LanguageSwitcher = () => {
  const { i18n } = useTranslation();
  const [currentLanguage, setCurrentLanguage] = useState(i18n.language);

  useEffect(() => {
    // Sync the component state with i18n's language
    setCurrentLanguage(i18n.language);
  }, [i18n.language]);

  const languages = [
    { code: 'en', name: 'English' },
    { code: 'hi', name: 'हिंदी' },
    { code: 'kn', name: 'ಕನ್ನಡ' }
  ];

  const handleLanguageChange = (langCode: string) => {
    // We'll use localStorage to persist language preference
    localStorage.setItem('i18nextLng', langCode);
    
    // Change the language without affecting auth state
    i18n.changeLanguage(langCode)
      .then(() => {
        setCurrentLanguage(langCode);
      })
      .catch(err => {
        console.error('Failed to change language:', err);
      });
  };

  return (
    <Select value={currentLanguage} onValueChange={handleLanguageChange}>
      <SelectTrigger className="w-[140px]">
        <SelectValue />
      </SelectTrigger>
      <SelectContent>
        {languages.map((lang) => (
          <SelectItem key={lang.code} value={lang.code}>
            {lang.name}
          </SelectItem>
        ))}
      </SelectContent>
    </Select>
  );
};

export default LanguageSwitcher;
