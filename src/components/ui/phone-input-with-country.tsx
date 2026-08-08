import * as React from "react";
import { useState, useEffect, useMemo } from "react";
import { ChevronDown, Search, Check } from "lucide-react";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { normalizePhoneDigits } from "@/lib/site-config";
import { cn } from "@/lib/utils";

export interface Country {
  code: string;
  nameAr: string;
  nameEn: string;
  dialCode: string;
  flag: string;
}

export const COUNTRIES: Country[] = [
  { code: "IQ", nameAr: "العراق", nameEn: "Iraq", dialCode: "+964", flag: "🇮🇶" },
  { code: "SA", nameAr: "السعودية", nameEn: "Saudi Arabia", dialCode: "+966", flag: "🇸🇦" },
  { code: "AE", nameAr: "الإمارات", nameEn: "UAE", dialCode: "+971", flag: "🇦🇪" },
  { code: "KW", nameAr: "الكويت", nameEn: "Kuwait", dialCode: "+965", flag: "🇰🇼" },
  { code: "QA", nameAr: "قطر", nameEn: "Qatar", dialCode: "+974", flag: "🇶🇦" },
  { code: "OM", nameAr: "عُمان", nameEn: "Oman", dialCode: "+968", flag: "🇴🇲" },
  { code: "BH", nameAr: "البحرين", nameEn: "Bahrain", dialCode: "+973", flag: "🇧🇭" },
  { code: "JO", nameAr: "الأردن", nameEn: "Jordan", dialCode: "+962", flag: "🇯🇴" },
  { code: "LB", nameAr: "لبنان", nameEn: "Lebanon", dialCode: "+961", flag: "🇱🇧" },
  { code: "SY", nameAr: "سوريا", nameEn: "Syria", dialCode: "+963", flag: "🇸🇾" },
  { code: "EG", nameAr: "مصر", nameEn: "Egypt", dialCode: "+20", flag: "🇪🇬" },
  { code: "TR", nameAr: "تركيا", nameEn: "Turkey", dialCode: "+90", flag: "🇹🇷" },
  { code: "GB", nameAr: "المملكة المتحدة", nameEn: "United Kingdom", dialCode: "+44", flag: "🇬🇧" },
  { code: "US", nameAr: "أمريكا / كندا", nameEn: "US / Canada", dialCode: "+1", flag: "🇺🇸" },
  { code: "DE", nameAr: "ألمانيا", nameEn: "Germany", dialCode: "+49", flag: "🇩🇪" },
  { code: "FR", nameAr: "فرنسا", nameEn: "France", dialCode: "+33", flag: "🇫🇷" },
  { code: "SE", nameAr: "السويد", nameEn: "Sweden", dialCode: "+46", flag: "🇸🇪" },
  { code: "NL", nameAr: "هولندا", nameEn: "Netherlands", dialCode: "+31", flag: "🇳🇱" },
];

export interface PhoneInputWithCountryProps {
  value: string;
  onChange: (fullPhone: string) => void;
  placeholder?: string;
  className?: string;
  lang?: "ar" | "en";
  disabled?: boolean;
}

// Parse value into country and local digits
function parsePhone(value: string): { country: Country; localNumber: string } {
  const normalized = normalizePhoneDigits(value || "").trim();
  if (!normalized) {
    return { country: COUNTRIES[0], localNumber: "" };
  }

  if (normalized.startsWith("+")) {
    // Sort countries by dialCode length descending (+964 before +9)
    const sorted = [...COUNTRIES].sort((a, b) => b.dialCode.length - a.dialCode.length);
    const found = sorted.find((c) => normalized.startsWith(c.dialCode));
    if (found) {
      return { country: found, localNumber: normalized.slice(found.dialCode.length) };
    }
  }

  // If starts with 00 (e.g. 0096477...)
  if (normalized.startsWith("00")) {
    const withPlus = "+" + normalized.slice(2);
    const sorted = [...COUNTRIES].sort((a, b) => b.dialCode.length - a.dialCode.length);
    const found = sorted.find((c) => withPlus.startsWith(c.dialCode));
    if (found) {
      return { country: found, localNumber: withPlus.slice(found.dialCode.length) };
    }
  }

  // Default to Iraq if no prefix or if starts with local digit
  let digitsOnly = normalized.replace(/[^0-9]/g, "");
  if (digitsOnly.startsWith("0")) {
    digitsOnly = digitsOnly.slice(1);
  }
  return { country: COUNTRIES[0], localNumber: digitsOnly };
}

