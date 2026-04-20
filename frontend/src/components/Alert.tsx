interface AlertProps {
  type: 'error' | 'success' | 'info';
  message: string;
  onClose?: () => void;
}

const styles = {
  error: 'border-red-200 bg-red-50 text-red-800',
  success: 'border-green-200 bg-green-50 text-green-800',
  info: 'border-blue-200 bg-blue-50 text-blue-800',
};

export function Alert({ type, message, onClose }: AlertProps) {
  return (
    <div className={`rounded-2xl border ${styles[type]} p-4 text-sm font-medium`}>
      <div className="flex items-center justify-between">
        <span>{message}</span>
        {onClose && (
          <button onClick={onClose} className="ml-4 text-lg opacity-60 hover:opacity-100">
            ✕
          </button>
        )}
      </div>
    </div>
  );
}
