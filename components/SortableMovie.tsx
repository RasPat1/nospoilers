import { useSortable } from '@dnd-kit/sortable'
import { CSS } from '@dnd-kit/utilities'

interface Movie {
  id: string
  title: string
  status: string
  created_at: string
}

interface SortableMovieProps {
  movie: Movie
}

export default function SortableMovie({ movie }: SortableMovieProps) {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id: movie.id })

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.5 : 1,
  }

  return (
    <div
      ref={setNodeRef}
      style={style}
      {...attributes}
      {...listeners}
      className="bg-white p-4 rounded-lg shadow cursor-move hover:shadow-md transition-shadow"
    >
      <h3 className="font-medium">{movie.title}</h3>
    </div>
  )
}