export function PhoneInputWithCountry({
  value,
  onChange,
  placeholder,
  className,
  lang = "ar",
  disabled = false,
}: PhoneInputWithCountryProps) {
  const [open, setOpen] = useState(false);
  const [search, setSearch] = useState("");

  const parsed = useMemo(() => parsePhone(value), [value]);
  const [selectedCountry, setSelectedCountry] = useState<Country>(parsed.country);
  const [localNumber, setLocalNumber] = useState<string>(parsed.localNumber);

  // Sync internal state when external value changes drastically
  useEffect(() => {
    const p = parsePhone(value);
    setSelectedCountry(p.country);
    setLocalNumber(p.localNumber);
  }, [value]);

  // Helper to format full number and emit onChange
  const emitChange = (country: Country, rawLocal: string) => {
    let cleanLocal = normalizePhoneDigits(rawLocal).replace(/[^0-9]/g, "");
    // Remove leading zero if user typed e.g. 0770...
    if (cleanLocal.startsWith("0")) {
      cleanLocal = cleanLocal.slice(1);
    }
    if (!cleanLocal) {
      onChange("");
    } else {
      onChange(`${country.dialCode}${cleanLocal}`);
    }
  };

  const handleCountrySelect = (country: Country) => {
    setSelectedCountry(country);
    setOpen(false);
    emitChange(country, localNumber);
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const val = normalizePhoneDigits(e.target.value);
    // Allow digits, spaces, hyphens
    const cleaned = val.replace(/[^0-9\s-]/g, "");
    setLocalNumber(cleaned);
    emitChange(selectedCountry, cleaned);
  };

  const filteredCountries = useMemo(() => {
    if (!search.trim()) return COUNTRIES;
    const q = search.toLowerCase().trim();
    return COUNTRIES.filter(
      (c) =>
        c.nameAr.includes(q) ||
        c.nameEn.toLowerCase().includes(q) ||
        c.dialCode.includes(q) ||
        c.code.toLowerCase().includes(q)
    );
  }, [search]);

  const defaultPlaceholder =
    lang === "ar" ? "770 123 4567 (رقم الهاتف)" : "770 123 4567 (Phone number)";

  return (
    <div className={cn("relative flex items-stretch w-full border border-border bg-background transition-colors focus-within:border-primary", className)}>
      {/* Country Selector Button */}
      <Popover open={open} onOpenChange={setOpen}>
        <PopoverTrigger asChild disabled={disabled}>
          <button
            type="button"
            className="flex items-center gap-1.5 px-3 py-3 border-e border-border bg-card/50 hover:bg-card text-foreground transition-colors select-none text-sm font-medium focus:outline-none"
            title={lang === "ar" ? "اختر الدولة" : "Select Country"}
          >
            <span className="text-lg leading-none">{selectedCountry.flag}</span>
            <span className="text-xs font-mono font-bold dir-ltr">{selectedCountry.dialCode}</span>
            <ChevronDown className="h-3.5 w-3.5 opacity-60" />
          </button>
        </PopoverTrigger>
        <PopoverContent
          align={lang === "ar" ? "end" : "start"}
          className="w-72 p-0 bg-background border-border shadow-xl z-50 text-foreground"
        >
          {/* Search Box */}
          <div className="flex items-center gap-2 p-2.5 border-b border-border bg-card/40">
            <Search className="h-4 w-4 text-muted-foreground" />
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder={lang === "ar" ? "ابحث عن دولة أو رمز…" : "Search country or code…"}
              className="w-full bg-transparent text-xs focus:outline-none text-foreground placeholder:text-muted-foreground"
            />
          </div>

          {/* Country List */}
          <div className="max-h-60 overflow-y-auto p-1 divide-y divide-border/20">
            {filteredCountries.length === 0 ? (
              <div className="p-3 text-center text-xs text-muted-foreground">
                {lang === "ar" ? "لا توجد نتائج" : "No countries found"}
              </div>
            ) : (
              filteredCountries.map((c) => {
                const isSelected = c.code === selectedCountry.code;
                return (
                  <button
                    key={c.code}
                    type="button"
                    onClick={() => handleCountrySelect(c)}
                    className={cn(
                      "w-full flex items-center justify-between px-3 py-2 text-xs rounded transition-colors text-start",
                      isSelected
                        ? "bg-primary/10 text-primary font-medium"
                        : "hover:bg-card/80 text-foreground"
                    )}
                  >
                    <div className="flex items-center gap-2.5">
                      <span className="text-base leading-none">{c.flag}</span>
                      <span>{lang === "ar" ? c.nameAr : c.nameEn}</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <span className="font-mono text-[11px] text-muted-foreground dir-ltr">{c.dialCode}</span>
                      {isSelected && <Check className="h-3.5 w-3.5 text-primary" />}
                    </div>
                  </button>
                );
              })
            )}
          </div>
        </PopoverContent>
      </Popover>

      {/* Phone Number Input */}
      <input
        type="tel"
        disabled={disabled}
        value={localNumber}
        onChange={handleInputChange}
        placeholder={placeholder || defaultPlaceholder}
        className="w-full bg-transparent px-3 py-3 text-sm focus:outline-none dir-ltr text-start placeholder:dir-rtl placeholder:text-end text-foreground placeholder:text-muted-foreground"
      />
    </div>
  );
}
