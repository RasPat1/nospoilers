'use client'

import { useState, useEffect, useRef } from 'react'
import { useRouter } from 'next/navigation'
import Image from 'next/image'
import { Film, Users, Trophy, Vote, ArrowRight, Check, Play, Star, Pause } from 'lucide-react'
import DemoVideoGallery from '@/components/DemoVideoGallery'

export default function LandingPage() {
  const router = useRouter()
  const [currentFeature, setCurrentFeature] = useState(0)
  const [isPlaying, setIsPlaying] = useState(false)
  const [videoError, setVideoError] = useState(false)
  const mainVideoRef = useRef<HTMLVideoElement>(null)
  
  const toggleMainVideo = async () => {
    if (!mainVideoRef.current) return
    
    try {
      if (isPlaying) {
        mainVideoRef.current.pause()
        setIsPlaying(false)
      } else {
        // Play returns a promise that may reject if autoplay is blocked
        await mainVideoRef.current.play()
        setIsPlaying(true)
      }
    } catch (error) {
      console.error('Video playback error:', error)
      // If autoplay fails, we might need user interaction
      // Keep the play button visible
      setIsPlaying(false)
    }
  }

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
            Choose fairly, watch together
          </div>
          
          <h1 className="text-5xl md:text-7xl font-bold text-neutral-900 dark:text-neutral-100 mb-6">
            NoSpoilers
          </h1>
          
          <p className="text-xl md:text-2xl text-neutral-600 dark:text-neutral-400 mb-8 max-w-3xl mx-auto">
            Everyone suggests, everyone ranks, and the best movie wins. 
            No spoilers, no debates... until after the movie.
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
              onClick={async () => {
                mainVideoRef.current?.scrollIntoView({ behavior: 'smooth', block: 'center' });
                setTimeout(async () => {
                  if (mainVideoRef.current && !isPlaying) {
                    await toggleMainVideo();
                  }
                }, 500);
              }}
              className="px-8 py-4 bg-white dark:bg-neutral-800 hover:bg-neutral-100 dark:hover:bg-neutral-700 text-neutral-900 dark:text-neutral-100 rounded-lg font-semibold text-lg flex items-center justify-center gap-2 border border-neutral-300 dark:border-neutral-600 transition-all"
            >
              <Play className="w-5 h-5" />
              Watch Demo
            </button>
          </div>

          {/* Demo Video */}
          <div className="relative max-w-4xl mx-auto">
            <div className="aspect-video bg-neutral-900 rounded-2xl shadow-2xl overflow-hidden">
              {videoError ? (
                <div className="flex items-center justify-center h-full bg-gradient-to-br from-primary-500 to-primary-700">
                  <div className="text-center">
                    <Play className="w-16 h-16 text-white/80 mx-auto mb-4" />
                    <p className="text-white/80">
                      Demo video coming soon
                    </p>
                  </div>
                </div>
              ) : (
                <>
                  <video
                    ref={mainVideoRef}
                    className="w-full h-full object-contain"
                    poster="/demo-thumbnails/main-demo.jpg"
                    onError={() => setVideoError(true)}
                    onPlay={() => setIsPlaying(true)}
                    onPause={() => setIsPlaying(false)}
                    onEnded={() => setIsPlaying(false)}
                    controls={false}
                    playsInline
                    muted
                  >
                    <source src="/videos/nospoilers_complete_demo.mp4" type="video/mp4" />
                    <source src="/videos/nospoilers_complete_demo.webm" type="video/webm" />
                  </video>
                  <button
                    onClick={toggleMainVideo}
                    className="absolute inset-0 flex items-center justify-center bg-black/20 hover:bg-black/30 transition-colors group"
                  >
                    {isPlaying ? (
                      <Pause className="w-20 h-20 text-white opacity-0 group-hover:opacity-100 transition-opacity" />
                    ) : (
                      <Play className="w-20 h-20 text-white" />
                    )}
                  </button>
                </>
              )}
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

            {/* Interactive Demo Preview */}
            <div className="bg-neutral-100 dark:bg-neutral-800 rounded-xl p-8">
              <div className="aspect-video bg-gradient-to-br from-primary-500 to-primary-700 rounded-lg flex items-center justify-center">
                <div className="text-center">
                  <Film className="w-16 h-16 text-white/80 mx-auto mb-4" />
                  <p className="text-xl text-white font-semibold mb-2">
                    See the Demo Above
                  </p>
                  <p className="text-white/80">
                    Watch how NoSpoilers makes movie night decisions easy
                  </p>
                </div>
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

      {/* Demo Scene Gallery Section */}
      <section className="px-4 py-20">
        <div className="max-w-6xl mx-auto">
          <h2 className="text-3xl md:text-4xl font-bold text-center text-neutral-900 dark:text-neutral-100 mb-4">
            Feature Walkthrough
          </h2>
          <p className="text-xl text-center text-neutral-600 dark:text-neutral-400 mb-12 max-w-3xl mx-auto">
            Explore each feature in detail with our scene-by-scene demos
          </p>
          
          <DemoVideoGallery />
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