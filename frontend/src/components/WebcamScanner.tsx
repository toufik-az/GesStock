import { useEffect, useRef } from 'react'
import { BrowserMultiFormatReader } from '@zxing/browser'
import { X } from 'lucide-react'

interface Props {
  onScan: (code: string) => void
  onClose: () => void
}

export function WebcamScanner({ onScan, onClose }: Props) {
  const videoRef  = useRef<HTMLVideoElement>(null)
  const stoppedRef = useRef(false)
  // Keep a ref to the scanner controls so we can stop it on unmount
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const controlsRef = useRef<any>(null)

  useEffect(() => {
    if (!videoRef.current) return
    stoppedRef.current = false

    const reader = new BrowserMultiFormatReader()
    reader
      .decodeFromVideoDevice(undefined, videoRef.current, (result) => {
        if (result && !stoppedRef.current) {
          stoppedRef.current = true
          controlsRef.current?.stop()
          onScan(result.getText())
        }
      })
      .then(c => { controlsRef.current = c })
      .catch(console.error)

    return () => {
      stoppedRef.current = true
      controlsRef.current?.stop()
    }
  }, []) // onScan is stable (passed from parent handler); eslint-disable-line

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 p-4">
      <div className="w-full max-w-sm overflow-hidden rounded-xl bg-white shadow-2xl">
        <div className="flex items-center justify-between border-b border-gray-100 px-4 py-3">
          <span className="text-sm font-medium text-encre">Scanner un code-barres</span>
          <button onClick={onClose} className="text-muted hover:text-encre">
            <X className="h-5 w-5" />
          </button>
        </div>
        <video ref={videoRef} className="w-full" autoPlay playsInline muted />
        <p className="py-3 text-center text-xs text-muted">
          Pointez la caméra vers le code-barres
        </p>
      </div>
    </div>
  )
}
