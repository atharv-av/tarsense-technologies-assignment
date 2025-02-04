import { Input } from "@/components/ui/input"

interface SearchBarProps {
  onSearch: (term: string) => void
}

export default function SearchBar({ onSearch }: SearchBarProps) {
  return <Input type="text" placeholder="Search notes..." onChange={(e) => onSearch(e.target.value)} className="mb-4 md:mt-0 mt-32" />
}

