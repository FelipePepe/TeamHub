"use client"

export function VersionDisplay() {
  const version = process.env.NEXT_PUBLIC_APP_VERSION || '1.0.0'
  
  return (
    <div className="fixed bottom-4 right-4 text-xs text-muted-foreground px-2 py-1 pointer-events-none select-none">
      v{version}
    </div>
  )
}
