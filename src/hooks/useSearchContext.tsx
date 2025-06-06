import React, { createContext, useContext, useRef, ReactNode } from 'react';

interface SearchContextType {
  searchInputRef: React.RefObject<HTMLInputElement | null>;
  focusSearch: () => void;
}

const SearchContext = createContext<SearchContextType | undefined>(undefined);

interface SearchProviderProps {
  children: ReactNode;
}

export function SearchProvider({ children }: SearchProviderProps) {
  const searchInputRef = useRef<HTMLInputElement | null>(null);

  const focusSearch = () => {
    if (searchInputRef.current) {
      searchInputRef.current.focus();
      // Select all text for easy replacement
      searchInputRef.current.select();
    }
  };

  return (
    <SearchContext.Provider value={{ searchInputRef, focusSearch }}>
      {children}
    </SearchContext.Provider>
  );
}

export function useSearchContext() {
  const context = useContext(SearchContext);
  if (context === undefined) {
    throw new Error('useSearchContext must be used within a SearchProvider');
  }
  return context;
} 