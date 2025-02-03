import mongoose from "mongoose"

const NoteSchema = new mongoose.Schema({
  userId: {
    type: String,
    required: true,
  },
  title: {
    type: String,
    required: true,
  },
  content: {
    type: String,
    required: true,
  },
  isAudio: {
    type: Boolean,
    default: false,
  },
  audioUrl: String,
  duration: String,
  isFavorite: {
    type: Boolean,
    default: false,
  },
  images: [
    {
      url: String,
      caption: String,
    },
  ],
  createdAt: {
    type: Date,
    default: Date.now,
  },
})

export default mongoose.models.Note || mongoose.model("Note", NoteSchema)

