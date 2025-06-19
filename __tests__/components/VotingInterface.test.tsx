import { render, screen, fireEvent, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import VotingInterface from '@/components/VotingInterface'

// Mock next/navigation
jest.mock('next/navigation', () => ({
  useRouter: () => ({
    push: jest.fn(),
  }),
}))

const mockMovies = [
  {
    id: '1',
    title: 'The Matrix',
    status: 'candidate',
    created_at: '2024-01-01',
    poster_path: '/matrix.jpg',
    release_date: '1999-03-31',
    vote_average: 8.7
  },
  {
    id: '2',
    title: 'Inception',
    status: 'candidate',
    created_at: '2024-01-01',
    poster_path: '/inception.jpg',
    release_date: '2010-07-16',
    vote_average: 8.8
  },
  {
    id: '3',
    title: 'My Indie Film',
    status: 'candidate',
    created_at: '2024-01-01'
    // No poster, no ratings - testing manual entry
  }
]

describe('VotingInterface', () => {
  const mockOnSubmit = jest.fn()
  const mockOnAddMovie = jest.fn()
  const mockSetNewMovieTitle = jest.fn()

  beforeEach(() => {
    jest.clearAllMocks()
  })

  it('should display all available movies', () => {
    render(
      <VotingInterface
        movies={mockMovies}
        onSubmit={mockOnSubmit}
        newMovieTitle=""
        setNewMovieTitle={mockSetNewMovieTitle}
        onAddMovie={mockOnAddMovie}
      />
    )

    expect(screen.getByText('The Matrix')).toBeInTheDocument()
    expect(screen.getByText('Inception')).toBeInTheDocument()
    expect(screen.getByText('My Indie Film')).toBeInTheDocument()
  })

  it('should show movie details when available', () => {
    render(
      <VotingInterface
        movies={mockMovies}
        onSubmit={mockOnSubmit}
        newMovieTitle=""
        setNewMovieTitle={mockSetNewMovieTitle}
        onAddMovie={mockOnAddMovie}
      />
    )

    // Check for year and rating
    expect(screen.getByText(/1999.*8.7⭐/)).toBeInTheDocument()
    expect(screen.getByText(/2010.*8.8⭐/)).toBeInTheDocument()
  })

  it('should handle movies without TMDB data', () => {
    render(
      <VotingInterface
        movies={mockMovies}
        onSubmit={mockOnSubmit}
        newMovieTitle=""
        setNewMovieTitle={mockSetNewMovieTitle}
        onAddMovie={mockOnAddMovie}
      />
    )

    // My Indie Film should still be displayed
    expect(screen.getByText('My Indie Film')).toBeInTheDocument()
  })

  it('should add movie to ranking when clicked', async () => {
    const user = userEvent.setup()
    
    render(
      <VotingInterface
        movies={mockMovies}
        onSubmit={mockOnSubmit}
        newMovieTitle=""
        setNewMovieTitle={mockSetNewMovieTitle}
        onAddMovie={mockOnAddMovie}
      />
    )

    // Click "Add to Ranking" for The Matrix
    const addButtons = screen.getAllByText('Add to Ranking')
    await user.click(addButtons[0])

    // Movie should appear in ranking section
    expect(screen.getByText('Your Ranking (1)')).toBeInTheDocument()
    
    // Movie should be removed from available
    expect(screen.getByText('Available Movies (2)')).toBeInTheDocument()
  })

  it('should allow reordering movies in ranking', async () => {
    const user = userEvent.setup()
    
    render(
      <VotingInterface
        movies={mockMovies}
        onSubmit={mockOnSubmit}
        newMovieTitle=""
        setNewMovieTitle={mockSetNewMovieTitle}
        onAddMovie={mockOnAddMovie}
      />
    )

    // Add two movies to ranking
    const addButtons = screen.getAllByText('Add to Ranking')
    await user.click(addButtons[0]) // The Matrix
    await user.click(addButtons[0]) // Inception (now at index 0)

    // Check initial order
    const rankedMovies = screen.getAllByText(/^(1|2)$/)
    expect(rankedMovies[0]).toHaveTextContent('1')
    expect(rankedMovies[1]).toHaveTextContent('2')

    // Click "Down" on first movie
    const downButtons = screen.getAllByText('Down')
    await user.click(downButtons[0])

    // Order should be swapped
    const newRankedMovies = screen.getAllByText(/^(1|2)$/)
    expect(newRankedMovies[0]).toHaveTextContent('1')
    expect(newRankedMovies[1]).toHaveTextContent('2')
  })

  it('should submit rankings', async () => {
    const user = userEvent.setup()
    mockOnSubmit.mockResolvedValue(true)
    
    render(
      <VotingInterface
        movies={mockMovies}
        onSubmit={mockOnSubmit}
        newMovieTitle=""
        setNewMovieTitle={mockSetNewMovieTitle}
        onAddMovie={mockOnAddMovie}
      />
    )

    // Add movies to ranking
    const addButtons = screen.getAllByText('Add to Ranking')
    await user.click(addButtons[0])
    await user.click(addButtons[0])

    // Submit rankings
    const submitButton = screen.getByText('Submit Rankings')
    await user.click(submitButton)

    await waitFor(() => {
      expect(mockOnSubmit).toHaveBeenCalledWith(['1', '2'])
    })
  })

  it('should disable submit when no movies ranked', () => {
    render(
      <VotingInterface
        movies={mockMovies}
        onSubmit={mockOnSubmit}
        newMovieTitle=""
        setNewMovieTitle={mockSetNewMovieTitle}
        onAddMovie={mockOnAddMovie}
      />
    )

    const submitButton = screen.getByText('Submit Rankings')
    expect(submitButton).toBeDisabled()
  })

  it('should remove movie from ranking', async () => {
    const user = userEvent.setup()
    
    render(
      <VotingInterface
        movies={mockMovies}
        onSubmit={mockOnSubmit}
        newMovieTitle=""
        setNewMovieTitle={mockSetNewMovieTitle}
        onAddMovie={mockOnAddMovie}
      />
    )

    // Add a movie to ranking
    const addButtons = screen.getAllByText('Add to Ranking')
    await user.click(addButtons[0])

    // Remove it
    const removeButton = screen.getByText('Remove')
    await user.click(removeButton)

    // Should be back in available movies
    expect(screen.getByText('Available Movies (3)')).toBeInTheDocument()
    expect(screen.getByText('Your Ranking (0)')).toBeInTheDocument()
  })
})