"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import NoteList from "@/components/note-list";
import { Sidebar } from "@/components/sidebar";

export default function FavouritesPage() {
  const [notes, setNotes] = useState([]);
  const router = useRouter();

  //   useEffect(() => {
  //     const token = localStorage.getItem("token");
  //     if (!token) {
  //       router.push("/");
  //       return;
  //     }
  //     fetchFavouriteNotes();
  //   }, [router]);

  //   const fetchFavouriteNotes = async () => {
  //     const token = localStorage.getItem("token");
  //     const response = await fetch("/api/notes/favourites", {
  //       headers: {
  //         Authorization: `Bearer ${token}`,
  //       },
  //     });
  //     if (response.ok) {
  //       const data = await response.json();
  //       setNotes(data);
  //     }
  //   };

  useEffect(() => {
    const token = localStorage.getItem("token");
    if (token) {
      //   setIsLoggedIn(true)
      fetchNotes();
    }
  }, []);

  const fetchNotes = async () => {
    const token = localStorage.getItem("token");
    const response = await fetch("/api/notes", {
      headers: {
        Authorization: `Bearer ${token}`,
      },
    });
    if (response.ok) {
      const data = await response.json();
      setNotes(data);
    }
  };

  const handleLogout = () => {
    localStorage.removeItem("token");
    router.push("/");
  };

  return (
    <div className="flex h-screen">
      <Sidebar onLogout={handleLogout} />
      <main className="flex-1 overflow-auto">
        <NoteList notes={notes} onUpdate={fetchNotes} />
      </main>
    </div>
  );
}
