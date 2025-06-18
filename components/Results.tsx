interface Movie {
  id: string
  title: string
  status: string
  created_at: string
}

interface VotingSession {
  id: string
  status: string
  winner_movie_id: string | null
}

interface ResultsProps {
  votingSession: VotingSession
  movies: Movie[]
}

export default function Results({ votingSession, movies }: ResultsProps) {
  const winner = movies.find(m => m.id === votingSession.winner_movie_id)

  return (
    <div className="text-center">
      <h2 className="text-3xl font-bold mb-4">Voting Results</h2>
      {winner ? (
        <div className="bg-green-100 rounded-lg p-8">
          <p className="text-xl mb-2">The winner is:</p>
          <h3 className="text-4xl font-bold text-green-800">{winner.title}</h3>
        </div>
      ) : (
        <p className="text-gray-600">No winner could be determined.</p>
      )}
    </div>
  )
}