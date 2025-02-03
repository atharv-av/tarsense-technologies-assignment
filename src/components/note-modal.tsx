"use client"

import { useState, useRef, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import {
  Bold,
  Italic,
  Underline,
  AlignLeft,
  Undo,
  Redo,
  List,
  Heading,
  Copy,
  Download,
  Maximize2,
  Minimize2,
  Play,
  Pause,
  X,
  ImageIcon,
  Star,
} from "lucide-react"
import { toast } from "@/hooks/use-toast"

interface Note {
  _id: string
  title: string
  content: string
  isAudio: boolean
  audioUrl?: string
  duration?: string
  createdAt: string
  images?: Array<{
    url: string
    caption: string
  }>
}

interface NoteModalProps {
  note: Note
  onClose: () => void
  onUpdate: () => void
}

export default function NoteModal({ note, onClose, onUpdate }: NoteModalProps) {
  const [isFullscreen, setIsFullscreen] = useState(false)
  const [title, setTitle] = useState(note.title)
  const [content, setContent] = useState(note.content)
  const [isPlaying, setIsPlaying] = useState(false)
  const [currentTime, setCurrentTime] = useState(0)
  const [duration, setDuration] = useState(0)
  const [newImages, setNewImages] = useState<File[]>([])
  const [newImageCaptions, setNewImageCaptions] = useState<string[]>([])
  const [existingImages, setExistingImages] = useState(note.images || [])
  const [isSaving, setIsSaving] = useState(false)

  const audioRef = useRef<HTMLAudioElement | null>(null)
  const progressRef = useRef<HTMLDivElement>(null)
  const fileInputRef = useRef<HTMLInputElement>(null)
  const textareaRef = useRef<HTMLTextAreaElement>(null)

  useEffect(() => {
    if (note.audioUrl && !audioRef.current) {
      audioRef.current = new Audio(note.audioUrl)

      const setupAudio = () => {
        if (!audioRef.current) return

        audioRef.current.addEventListener("timeupdate", updateProgress)
        audioRef.current.addEventListener("loadedmetadata", () => {
          setDuration(audioRef.current?.duration || 0)
        })
        audioRef.current.addEventListener("ended", () => {
          setIsPlaying(false)
          setCurrentTime(0)
        })
      }

      setupAudio()

      return () => {
        if (audioRef.current) {
          audioRef.current.removeEventListener("timeupdate", updateProgress)
          audioRef.current.pause()
          audioRef.current = null
        }
      }
    }
  }, [note.audioUrl])

  const updateProgress = () => {
    if (audioRef.current) {
      setCurrentTime(audioRef.current.currentTime)
    }
  }

  const togglePlay = () => {
    if (audioRef.current) {
      if (isPlaying) {
        audioRef.current.pause()
      } else {
        audioRef.current.play().catch((error) => {
          console.error("Error playing audio:", error)
          toast({
            title: "Error",
            description: "Failed to play audio",
            variant: "destructive",
          })
        })
      }
      setIsPlaying(!isPlaying)
    }
  }

  const handleProgressClick = (e: React.MouseEvent<HTMLDivElement>) => {
    if (progressRef.current && audioRef.current) {
      const rect = progressRef.current.getBoundingClientRect()
      const pos = (e.clientX - rect.left) / rect.width
      audioRef.current.currentTime = pos * duration
    }
  }

  const formatTime = (time: number) => {
    const minutes = Math.floor(time / 60)
    const seconds = Math.floor(time % 60)
    return `${minutes}:${seconds.toString().padStart(2, "0")}`
  }

  const handleDownload = async () => {
    if (!note.audioUrl) return

    try {
      const response = await fetch(note.audioUrl)
      const blob = await response.blob()
      const url = window.URL.createObjectURL(blob)
      const a = document.createElement("a")
      a.href = url
      a.download = `${title.replace(/\s+/g, "_")}.wav`
      document.body.appendChild(a)
      a.click()
      window.URL.revokeObjectURL(url)
      document.body.removeChild(a)
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to download audio",
        variant: "destructive",
      })
    }
  }

  const handleTextOperation = (operation: string) => {
    if (!textareaRef.current) return

    const textarea = textareaRef.current
    const start = textarea.selectionStart
    const end = textarea.selectionEnd
    const selectedText = content.substring(start, end)
    let newText = content

    switch (operation) {
      case "bold":
        newText = content.substring(0, start) + `**${selectedText}**` + content.substring(end)
        break
      case "italic":
        newText = content.substring(0, start) + `_${selectedText}_` + content.substring(end)
        break
      case "underline":
        newText = content.substring(0, start) + `__${selectedText}__` + content.substring(end)
        break
      case "heading":
        newText = content.substring(0, start) + `# ${selectedText}` + content.substring(end)
        break
      case "list":
        newText = content.substring(0, start) + `- ${selectedText}` + content.substring(end)
        break
    }

    setContent(newText)
  }

  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files) {
      const files = Array.from(e.target.files)
      setNewImages((prev) => [...prev, ...files])
      setNewImageCaptions((prev) => [...prev, ...files.map(() => "")])
    }
  }

  const handleRemoveImage = (index: number, isExisting: boolean) => {
    if (isExisting) {
      setExistingImages((prev) => prev.filter((_, i) => i !== index))
    } else {
      setNewImages((prev) => prev.filter((_, i) => i !== index))
      setNewImageCaptions((prev) => prev.filter((_, i) => i !== index))
    }
  }

  const handleSave = async () => {
    const token = localStorage.getItem("token");
    setIsSaving(true)
    try {
      const formData = new FormData()
      formData.append("title", title)
      formData.append("content", content)

      existingImages.forEach((image, index) => {
        formData.append(`existingImages[${index}]`, JSON.stringify(image))
      })

      newImages.forEach((image, index) => {
        formData.append("newImages", image)
        formData.append(`newImageCaptions[${index}]`, newImageCaptions[index] || "")
      })

      const response = await fetch(`/api/notes/${note._id}`, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
        method: "PATCH",
        body: formData,
      })

      if (!response.ok) throw new Error("Failed to update note")

      toast({
        title: "Success",
        description: "Note updated successfully",
      })
      onUpdate()
      onClose()
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to update note",
        variant: "destructive",
      })
    } finally {
      setIsSaving(false)
    }
  }

  return (
    <Dialog open onOpenChange={onClose}>
      <DialogContent className={`${isFullscreen ? "w-screen h-screen max-w-none m-0 rounded-none" : "max-w-4xl"}`}>
        <DialogHeader className="flex flex-row items-center justify-between space-y-0 pb-4">
          <DialogTitle className="flex-1 mr-4">
            <Input
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              className="text-lg font-semibold"
              placeholder="Note title"
            />
          </DialogTitle>
          <div className="flex items-center gap-2">
            <Button variant="ghost" size="icon" onClick={() => setIsFullscreen(!isFullscreen)}>
              {isFullscreen ? <Minimize2 className="h-4 w-4" /> : <Maximize2 className="h-4 w-4" />}
            </Button>
            <Button variant="ghost" size="icon" onClick={onClose}>
              <X className="h-4 w-4" />
            </Button>
          </div>
        </DialogHeader>

        <div className="space-y-4">
          {note.isAudio && (
            <div className="bg-muted rounded-lg p-4">
              <div className="flex items-center gap-4 mb-2">
                <Button variant="ghost" size="icon" onClick={togglePlay}>
                  {isPlaying ? <Pause className="h-4 w-4" /> : <Play className="h-4 w-4" />}
                </Button>

                <div
                  ref={progressRef}
                  className="flex-1 h-2 bg-secondary rounded-full cursor-pointer"
                  onClick={handleProgressClick}
                >
                  <div
                    className="h-full bg-primary rounded-full transition-all"
                    style={{ width: `${(currentTime / duration) * 100}%` }}
                  />
                </div>

                <span className="text-sm text-muted-foreground min-w-[80px] text-right">
                  {formatTime(currentTime)} / {note.duration || "0:00"}
                </span>

                <Button variant="ghost" size="icon" onClick={handleDownload}>
                  <Download className="h-4 w-4" />
                </Button>
              </div>

              <div className="flex items-center justify-between text-sm text-muted-foreground">
                <div className="flex items-center gap-2">
                  <span>Original Recording</span>
                  <div className="flex">
                    {[1, 2, 3].map((star) => (
                      <Star key={star} className="w-4 h-4 fill-primary" />
                    ))}
                    {[4, 5].map((star) => (
                      <Star key={star} className="w-4 h-4 fill-muted stroke-muted-foreground" />
                    ))}
                  </div>
                </div>
                <span>{note.duration}</span>
              </div>
            </div>
          )}

          <Tabs defaultValue="content">
            <TabsList>
              <TabsTrigger value="content">Content</TabsTrigger>
              {note.isAudio && <TabsTrigger value="audio">Audio</TabsTrigger>}
              <TabsTrigger value="images">Images</TabsTrigger>
            </TabsList>

            <TabsContent value="content" className="space-y-4">
              <div className="flex items-center gap-2 border-b pb-2">
                <Button variant="ghost" size="icon" onClick={() => handleTextOperation("bold")}>
                  <Bold className="h-4 w-4" />
                </Button>
                <Button variant="ghost" size="icon" onClick={() => handleTextOperation("italic")}>
                  <Italic className="h-4 w-4" />
                </Button>
                <Button variant="ghost" size="icon" onClick={() => handleTextOperation("underline")}>
                  <Underline className="h-4 w-4" />
                </Button>
                <Button variant="ghost" size="icon">
                  <AlignLeft className="h-4 w-4" />
                </Button>
                <Button variant="ghost" size="icon">
                  <Undo className="h-4 w-4" />
                </Button>
                <Button variant="ghost" size="icon">
                  <Redo className="h-4 w-4" />
                </Button>
                <Button variant="ghost" size="icon" onClick={() => handleTextOperation("list")}>
                  <List className="h-4 w-4" />
                </Button>
                <Button variant="ghost" size="icon" onClick={() => handleTextOperation("heading")}>
                  <Heading className="h-4 w-4" />
                </Button>
              </div>

              <Textarea
                ref={textareaRef}
                value={content}
                onChange={(e) => setContent(e.target.value)}
                placeholder="Enter content here..."
                className="min-h-[200px]"
              />

              <div className="flex justify-end gap-2">
                <Button variant="outline" onClick={onClose}>
                  Cancel
                </Button>
                <Button onClick={handleSave} disabled={isSaving}>
                  {isSaving ? "Saving..." : "Save"}
                </Button>
              </div>
            </TabsContent>

            {note.isAudio && (
              <TabsContent value="audio" className="space-y-4">
                <div className="space-y-2">
                  <h3 className="font-medium">Transcription</h3>
                  <p className="text-sm text-muted-foreground">{content}</p>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => {
                      navigator.clipboard.writeText(content)
                      toast({
                        title: "Copied",
                        description: "Transcription copied to clipboard",
                      })
                    }}
                  >
                    <Copy className="h-4 w-4 mr-2" />
                    Copy
                  </Button>
                </div>
              </TabsContent>
            )}

            <TabsContent value="images" className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                {existingImages.map((image, index) => (
                  <div key={`existing-${index}`} className="space-y-2">
                    <div className="relative aspect-video">
                      <img
                        src={image.url || "/placeholder.svg"}
                        alt={image.caption}
                        className="w-full h-full object-cover rounded-lg"
                      />
                    </div>
                    <Button
                      type="button"
                      variant="destructive"
                      size="sm"
                      onClick={() => handleRemoveImage(index, true)}
                    >
                      Remove
                    </Button>
                  </div>
                ))}
                {newImages.map((image, index) => (
                  <div key={`new-${index}`} className="space-y-2">
                    <div className="relative aspect-video">
                      <img
                        src={URL.createObjectURL(image) || "/placeholder.svg"}
                        alt={newImageCaptions[index]}
                        className="w-full h-full object-cover rounded-lg"
                      />
                    </div>
                    <Button
                      type="button"
                      variant="destructive"
                      size="sm"
                      onClick={() => handleRemoveImage(index, false)}
                    >
                      Remove
                    </Button>
                  </div>
                ))}
              </div>
              <div className="flex justify-between">
                <Button type="button" variant="outline" onClick={() => fileInputRef.current?.click()}>
                  <ImageIcon className="h-4 w-4 mr-2" />
                  Add Images
                </Button>
                <input
                  type="file"
                  ref={fileInputRef}
                  onChange={handleImageUpload}
                  accept="image/*"
                  multiple
                  className="hidden"
                />
                <Button onClick={handleSave} disabled={isSaving}>
                  {isSaving ? "Saving..." : "Save Changes"}
                </Button>
              </div>
            </TabsContent>
          </Tabs>
        </div>
      </DialogContent>
    </Dialog>
  )
}

