export function VersionDisplay() {
  return (
    <div className="fixed bottom-4 right-4 text-xs text-muted-foreground px-2 py-1 pointer-events-none select-none">
      v{process.env.NEXT_PUBLIC_APP_VERSION ?? ''}
    </div>
  )
}
