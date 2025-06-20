'use client'

import { useState, useRef } from 'react'
import { Play, Pause, Film } from 'lucide-react'

interface DemoScene {
  id: string
  title: string
  description: string
  startTime: number
  duration: string
}

const demoScenes: DemoScene[] = [
  {
    id: 'complete-demo',
    title: 'Complete Walkthrough',
    description: 'Full NoSpoilers demonstration showing multiple users voting in real-time',
    startTime: 0,
    duration: 'Full'
  },
  {
    id: 'adding-movies',
    title: 'Adding Movies',
    description: 'Search and add movies with rich TMDB data',
    startTime: 0,
    duration: '0:45'
  },
  {
    id: 'multiple-users',
    title: 'Multiple Users',
    description: 'Real-time collaboration with multiple voters',
    startTime: 45,
    duration: '1:30'
  },
  {
    id: 'ranking-votes',
    title: 'Ranking Votes',
    description: 'Drag and drop ranked choice voting interface',
    startTime: 135,
    duration: '1:00'
  },
  {
    id: 'live-results',
    title: 'Live Results',
    description: 'Watch votes update in real-time with IRV calculations',
    startTime: 195,
    duration: '0:45'
  },
  {
    id: 'mobile-voting',
    title: 'Mobile Experience',
    description: 'Seamless voting from any device',
    startTime: 240,
    duration: '0:30'
  }
]

const DEMO_VIDEO_PATH = '/demo.mp4'
const DEMO_THUMBNAIL_PATH = '/demo-thumbnails/main-demo.jpg'

export default function DemoVideoGallery() {
  const [activeScene, setActiveScene] = useState<string | null>(null)
  const [isPlaying, setIsPlaying] = useState(false)
  const [videoError, setVideoError] = useState(false)
  const [userInteracted, setUserInteracted] = useState(false)
  const videoRef = useRef<HTMLVideoElement>(null)

  const playScene = (sceneId: string) => {
    const scene = demoScenes.find(s => s.id === sceneId)
    if (!scene) return
    
    setActiveScene(sceneId)
    setVideoError(false)
    setUserInteracted(true)
    
    // Wait for video to be ready before setting time and playing
    setTimeout(async () => {
      if (videoRef.current) {
        try {
          // Ensure video is loaded
          if (videoRef.current.readyState < 2) {
            await new Promise((resolve, reject) => {
              const onCanPlay = () => {
                videoRef.current?.removeEventListener('canplay', onCanPlay)
                videoRef.current?.removeEventListener('error', onError)
                resolve(true)
              }
              const onError = () => {
                videoRef.current?.removeEventListener('canplay', onCanPlay)
                videoRef.current?.removeEventListener('error', onError)
                reject(new Error('Video failed to load'))
              }
              videoRef.current?.addEventListener('canplay', onCanPlay)
              videoRef.current?.addEventListener('error', onError)
              
              // Load the video if not already loading
              if (videoRef.current?.readyState === 0) {
                videoRef.current.load()
              }
            })
          }
          
          // Set video to start time for the scene
          if (scene.startTime > 0) {
            videoRef.current.currentTime = scene.startTime
          }
          
          // Play video
          await videoRef.current.play()
          setIsPlaying(true)
        } catch (error) {
          console.error('Video playback error:', error)
          setIsPlaying(false)
          setVideoError(true)
        }
      }
    }, 200)
  }

  const togglePlayPause = async () => {
    if (!videoRef.current) return
    
    setUserInteracted(true)
    
    try {
      if (isPlaying) {
        videoRef.current.pause()
        setIsPlaying(false)
      } else {
        await videoRef.current.play()
        setIsPlaying(true)
      }
    } catch (error) {
      console.error('Video playback error:', error)
      setIsPlaying(false)
      setVideoError(true)
    }
  }

  const activeSceneData = demoScenes.find(s => s.id === activeScene)

  return (
    <div className="w-full">
      {/* Main Video Player */}
      {activeScene && activeSceneData && (
        <div className="mb-8">
          <div className="relative bg-black rounded-lg overflow-hidden aspect-video">
            {videoError ? (
              <div className="flex items-center justify-center h-full bg-gradient-to-br from-primary-500 to-primary-700">
                <div className="text-center">
                  <Play className="w-16 h-16 text-white/80 mx-auto mb-4" />
                  <p className="text-white/80">
                    Demo video loading...
                  </p>
                </div>
              </div>
            ) : (
              <>
                <video
                  ref={videoRef}
                  className="w-full h-full object-contain"
                  poster={DEMO_THUMBNAIL_PATH}
                  onError={() => setVideoError(true)}
                  onPlay={() => setIsPlaying(true)}
                  onPause={() => setIsPlaying(false)}
                  onEnded={() => setIsPlaying(false)}
                  onLoadStart={() => setVideoError(false)}
                  controls={false}
                  playsInline
                  muted
                  preload="metadata"
                >
                  <source src={DEMO_VIDEO_PATH} type="video/mp4" />
                </video>
                <button
                  onClick={togglePlayPause}
                  className="absolute inset-0 flex items-center justify-center bg-black/20 hover:bg-black/30 transition-colors group"
                >
                  {isPlaying ? (
                    <Pause className="w-16 h-16 text-white opacity-0 group-hover:opacity-100 transition-opacity" />
                  ) : (
                    <Play className="w-16 h-16 text-white" />
                  )}
                </button>
              </>
            )}
          </div>
          <div className="mt-4">
            <h3 className="text-xl font-semibold text-neutral-900 dark:text-neutral-100">
              {activeSceneData.title}
            </h3>
            <p className="text-neutral-600 dark:text-neutral-400">
              {activeSceneData.description}
            </p>
          </div>
        </div>
      )}

      {/* Scene Gallery */}
      <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
        {demoScenes.map((scene) => (
          <button
            key={scene.id}
            onClick={() => playScene(scene.id)}
            className={`
              relative group cursor-pointer rounded-lg overflow-hidden border-2 transition-all
              ${activeScene === scene.id 
                ? 'border-primary-500 bg-primary-50 dark:bg-primary-950' 
                : 'border-neutral-200 dark:border-neutral-700 bg-white dark:bg-neutral-800 hover:border-neutral-300 dark:hover:border-neutral-600'
              }
            `}
          >
            {/* Thumbnail */}
            <div className="aspect-video bg-gradient-to-br from-primary-100 to-primary-200 dark:from-primary-900 dark:to-primary-800 flex items-center justify-center relative overflow-hidden">
              <img 
                src={DEMO_THUMBNAIL_PATH} 
                alt={scene.title}
                className="w-full h-full object-cover opacity-60"
                onError={(e) => {
                  e.currentTarget.style.display = 'none'
                }}
              />
              <div className="absolute inset-0 flex items-center justify-center">
                <Film className="w-8 h-8 text-primary-600 dark:text-primary-400" />
              </div>
            </div>
            
            {/* Overlay */}
            <div className="absolute inset-0 bg-black/40 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
              <Play className="w-10 h-10 text-white" />
            </div>
            
            {/* Duration Badge */}
            <div className="absolute top-2 right-2 px-2 py-1 bg-black/70 text-white text-xs rounded">
              {scene.duration}
            </div>
            
            {/* Content */}
            <div className="p-3">
              <h4 className="text-sm font-medium text-neutral-900 dark:text-neutral-100 text-left mb-1">
                {scene.title}
              </h4>
              <p className="text-xs text-neutral-600 dark:text-neutral-400 text-left">
                {scene.description}
              </p>
            </div>
          </button>
        ))}
      </div>
    </div>
  )
}