import { useDroppable } from '@dnd-kit/core'
import { SortableContext, verticalListSortingStrategy } from '@dnd-kit/sortable'
import SortableMovie from './SortableMovie'

interface Movie {
  id: string
  title: string
  status: string
  created_at: string
}

interface MovieListProps {
  movies: Movie[]
  rankedMovies: Movie[]
}

export default function MovieList({ movies, rankedMovies }: MovieListProps) {
  const { setNodeRef } = useDroppable({ id: 'movie-list' })
  
  const availableMovies = movies.filter(
    movie => !rankedMovies.find(ranked => ranked.id === movie.id)
  )

  return (
    <div className="bg-gray-50 rounded-lg p-4">
      <h2 className="text-xl font-semibold mb-4">Available Movies</h2>
      <div ref={setNodeRef} className="space-y-2 min-h-[400px]">
        <SortableContext 
          items={availableMovies.map(m => m.id)} 
          strategy={verticalListSortingStrategy}
        >
          {availableMovies.map(movie => (
            <SortableMovie key={movie.id} movie={movie} />
          ))}
        </SortableContext>
        {availableMovies.length === 0 && (
          <p className="text-gray-500 text-center py-8">
            No movies available. Add some movies to get started!
          </p>
        )}
      </div>
    </div>
  )
}