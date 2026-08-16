const YOUTUBE_HOSTS = new Set([
  'youtube.com',
  'www.youtube.com',
  'm.youtube.com',
  'music.youtube.com',
])

export const getYoutubeVideoId = (value: string): string | null => {
  if (!value.trim()) return null

  try {
    const url = new URL(value)

    if (url.hostname === 'youtu.be') {
      return url.pathname.split('/').filter(Boolean)[0] ?? null
    }

    if (!YOUTUBE_HOSTS.has(url.hostname)) return null

    if (url.pathname === '/watch') return url.searchParams.get('v')

    const [kind, id] = url.pathname.split('/').filter(Boolean)
    return ['shorts', 'embed', 'live'].includes(kind) && id ? id : null
  } catch {
    return null
  }
}

export const getYoutubeThumbnail = (
  videoId: string,
  quality: 'maxresdefault' | 'hqdefault' = 'maxresdefault',
): string => `https://img.youtube.com/vi/${encodeURIComponent(videoId)}/${quality}.jpg`

export const isSafeExternalUrl = (value: string): boolean => {
  try {
    const url = new URL(value)
    return url.protocol === 'https:' || url.protocol === 'http:'
  } catch {
    return false
  }
}
