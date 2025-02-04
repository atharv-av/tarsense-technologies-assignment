"use client"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import AuthForm from "@/components/auth-form"
import NoteList from "@/components/note-list"
import NoteCreation from "@/components/note-creation"
import { Sidebar } from "@/components/sidebar"

export default function Home() {
  const [isLoggedIn, setIsLoggedIn] = useState(false)
  const [notes, setNotes] = useState([])
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

  const handleLogin = (token: string, username: string) => {
    localStorage.setItem("token", token)
    localStorage.setItem("username", username)
    setIsLoggedIn(true)
    fetchNotes()
  }

  const handleLogout = () => {
    localStorage.removeItem("token")
    setIsLoggedIn(false)
    setNotes([])
    router.push("/")
  }

  if (!isLoggedIn) {
    return <AuthForm onLogin={handleLogin} />
  }

  return (
    <div className="flex h-screen">
      <Sidebar onLogout={handleLogout} />
      <main className="flex-1 overflow-auto">
        <NoteList notes={notes} onUpdate={fetchNotes} />
        <NoteCreation onNoteCreated={fetchNotes} />
      </main>
    </div>
  )
}

