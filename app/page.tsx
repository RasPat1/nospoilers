'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import Image from 'next/image'
import { Film, Users, Trophy, Vote, ArrowRight, Check, Play, Star } from 'lucide-react'

export default function LandingPage() {
  const router = useRouter()
  const [currentFeature, setCurrentFeature] = useState(0)

  const features = [
    {
      icon: <Film className="w-8 h-8" />,
      title: "Collaborative Movie Selection",
      description: "Everyone adds their movie suggestions with full details from TMDB",
      screenshot: "/screenshots/add-movie.png"
    },
    {
      icon: <Vote className="w-8 h-8" />,
      title: "Ranked Choice Voting",
      description: "Rank movies in order of preference - not just a single vote",
      screenshot: "/screenshots/voting.png"
    },
    {
      icon: <Trophy className="w-8 h-8" />,
      title: "Live Results",
      description: "Watch votes come in real-time and see the winner instantly",
      screenshot: "/screenshots/results.png"
    },
    {
      icon: <Users className="w-8 h-8" />,
      title: "No Sign-ups Required",
      description: "Start voting immediately - just share the link with friends",
      screenshot: "/screenshots/share.png"
    }
  ]

  useEffect(() => {
    const interval = setInterval(() => {
      setCurrentFeature((prev) => (prev + 1) % features.length)
    }, 5000)
    return () => clearInterval(interval)
  }, [features.length])

  return (
    <main className="min-h-screen bg-gradient-to-b from-neutral-50 to-neutral-100 dark:from-neutral-950 dark:to-neutral-900">
      {/* Hero Section */}
      <section className="relative px-4 py-20 text-center">
        <div className="max-w-6xl mx-auto">
          <div className="mb-8 inline-flex items-center gap-2 px-4 py-2 bg-primary-100 dark:bg-primary-900/30 rounded-full text-primary-700 dark:text-primary-300 text-sm font-medium">
            <Star className="w-4 h-4" />
            End movie night debates forever
          </div>
          
          <h1 className="text-5xl md:text-7xl font-bold text-neutral-900 dark:text-neutral-100 mb-6">
            NoSpoilers
          </h1>
          
          <p className="text-xl md:text-2xl text-neutral-600 dark:text-neutral-400 mb-8 max-w-3xl mx-auto">
            The fairest way to choose what to watch. Everyone suggests, everyone ranks, 
            and the best movie wins - no arguments, no spoilers.
          </p>

          <div className="flex flex-col sm:flex-row gap-4 justify-center mb-16">
            <button
              onClick={() => router.push('/vote')}
              className="px-8 py-4 bg-primary-600 hover:bg-primary-700 text-white rounded-lg font-semibold text-lg flex items-center justify-center gap-2 transition-all transform hover:scale-105"
            >
              Start Voting Now
              <ArrowRight className="w-5 h-5" />
            </button>
            <button
              onClick={() => document.getElementById('demo')?.scrollIntoView({ behavior: 'smooth' })}
              className="px-8 py-4 bg-white dark:bg-neutral-800 hover:bg-neutral-100 dark:hover:bg-neutral-700 text-neutral-900 dark:text-neutral-100 rounded-lg font-semibold text-lg flex items-center justify-center gap-2 border border-neutral-300 dark:border-neutral-600 transition-all"
            >
              <Play className="w-5 h-5" />
              Watch Demo
            </button>
          </div>

          {/* App Preview */}
          <div className="relative max-w-4xl mx-auto">
            <div className="aspect-video bg-gradient-to-br from-primary-500 to-primary-700 rounded-2xl shadow-2xl overflow-hidden">
              <div className="absolute inset-0 bg-black/20 flex items-center justify-center">
                <div className="bg-white dark:bg-neutral-900 rounded-lg p-8 shadow-xl max-w-md w-full mx-4">
                  <h3 className="text-2xl font-bold text-neutral-900 dark:text-neutral-100 mb-4">
                    Tonight&apos;s Movie Poll
                  </h3>
                  <div className="space-y-3">
                    <div className="flex items-center gap-3 p-3 bg-success-50 dark:bg-success-950 rounded-lg border-2 border-success-500">
                      <span className="text-2xl font-bold text-success-600 dark:text-success-400">1</span>
                      <div>
                        <p className="font-semibold text-neutral-900 dark:text-neutral-100">Inception</p>
                        <p className="text-sm text-neutral-600 dark:text-neutral-400">2010 • 8.8⭐</p>
                      </div>
                    </div>
                    <div className="flex items-center gap-3 p-3 bg-neutral-50 dark:bg-neutral-800 rounded-lg">
                      <span className="text-2xl font-bold text-neutral-400">2</span>
                      <div>
                        <p className="font-semibold text-neutral-900 dark:text-neutral-100">The Matrix</p>
                        <p className="text-sm text-neutral-600 dark:text-neutral-400">1999 • 8.7⭐</p>
                      </div>
                    </div>
                  </div>
                  <button className="w-full mt-6 py-3 bg-success-600 text-white rounded-lg font-semibold">
                    Submit Rankings
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Features Grid */}
      <section className="px-4 py-20 bg-white dark:bg-neutral-900">
        <div className="max-w-6xl mx-auto">
          <h2 className="text-3xl md:text-4xl font-bold text-center text-neutral-900 dark:text-neutral-100 mb-16">
            How It Works
          </h2>

          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-8">
            {features.map((feature, index) => (
              <div
                key={index}
                className={`p-6 rounded-xl transition-all cursor-pointer ${
                  currentFeature === index
                    ? 'bg-primary-50 dark:bg-primary-950 border-2 border-primary-500 scale-105'
                    : 'bg-neutral-50 dark:bg-neutral-800 border-2 border-transparent'
                }`}
                onClick={() => setCurrentFeature(index)}
              >
                <div className="text-primary-600 dark:text-primary-400 mb-4">
                  {feature.icon}
                </div>
                <h3 className="text-xl font-semibold text-neutral-900 dark:text-neutral-100 mb-2">
                  {feature.title}
                </h3>
                <p className="text-neutral-600 dark:text-neutral-400">
                  {feature.description}
                </p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Demo Section */}
      <section id="demo" className="px-4 py-20">
        <div className="max-w-6xl mx-auto">
          <h2 className="text-3xl md:text-4xl font-bold text-center text-neutral-900 dark:text-neutral-100 mb-16">
            See It In Action
          </h2>

          <div className="bg-white dark:bg-neutral-900 rounded-2xl shadow-xl overflow-hidden">
            <div className="p-8 md:p-12">
              <div className="grid md:grid-cols-3 gap-8">
                <div className="text-center">
                  <div className="w-16 h-16 bg-primary-100 dark:bg-primary-900 rounded-full flex items-center justify-center mx-auto mb-4">
                    <span className="text-2xl font-bold text-primary-600 dark:text-primary-400">1</span>
                  </div>
                  <h3 className="text-xl font-semibold text-neutral-900 dark:text-neutral-100 mb-2">
                    Add Movies
                  </h3>
                  <p className="text-neutral-600 dark:text-neutral-400">
                    Search and add movies with autocomplete. Get posters, ratings, and details automatically.
                  </p>
                </div>

                <div className="text-center">
                  <div className="w-16 h-16 bg-primary-100 dark:bg-primary-900 rounded-full flex items-center justify-center mx-auto mb-4">
                    <span className="text-2xl font-bold text-primary-600 dark:text-primary-400">2</span>
                  </div>
                  <h3 className="text-xl font-semibold text-neutral-900 dark:text-neutral-100 mb-2">
                    Rank Choices
                  </h3>
                  <p className="text-neutral-600 dark:text-neutral-400">
                    Drag and drop to rank movies in order of preference. Everyone&apos;s full preferences count.
                  </p>
                </div>

                <div className="text-center">
                  <div className="w-16 h-16 bg-primary-100 dark:bg-primary-900 rounded-full flex items-center justify-center mx-auto mb-4">
                    <span className="text-2xl font-bold text-primary-600 dark:text-primary-400">3</span>
                  </div>
                  <h3 className="text-xl font-semibold text-neutral-900 dark:text-neutral-100 mb-2">
                    See Winner
                  </h3>
                  <p className="text-neutral-600 dark:text-neutral-400">
                    Results update live as votes come in. The movie with the most points wins fairly.
                  </p>
                </div>
              </div>
            </div>

            {/* Video Demo Placeholder */}
            <div className="bg-neutral-100 dark:bg-neutral-800 aspect-video flex items-center justify-center">
              <div className="text-center">
                <Play className="w-16 h-16 text-neutral-400 mx-auto mb-4" />
                <p className="text-neutral-600 dark:text-neutral-400">
                  Interactive demo coming soon
                </p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Benefits Section */}
      <section className="px-4 py-20 bg-white dark:bg-neutral-900">
        <div className="max-w-6xl mx-auto">
          <h2 className="text-3xl md:text-4xl font-bold text-center text-neutral-900 dark:text-neutral-100 mb-16">
            Why NoSpoilers?
          </h2>

          <div className="grid md:grid-cols-2 gap-12 items-center">
            <div className="space-y-6">
              <div className="flex gap-4">
                <Check className="w-6 h-6 text-success-600 dark:text-success-400 flex-shrink-0 mt-1" />
                <div>
                  <h3 className="text-xl font-semibold text-neutral-900 dark:text-neutral-100 mb-2">
                    Fair Voting System
                  </h3>
                  <p className="text-neutral-600 dark:text-neutral-400">
                    Ranked choice voting ensures everyone&apos;s preferences are considered, not just their first choice.
                  </p>
                </div>
              </div>

              <div className="flex gap-4">
                <Check className="w-6 h-6 text-success-600 dark:text-success-400 flex-shrink-0 mt-1" />
                <div>
                  <h3 className="text-xl font-semibold text-neutral-900 dark:text-neutral-100 mb-2">
                    Rich Movie Data
                  </h3>
                  <p className="text-neutral-600 dark:text-neutral-400">
                    Automatic fetching of posters, ratings, cast, director, and plot summaries from TMDB.
                  </p>
                </div>
              </div>

              <div className="flex gap-4">
                <Check className="w-6 h-6 text-success-600 dark:text-success-400 flex-shrink-0 mt-1" />
                <div>
                  <h3 className="text-xl font-semibold text-neutral-900 dark:text-neutral-100 mb-2">
                    Zero Friction
                  </h3>
                  <p className="text-neutral-600 dark:text-neutral-400">
                    No accounts, no downloads, no setup. Just share a link and start voting instantly.
                  </p>
                </div>
              </div>

              <div className="flex gap-4">
                <Check className="w-6 h-6 text-success-600 dark:text-success-400 flex-shrink-0 mt-1" />
                <div>
                  <h3 className="text-xl font-semibold text-neutral-900 dark:text-neutral-100 mb-2">
                    Real-time Updates
                  </h3>
                  <p className="text-neutral-600 dark:text-neutral-400">
                    Watch results update live as votes come in. Perfect for movie nights with remote friends.
                  </p>
                </div>
              </div>
            </div>

            <div className="bg-gradient-to-br from-primary-100 to-primary-200 dark:from-primary-900 dark:to-primary-800 rounded-2xl p-8 text-center">
              <Film className="w-24 h-24 text-primary-600 dark:text-primary-300 mx-auto mb-6" />
              <h3 className="text-2xl font-bold text-neutral-900 dark:text-neutral-100 mb-4">
                Ready for Movie Night?
              </h3>
              <p className="text-neutral-700 dark:text-neutral-300 mb-6">
                Start your first voting session in seconds
              </p>
              <button
                onClick={() => router.push('/vote')}
                className="px-6 py-3 bg-white dark:bg-neutral-900 text-primary-600 dark:text-primary-400 rounded-lg font-semibold hover:shadow-lg transition-all"
              >
                Create Voting Session
              </button>
            </div>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="px-4 py-20 text-center">
        <div className="max-w-3xl mx-auto">
          <h2 className="text-3xl md:text-4xl font-bold text-neutral-900 dark:text-neutral-100 mb-6">
            Never Waste 30 Minutes Deciding Again
          </h2>
          <p className="text-xl text-neutral-600 dark:text-neutral-400 mb-8">
            Join thousands who&apos;ve discovered the stress-free way to pick movies
          </p>
          <button
            onClick={() => router.push('/vote')}
            className="px-8 py-4 bg-primary-600 hover:bg-primary-700 text-white rounded-lg font-semibold text-lg inline-flex items-center gap-2 transition-all transform hover:scale-105"
          >
            Start Free Movie Vote
            <ArrowRight className="w-5 h-5" />
          </button>
        </div>
      </section>

      {/* Footer */}
      <footer className="px-4 py-8 border-t border-neutral-200 dark:border-neutral-800">
        <div className="max-w-6xl mx-auto text-center text-neutral-600 dark:text-neutral-400">
          <p>© 2024 NoSpoilers. Made with ❤️ for movie lovers everywhere.</p>
        </div>
      </footer>
    </main>
  )
}