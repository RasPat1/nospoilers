'use client'

import { useState, useRef } from 'react'
import { Play, Pause, Film } from 'lucide-react'

interface DemoScene {
  id: string
  title: string
  description: string
  videoPath: string
  thumbnailPath: string
  duration: string
}

const demoScenes: DemoScene[] = [
  {
    id: 'scene1',
    title: 'The Problem',
    description: 'See the common movie night dilemma',
    videoPath: '/videos/scene1_problem.mp4',
    thumbnailPath: '/demo-thumbnails/scene1.jpg',
    duration: '0:15'
  },
  {
    id: 'scene2',
    title: 'Adding Movies',
    description: 'Search and add movies with rich data',
    videoPath: '/videos/scene2_sarah.mp4',
    thumbnailPath: '/demo-thumbnails/scene2.jpg',
    duration: '0:45'
  },
  {
    id: 'scene3',
    title: 'Multiple Users',
    description: 'Real-time collaboration',
    videoPath: '/videos/scene3_mike.mp4',
    thumbnailPath: '/demo-thumbnails/scene3.jpg',
    duration: '0:30'
  },
  {
    id: 'scene4',
    title: 'Mobile Voting',
    description: 'Vote from any device',
    videoPath: '/videos/scene4_emma.mp4',
    thumbnailPath: '/demo-thumbnails/scene4.jpg',
    duration: '0:30'
  },
  {
    id: 'scene5',
    title: 'Live Results',
    description: 'Watch votes update in real-time',
    videoPath: '/videos/scene5_results.mp4',
    thumbnailPath: '/demo-thumbnails/scene5.jpg',
    duration: '0:30'
  },
  {
    id: 'scene6',
    title: 'Late Joiners',
    description: 'Join anytime during voting',
    videoPath: '/videos/scene6_alex.mp4',
    thumbnailPath: '/demo-thumbnails/scene6.jpg',
    duration: '0:30'
  },
  {
    id: 'scene7',
    title: 'Admin Control',
    description: 'Manage voting sessions',
    videoPath: '/videos/scene7_admin.mp4',
    thumbnailPath: '/demo-thumbnails/scene7.jpg',
    duration: '0:30'
  },
  {
    id: 'scene8',
    title: 'Winner Announcement',
    description: 'Fair results with IRV',
    videoPath: '/videos/scene8_winner.mp4',
    thumbnailPath: '/demo-thumbnails/scene8.jpg',
    duration: '0:15'
  }
]

export default function DemoVideoGallery() {
  const [activeScene, setActiveScene] = useState<string | null>(null)
  const [isPlaying, setIsPlaying] = useState(false)
  const videoRef = useRef<HTMLVideoElement>(null)

  const playScene = (sceneId: string) => {
    setActiveScene(sceneId)
    setIsPlaying(true)
    
    // Auto-play when scene changes
    setTimeout(() => {
      if (videoRef.current) {
        videoRef.current.play()
      }
    }, 100)
  }

  const togglePlayPause = () => {
    if (videoRef.current) {
      if (isPlaying) {
        videoRef.current.pause()
      } else {
        videoRef.current.play()
      }
      setIsPlaying(!isPlaying)
    }
  }

  const activeSceneData = demoScenes.find(s => s.id === activeScene)

  return (
    <div className="w-full">
      {/* Main Video Player */}
      {activeScene && activeSceneData && (
        <div className="mb-8">
          <div className="relative bg-black rounded-lg overflow-hidden aspect-video">
            <video
              ref={videoRef}
              className="w-full h-full"
              src={activeSceneData.videoPath}
              poster={activeSceneData.thumbnailPath}
              onEnded={() => setIsPlaying(false)}
              onError={() => {
                console.error('Video failed to load:', activeSceneData.videoPath)
                setActiveScene(null)
              }}
            />
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
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {demoScenes.map((scene) => (
          <button
            key={scene.id}
            onClick={() => playScene(scene.id)}
            className={`
              relative group cursor-pointer rounded-lg overflow-hidden
              ${activeScene === scene.id ? 'ring-2 ring-primary-500' : ''}
            `}
          >
            {/* Thumbnail or Placeholder */}
            <div className="aspect-video bg-neutral-200 dark:bg-neutral-700 flex items-center justify-center">
              <Film className="w-8 h-8 text-neutral-400" />
            </div>
            
            {/* Overlay */}
            <div className="absolute inset-0 bg-black/60 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
              <Play className="w-10 h-10 text-white" />
            </div>
            
            {/* Duration Badge */}
            <div className="absolute bottom-2 right-2 px-2 py-1 bg-black/70 text-white text-xs rounded">
              {scene.duration}
            </div>
            
            {/* Title */}
            <div className="p-2">
              <h4 className="text-sm font-medium text-neutral-900 dark:text-neutral-100 text-left">
                {scene.title}
              </h4>
            </div>
          </button>
        ))}
      </div>
    </div>
  )
}