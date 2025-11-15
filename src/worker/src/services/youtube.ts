/**
 * YouTube Data API v3 Integration
 * Searches YouTube for tutorial videos and returns real, working links
 */

export interface YouTubeVideo {
  title: string
  url: string
  channelTitle: string
  description: string
  thumbnail: string
  publishedAt: string
}

export interface YouTubeSearchResult {
  videos: YouTubeVideo[]
  query: string
}

/**
 * Search YouTube for tutorial videos
 * @param query - Search query (e.g., "how to remove transparency photoshop")
 * @param apiKey - YouTube Data API v3 key
 * @param maxResults - Number of results to return (default: 5)
 */
export async function searchYouTube(
  query: string,
  apiKey: string,
  maxResults: number = 5
): Promise<YouTubeSearchResult> {
  if (!apiKey) {
    throw new Error('YouTube API key is required')
  }

  const url = new URL('https://www.googleapis.com/youtube/v3/search')
  url.searchParams.set('part', 'snippet')
  url.searchParams.set('q', query)
  url.searchParams.set('type', 'video')
  url.searchParams.set('maxResults', maxResults.toString())
  url.searchParams.set('key', apiKey)
  url.searchParams.set('relevanceLanguage', 'en')
  url.searchParams.set('safeSearch', 'strict')
  url.searchParams.set('order', 'relevance') // Most relevant first

  const response = await fetch(url.toString())

  if (!response.ok) {
    const error = await response.text()
    throw new Error(`YouTube API error: ${response.status} ${error}`)
  }

  const data = await response.json() as any

  const videos: YouTubeVideo[] = (data.items || []).map((item: any) => ({
    title: item.snippet.title,
    url: `https://www.youtube.com/watch?v=${item.id.videoId}`,
    channelTitle: item.snippet.channelTitle,
    description: item.snippet.description,
    thumbnail: item.snippet.thumbnails.medium?.url || item.snippet.thumbnails.default?.url,
    publishedAt: item.snippet.publishedAt,
  }))

  return {
    videos,
    query,
  }
}

/**
 * Detect what tutorial the user needs based on their question
 * Returns the appropriate YouTube search query
 */
export function detectTutorialNeed(question: string): string | null {
  const lower = question.toLowerCase()

  // Check if they're asking for a tutorial
  const tutorialKeywords = ['how to', 'how do i', 'how can i', 'tutorial', 'guide', 'video', 'youtube', 'show me', 'teach me', 'learn', 'step by step', 'walkthrough']
  const askingForTutorial = tutorialKeywords.some(keyword => lower.includes(keyword))

  if (!askingForTutorial) {
    return null
  }

  // Detect specific issue and return appropriate search query
  
  // Transparency issues
  if (lower.includes('transparen') || lower.includes('semi-transparent') || lower.includes('flatten')) {
    if (lower.includes('halftone')) {
      return 'how to create halftone effect photoshop transparency'
    }
    if (lower.includes('gimp')) {
      return 'how to remove transparency GIMP'
    }
    if (lower.includes('illustrator')) {
      return 'illustrator remove transparency opacity 100'
    }
    return 'how to remove transparency photoshop DTF printing'
  }

  // DPI / Resolution
  if (lower.includes('dpi') || lower.includes('resolution') || lower.includes('upscale')) {
    if (lower.includes('ai') || lower.includes('topaz')) {
      return 'topaz gigapixel AI upscale tutorial'
    }
    if (lower.includes('increase') || lower.includes('improve')) {
      return 'how to increase DPI photoshop without losing quality'
    }
    return 'how to change image resolution 300 DPI photoshop'
  }

  // Color profile / ICC
  if (lower.includes('icc') || lower.includes('profile') || lower.includes('srgb') || lower.includes('cmyk')) {
    if (lower.includes('srgb')) {
      return 'how to convert to sRGB photoshop'
    }
    if (lower.includes('cmyk')) {
      return 'how to convert RGB to CMYK photoshop printing'
    }
    return 'how to embed ICC color profile photoshop'
  }

  // Text size
  if (lower.includes('text') && (lower.includes('size') || lower.includes('bigger') || lower.includes('readable'))) {
    return 'how to resize text photoshop maintain quality'
  }

  // Line thickness
  if (lower.includes('line') && (lower.includes('thick') || lower.includes('stroke') || lower.includes('width'))) {
    if (lower.includes('illustrator')) {
      return 'how to increase stroke width illustrator'
    }
    return 'how to make lines thicker photoshop'
  }

  // File format / Export
  if (lower.includes('export') || lower.includes('save') || lower.includes('png') || lower.includes('convert')) {
    if (lower.includes('illustrator')) {
      return 'how to export PNG from illustrator high resolution'
    }
    return 'how to export PNG 300 DPI photoshop'
  }

  // Halftones
  if (lower.includes('halftone')) {
    if (lower.includes('gradient')) {
      return 'how to convert gradient to halftone photoshop'
    }
    return 'how to create halftone effect photoshop'
  }

  // Artwork preparation
  if (lower.includes('prepare') || lower.includes('print-ready') || lower.includes('dtf')) {
    return 'how to prepare artwork for DTF printing'
  }

  // Background removal
  if (lower.includes('background') && (lower.includes('remove') || lower.includes('transparent'))) {
    if (lower.includes('gimp')) {
      return 'how to remove background GIMP'
    }
    return 'how to remove background photoshop'
  }

  // Color correction
  if (lower.includes('color') && (lower.includes('fix') || lower.includes('correct') || lower.includes('enhance'))) {
    return 'how to color correct for printing photoshop'
  }

  // Aspect ratio / Resize
  if (lower.includes('aspect') || (lower.includes('resize') && !lower.includes('text'))) {
    return 'how to resize image maintain aspect ratio photoshop'
  }

  // General Photoshop
  if (lower.includes('photoshop') && (lower.includes('basics') || lower.includes('beginner'))) {
    return 'photoshop basics for printing tutorial'
  }

  // General GIMP
  if (lower.includes('gimp') && (lower.includes('basics') || lower.includes('beginner'))) {
    return 'GIMP complete tutorial for beginners'
  }

  // Default: general DTF preparation
  return 'how to prepare artwork for DTF printing'
}

