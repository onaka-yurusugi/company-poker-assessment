type LoadingSpinnerProps = {
  readonly message?: string;
};

export default function LoadingSpinner({ message }: LoadingSpinnerProps) {
  return (
    <div className="flex flex-col items-center justify-center gap-3 py-12">
      <div className="h-10 w-10 animate-spin rounded-full border-4 border-gray-200 border-t-poker-green" />
      {message && (
        <p className="text-sm text-muted">{message}</p>
      )}
    </div>
  );
}
