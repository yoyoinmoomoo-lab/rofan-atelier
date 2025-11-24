export default function LoadingSpinner() {
  return (
    <div className="flex items-center justify-center py-12">
      <div className="relative w-12 h-12">
        <div className="absolute top-0 left-0 w-full h-full border-4 border-[var(--accent-light)] rounded-full"></div>
        <div className="absolute top-0 left-0 w-full h-full border-4 border-[var(--accent)] rounded-full border-t-transparent animate-spin"></div>
      </div>
    </div>
  );
}

