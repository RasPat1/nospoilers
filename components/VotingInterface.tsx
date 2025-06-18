import { useDroppable } from '@dnd-kit/core'
import { SortableContext, verticalListSortingStrategy } from '@dnd-kit/sortable'
import SortableMovie from './SortableMovie'

interface Movie {
  id: string
  title: string
  status: string
  created_at: string
}

interface VotingInterfaceProps {
  rankedMovies: Movie[]
  onSubmitVote: () => void
  hasVoted: boolean
}

export default function VotingInterface({ rankedMovies, onSubmitVote, hasVoted }: VotingInterfaceProps) {
  const { setNodeRef } = useDroppable({ id: 'ranked-list' })

  return (
    <div className="bg-blue-50 rounded-lg p-4">
      <h2 className="text-xl font-semibold mb-4">Your Ranking</h2>
      <div ref={setNodeRef} className="space-y-2 min-h-[400px]">
        <SortableContext 
          items={rankedMovies.map(m => m.id)} 
          strategy={verticalListSortingStrategy}
        >
          {rankedMovies.map((movie, index) => (
            <div key={movie.id} className="relative">
              <div className="absolute left-0 top-4 -ml-8 text-lg font-bold text-gray-600">
                {index + 1}.
              </div>
              <SortableMovie movie={movie} />
            </div>
          ))}
        </SortableContext>
        {rankedMovies.length === 0 && (
          <p className="text-gray-500 text-center py-8">
            Drag movies here to create your ranking
          </p>
        )}
      </div>
      
      {!hasVoted && rankedMovies.length > 0 && (
        <button
          onClick={onSubmitVote}
          className="w-full mt-4 px-6 py-2 bg-green-500 text-white rounded-lg hover:bg-green-600"
        >
          Submit Vote
        </button>
      )}
      
      {hasVoted && (
        <p className="text-center mt-4 text-green-600 font-semibold">
          You have already voted!
        </p>
      )}
    </div>
  )
}