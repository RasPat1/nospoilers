import { Movie, VotingSession } from '@/lib/types'

interface ResultsProps {
  votingSession: VotingSession
  movies: Movie[]
}

export default function Results({ votingSession, movies }: ResultsProps) {
  const winner = movies.find(m => m.id === votingSession.winner_movie_id)

  return (
    <div className="text-center px-4">
      <h2 className="text-2xl font-bold mb-6 text-neutral-900 dark:text-neutral-100">Voting Results</h2>
      {winner ? (
        <div className="bg-success-50 dark:bg-success-950 border-2 border-success-500 dark:border-success-400 rounded-lg p-6">
          <p className="text-lg mb-3 text-neutral-700 dark:text-neutral-300">The winner is:</p>
          <h3 className="text-3xl font-bold text-success-800 dark:text-success-300">{winner.title}</h3>
        </div>
      ) : (
        <div className="bg-neutral-100 dark:bg-neutral-900 rounded-lg p-6 border border-neutral-200 dark:border-neutral-800">
          <p className="text-lg text-neutral-700 dark:text-neutral-300">No winner could be determined.</p>
        </div>
      )}
    </div>
  )
}