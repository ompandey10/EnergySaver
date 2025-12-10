import { AlertCircle, CheckCircle, XCircle, Info } from 'lucide-react';
import { cn } from '../../utils/helpers';

const Alert = ({ type = 'info', title, message, onClose }) => {
    const config = {
        info: {
            icon: Info,
            bgColor: 'bg-blue-50',
            borderColor: 'border-blue-200',
            iconColor: 'text-blue-600',
            textColor: 'text-blue-800',
        },
        success: {
            icon: CheckCircle,
            bgColor: 'bg-green-50',
            borderColor: 'border-green-200',
            iconColor: 'text-green-600',
            textColor: 'text-green-800',
        },
        warning: {
            icon: AlertCircle,
            bgColor: 'bg-yellow-50',
            borderColor: 'border-yellow-200',
            iconColor: 'text-yellow-600',
            textColor: 'text-yellow-800',
        },
        error: {
            icon: XCircle,
            bgColor: 'bg-red-50',
            borderColor: 'border-red-200',
            iconColor: 'text-red-600',
            textColor: 'text-red-800',
        },
    };

    const { icon: Icon, bgColor, borderColor, iconColor, textColor } = config[type];

    return (
        <div className={cn('rounded-lg border p-4', bgColor, borderColor)}>
            <div className="flex">
                <div className="flex-shrink-0">
                    <Icon className={cn('h-5 w-5', iconColor)} />
                </div>
                <div className="ml-3 flex-1">
                    {title && <h3 className={cn('text-sm font-medium', textColor)}>{title}</h3>}
                    {message && <p className={cn('text-sm', title ? 'mt-1' : '', textColor)}>{message}</p>}
                </div>
                {onClose && (
                    <button
                        onClick={onClose}
                        className={cn('ml-auto -mx-1.5 -my-1.5 rounded-lg p-1.5 hover:bg-opacity-50', textColor)}
                    >
                        <span className="sr-only">Dismiss</span>
                        <XCircle className="h-5 w-5" />
                    </button>
                )}
            </div>
        </div>
    );
};

export default Alert;
