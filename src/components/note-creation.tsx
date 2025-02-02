"use client"

import { useState, useRef } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { Mic, Loader2, Square } from "lucide-react"
import { useAudioRecording } from "@/hooks/use-audio-recording"
import { transcribeAudio } from "@/lib/audio-utils"
import { uploadAudioFile } from "@/lib/file-helpers"

interface NoteCreationProps {
  onNoteCreated: () => void
}

export default function NoteCreation({ onNoteCreated }: NoteCreationProps) {
  const [title, setTitle] = useState("")
  const [content, setContent] = useState("")
  const [isTranscribing, setIsTranscribing] = useState(false)
  
  const {
    isRecording,
    duration,
    audioBlob,
    handleStartRecording,
    handleStopRecording
  } = useAudioRecording()

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    const token = localStorage.getItem("token")
    if (!token) return

    const formData = new FormData()
    formData.append("title", title)
    formData.append("content", content)

    if (audioBlob) {
      try {
        const audioUrl = await uploadAudioFile(audioBlob, token)
        formData.append("audioUrl", audioUrl)
        formData.append("isAudio", "true")
        formData.append("duration", duration)
      } catch (error) {
        console.error("Failed to upload audio:", error)
        return
      }
    }

    try {
      const response = await fetch("/api/notes", {
        method: "POST",
        headers: {
          Authorization: `Bearer ${token}`,
        },
        body: formData,
      })

      if (response.ok) {
        setTitle("")
        setContent("")
        onNoteCreated()
      }
    } catch (error) {
      console.error("Failed to create note:", error)
    }
  }

  const handleRecordingComplete = async () => {
    if (audioBlob) {
      setIsTranscribing(true)
      try {
        await transcribeAudio(audioBlob, setContent, setIsTranscribing)
      } catch (error) {
        console.error("Transcription failed:", error)
        setIsTranscribing(false)
      }
    }
  }

  const handleRecordingStop = async () => {
    await handleStopRecording()
    handleRecordingComplete()
  }

  return (
    <div className="fixed bottom-0 left-0 right-0 bg-background border-t p-4">
      <form onSubmit={handleSubmit} className="max-w-3xl mx-auto flex items-start gap-4">
        <div className="flex-1">
          <Input
            type="text"
            placeholder="Note title"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            required
            className="mb-2"
          />
          <Textarea
            placeholder="Start typing or record audio..."
            value={content}
            onChange={(e) => setContent(e.target.value)}
            required
            className="min-h-[100px]"
          />
        </div>
        <div className="flex flex-col gap-2">
          <Button
            type="button"
            size="icon"
            variant={isRecording ? "destructive" : "secondary"}
            onClick={isRecording ? handleRecordingStop : handleStartRecording}
            disabled={isTranscribing}
          >
            {isTranscribing ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : isRecording ? (
              <Square className="h-4 w-4" />
            ) : (
              <Mic className="h-4 w-4" />
            )}
          </Button>
          <Button type="submit" disabled={isRecording || isTranscribing}>
            Save
          </Button>
        </div>
        {isRecording && (
          <div className="absolute top-0 left-0 right-0 -translate-y-full bg-destructive text-destructive-foreground p-2 text-center">
            Recording... {duration}
          </div>
        )}
      </form>
    </div>
  )
}