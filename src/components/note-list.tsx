"use client";

import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Copy,
  Trash2,
  Play,
  Search,
  SortDesc,
  ImageIcon,
  Text,
  Heart,
} from "lucide-react";
import NoteModal from "./note-modal";
import { toast } from "@/hooks/use-toast";

interface Note {
  _id: string;
  title: string;
  content: string;
  isAudio: boolean;
  isFavorite: boolean;
  audioUrl?: string;
  duration?: string;
  createdAt: string;
  images?: { url: string; caption: string }[];
}

interface NoteListProps {
  notes: Note[];
  onUpdate: () => void;
}

export default function NoteList({ notes, onUpdate }: NoteListProps) {
  const [selectedNote, setSelectedNote] = useState<Note | null>(null);
  const [searchTerm, setSearchTerm] = useState("");
  const [sortDirection, setSortDirection] = useState<"asc" | "desc">("desc");

  const handleToggleFavorite = async (e: React.MouseEvent, note: Note) => {
    e.stopPropagation();
    try {
      const token = localStorage.getItem("token");
      const formData = new FormData();
      formData.append("isFavorite", (!note.isFavorite).toString());

      const response = await fetch(`/api/notes/${note._id}`, {
        method: "PATCH",
        headers: {
          Authorization: `Bearer ${token}`,
        },
        body: formData,
      });

      if (!response.ok) throw new Error();

      onUpdate();
      toast({
        title: !note.isFavorite ? "Added to favorites" : "Removed from favorites",
      });
    } catch (error) {
      console.log(error);
      toast({
        title: "Failed to update favorite status",
        variant: "destructive",
      });
    }
  };

  const handleCopy = async (e: React.MouseEvent, content: string) => {
    e.stopPropagation();
    try {
      await navigator.clipboard.writeText(content);
      toast({ title: "Copied to clipboard" });
    } catch {
      toast({
        title: "Failed to copy",
        variant: "destructive",
      });
    }
  };

  const handleDelete = async (e: React.MouseEvent, id: string) => {
    e.stopPropagation();
    if (!window.confirm("Delete this note?")) return;

    try {
      const token = localStorage.getItem("token");
      const response = await fetch(`/api/notes/${id}`, {
        method: "DELETE",
        headers: { Authorization: `Bearer ${token}` },
      });

      if (!response.ok) throw new Error();

      onUpdate();
      toast({ title: "Note deleted" });
    } catch {
      toast({
        title: "Failed to delete note",
        variant: "destructive",
      });
    }
  };

  const filteredAndSortedNotes = notes
    .filter(note =>
      note.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
      note.content.toLowerCase().includes(searchTerm.toLowerCase())
    )
    .sort((a, b) => {
      const dateA = new Date(a.createdAt).getTime();
      const dateB = new Date(b.createdAt).getTime();
      return sortDirection === "asc" ? dateA - dateB : dateB - dateA;
    });

  return (
    <div className="container mx-auto p-4">
      <div className="flex items-center justify-between mb-6 md:mt-0 mt-12">
        <div className="relative flex-1 max-w-md">
          <Search className="absolute left-2 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Search notes..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pl-8"
          />
        </div>
        <Button
          variant="ghost"
          onClick={() => setSortDirection(prev => prev === "asc" ? "desc" : "asc")}
        >
          <SortDesc className="h-4 w-4 mr-2" />
          Sort
        </Button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {filteredAndSortedNotes.map((note) => (
          <Card
            key={note._id}
            className="cursor-pointer hover:shadow-lg transition-shadow"
          >
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">
                {new Date(note.createdAt).toLocaleString()}
              </CardTitle>
              <div className="flex items-center bg-gray-200 rounded-full px-2 py-1 text-sm text-muted-foreground">
                {note.isAudio ? (
                  <>
                    <Play className="h-3 w-3 mr-1" />
                    {note.duration}
                  </>
                ) : (
                  <>
                    <Text className="h-3 w-3 mr-1" />
                    Text
                  </>
                )}
              </div>
            </CardHeader>
            <CardContent onClick={() => setSelectedNote(note)}>
              <h3 className="font-semibold mb-2">{note.title}</h3>
              <p className="text-sm text-muted-foreground line-clamp-3">
                {note.content}
              </p>
              <div className="flex items-center justify-between mt-4">
                {note.images && note.images?.length > 0 && (
                  <div className="flex bg-gray-200 rounded-full px-2 py-1 items-center text-sm text-muted-foreground">
                    <ImageIcon className="h-4 w-4 mr-1" />
                    {note.images.length} {note.images.length === 1 ? "image" : "images"}
                  </div>
                )}
                <div className="flex items-center gap-2 ml-auto">
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={(e) => handleToggleFavorite(e, note)}
                  >
                    <Heart 
                      className={`h-4 w-4 ${note.isFavorite ? "fill-current text-red-500" : ""}`}
                    />
                  </Button>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={(e) => handleCopy(e, note.content)}
                  >
                    <Copy className="h-4 w-4" />
                  </Button>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={(e) => handleDelete(e, note._id)}
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {selectedNote && (
        <NoteModal
          note={selectedNote}
          onClose={() => setSelectedNote(null)}
          onUpdate={onUpdate}
        />
      )}
    </div>
  );
}