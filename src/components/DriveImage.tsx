import { useEffect, useMemo, useState, type ImgHTMLAttributes, type SyntheticEvent } from 'react'
import { getDriveImageUrlCandidates } from '../utils/driveImageUrl'

interface DriveImageProps extends ImgHTMLAttributes<HTMLImageElement> {
  src: string
  onAllCandidatesFailed?: () => void
}

export function DriveImage({
  src,
  onError,
  onAllCandidatesFailed,
  ...props
}: DriveImageProps) {
  const candidates = useMemo(() => getDriveImageUrlCandidates(src), [src])
  const [index, setIndex] = useState(0)

  useEffect(() => {
    setIndex(0)
  }, [src])

  const handleError = (e: SyntheticEvent<HTMLImageElement>) => {
    if (index < candidates.length - 1) {
      setIndex((i) => i + 1)
      return
    }
    onAllCandidatesFailed?.()
    onError?.(e)
  }

  if (candidates.length === 0) return null

  return <img {...props} src={candidates[index]} onError={handleError} />
}
