"use client"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import AuthForm from "@/components/auth-form"
import SearchBar from "@/components/search-bar"
import NoteList from "@/components/note-list"
import NoteCreation from "@/components/note-creation"

export default function Home() {
  const [isLoggedIn, setIsLoggedIn] = useState(false)
  const [notes, setNotes] = useState([])
  const [searchTerm, setSearchTerm] = useState("")
  const router = useRouter()

  useEffect(() => {
    const token = localStorage.getItem("token")
    if (token) {
      setIsLoggedIn(true)
      fetchNotes()
    }
  }, [])

  const fetchNotes = async () => {
    const token = localStorage.getItem("token")
    const response = await fetch("/api/notes", {
      headers: {
        Authorization: `Bearer ${token}`,
      },
    })
    if (response.ok) {
      const data = await response.json()
      setNotes(data)
    }
  }

  const handleLogin = (token: string) => {
    localStorage.setItem("token", token)
    setIsLoggedIn(true)
    fetchNotes()
  }

  const handleLogout = () => {
    localStorage.removeItem("token")
    setIsLoggedIn(false)
    setNotes([])
    router.push("/")
  }

  const handleSearch = (term: string) => {
    setSearchTerm(term)
  }

  const filteredNotes = notes.filter(
    (note: any) =>
      note.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
      note.content.toLowerCase().includes(searchTerm.toLowerCase()),
  )

  if (!isLoggedIn) {
    return <AuthForm onLogin={handleLogin} />
  }

  return (
    <div className="container mx-auto px-4 py-8">
      <button onClick={handleLogout} className="mb-4 px-4 py-2 bg-red-500 text-white rounded">
        Logout
      </button>
      <SearchBar onSearch={handleSearch} />
      <NoteList notes={filteredNotes} onUpdate={fetchNotes} />
      <NoteCreation onNoteCreated={fetchNotes} />
    </div>
  )
}

