import React from 'react'; // Added React import for consistency, though not strictly necessary for functional components without JSX transform per-file
import {
    Loader2, XCircle, CheckCircle, Info, AlertTriangle, UserCircle2,
} from 'lucide-react';

/* Card Component */
export const Card = ({ children, className = '' }) => (
    <div className={`bg-white dark:bg-gray-800 rounded-xl shadow-lg p-6 border border-gray-200 dark:border-gray-700 ${className}`}>
        {children}
    </div>
);

/* Button Component */
export const Button = ({
                           children, onClick, className = '', variant = 'default', disabled = false, type = 'button', size = 'md', icon: Icon,
                       }) => {
    const baseStyle = 'flex items-center justify-center gap-2 font-semibold transition-colors focus:outline-none focus:ring-2 focus:ring-offset-2';
    const sizeStyles = {
        sm: 'px-3 py-1.5 text-sm rounded-md',
        md: 'px-4 py-2 rounded-md',
        lg: 'px-6 py-3 text-lg rounded-lg',
        icon: 'p-2 rounded-full',
    };
    const variantStyles = {
        primary: 'bg-blue-600 text-white hover:bg-blue-700 focus:ring-blue-500',
        secondary: 'bg-gray-200 text-gray-800 hover:bg-gray-300 focus:ring-gray-400 dark:bg-gray-700 dark:text-gray-200 dark:hover:bg-gray-600',
        destructive: 'bg-red-600 text-white hover:bg-red-700 focus:ring-red-700',
        outline: 'border border-gray-300 text-gray-800 hover:bg-gray-50 focus:ring-gray-400 dark:border-gray-600 dark:text-gray-200 dark:hover:bg-gray-700',
        ghost: 'text-gray-700 hover:bg-gray-100 dark:text-gray-300 dark:hover:bg-gray-700',
        default: 'bg-blue-600 text-white hover:bg-blue-700 focus:ring-blue-500', // Kept for clarity, though 'primary' is often the default
    };

    // Determine aria-label for icon-only buttons
    const ariaLabel = (Icon && !children) ? (typeof children === 'string' ? children : 'Action button') : undefined;

    return (
        <button
            type={type}
            onClick={onClick}
            className={`${baseStyle} ${sizeStyles[size] || sizeStyles.md} ${variantStyles[variant] || variantStyles.default} ${disabled ? 'opacity-50 cursor-not-allowed' : ''} ${className}`}
            disabled={disabled}
            aria-label={ariaLabel} // Add aria-label for accessibility
        >
            {Icon && <Icon size={size === 'sm' ? 16 : 20} />}
            {children}
        </button>
    );
};

/* Input Field */
export const Input = ({ type = 'text', placeholder, value, onChange, className = '', id, label, required = false, disabled = false, name }) => (
    <div className="mb-4" style={{maxWidth:"450px"}}>
        {label && <label htmlFor={id} className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">{label} {required && <span className="text-red-500">*</span>}</label>}
        <input
            id={id}
            name={name || id} // Prioritize name prop if provided, else use id
            type={type}
            placeholder={placeholder}
            value={value}
            onChange={onChange}
            required={required}
            disabled={disabled}
            className={`w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500 bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 placeholder-gray-400 dark:placeholder-gray-500 ${disabled ? 'opacity-75 cursor-not-allowed' : ''} ${className}`}
        />
    </div>
);

/* Textarea */
export const Textarea = ({ placeholder, value, onChange, className = '', id, label, rows = 3, required = false, disabled = false, name }) => (
    <div className="mb-4">
        {label && <label htmlFor={id} className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">{label} {required && <span className="text-red-500">*</span>}</label>}
        <textarea
            id={id}
            name={name || id} // Prioritize name prop if provided, else use id
            placeholder={placeholder}
            value={value}
            onChange={onChange}
            rows={rows}
            required={required}
            disabled={disabled}
            className={`w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500 bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 placeholder-gray-400 dark:placeholder-gray-500 ${disabled ? 'opacity-75 cursor-not-allowed' : ''} ${className}`}
        />
    </div>
);

/* Select Dropdown */
export const Select = ({ options = [], value, onChange, className = '', id, label, required = false, disabled = false, name }) => (
    <div className="mb-4">
        {label && <label htmlFor={id} className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">{label} {required && <span className="text-red-500">*</span>}</label>}
        <select
            id={id}
            name={name || id} // Prioritize name prop if provided, else use id
            value={value}
            onChange={onChange}
            required={required}
            disabled={disabled}
            className={`w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500 bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 ${disabled ? 'opacity-75 cursor-not-allowed' : ''} ${className}`}
        >
            {/* Note: If you want a "Select an option..." placeholder, add it as the first option in the 'options' array from the parent component. */}
            {options.map(option => (
                <option key={option.value} value={option.value}>{option.label}</option>
            ))}
        </select>
    </div>
);

/* Checkbox */
export const Checkbox = ({ id, label, checked, onChange, className = '', disabled = false, name }) => (
    <div className="flex items-center mb-4">
        <input
            type="checkbox"
            id={id}
            name={name || id} // Prioritize name prop if provided, else use id
            checked={checked}
            onChange={onChange}
            disabled={disabled}
            className={`h-4 w-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500 dark:bg-gray-700 dark:border-gray-600 ${disabled ? 'opacity-75 cursor-not-allowed' : ''} ${className}`}
        />
        {label && <label htmlFor={id} className="ml-2 text-sm text-gray-700 dark:text-gray-300 cursor-pointer">{label}</label>}
    </div>
);

/* Switch */
export const Switch = ({ id, label, checked, onChange, className = '', disabled = false, name }) => (
    <div className="flex items-center mb-4">
        <input
            type="checkbox"
            id={id}
            name={name || id} // Prioritize name prop if provided, else use id
            checked={checked}
            onChange={onChange}
            disabled={disabled}
            className="sr-only peer"
        />
        <label htmlFor={id} className={`relative inline-flex items-center cursor-pointer ${disabled ? 'opacity-75 cursor-not-allowed' : ''} ${className}`}>
            <div className="w-11 h-6 bg-gray-200 dark:bg-gray-600 rounded-full peer peer-checked:bg-blue-600 after:content-[''] after:absolute after:top-0.5 after:left-[2px] after:bg-white after:border after:border-gray-300 after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:after:translate-x-full dark:border-gray-500" />
            {label && <span className="ml-3 text-sm font-medium text-gray-700 dark:text-gray-300">{label}</span>}
        </label>
    </div>
);

/* Alert Component */
export const Alert = ({ message, type = 'info', className = '', onClose }) => {
    if (!message) return null;
    const styles = {
        success: ['bg-green-100 dark:bg-green-900', 'text-green-800 dark:text-green-200', 'border-green-400 dark:border-green-600', <CheckCircle className="h-5 w-5" />],
        error: ['bg-red-100 dark:bg-red-900', 'text-red-800 dark:text-red-200', 'border-red-400 dark:border-red-600', <XCircle className="h-5 w-5" />],
        warning: ['bg-yellow-100 dark:bg-yellow-900', 'text-yellow-800 dark:text-yellow-200', 'border-yellow-400 dark:border-yellow-600', <AlertTriangle className="h-5 w-5" />],
        info: ['bg-blue-100 dark:bg-blue-900', 'text-blue-800 dark:text-blue-200', 'border-blue-400 dark:border-blue-600', <Info className="h-5 w-5" />],
    };

    const [bg, text, border, icon] = styles[type] || styles.info;

    return (
        <div className={`flex items-center p-3 rounded-md border ${bg} ${text} ${border} ${className}`} role="alert">
            <div className="flex-shrink-0 mr-3">{icon}</div>
            <div className="flex-grow">{message}</div>
            {onClose && (
                <Button variant="ghost" size="icon" onClick={onClose} className="ml-auto p-1" aria-label="Close alert">
                    <XCircle className="h-4 w-4" />
                </Button>
            )}
        </div>
    );
};

/* Loading Spinner */
export const LoadingSpinner = ({ size = 24, className = '', message = '' }) => (
    <div className={`flex items-center justify-center text-blue-600 dark:text-blue-400 ${className}`}>
        <Loader2 size={size} className="animate-spin" />
        {message && <span className="ml-2 text-gray-700 dark:text-gray-300">{message}</span>}
    </div>
);

/* Modal */
export const Modal = ({ show, title, message, onConfirm, onCancel, confirmText = 'Confirm', cancelText = 'Cancel', type = 'confirm', children }) => {
    if (!show) return null;
    return (
        <div className="fixed inset-0 bg-gray-700 bg-opacity-75 flex items-center justify-center p-4 z-50 animate-fade-in">
            <div className="bg-white dark:bg-gray-800 rounded-lg shadow-xl p-6 w-full max-w-4xl border border-gray-200 dark:border-gray-700 animate-scale-in">
                <h3 className="text-xl font-semibold text-gray-900 dark:text-gray-100 mb-4">{title}</h3>
                {message && <p className="text-gray-700 dark:text-gray-300 mb-6">{message}</p>}
                {children}
                <div className="flex justify-end space-x-3 mt-6">
                    {onCancel && <Button onClick={onCancel} variant="secondary">{cancelText}</Button>}
                    <Button onClick={onConfirm} variant={type === 'destructive' ? 'destructive' : 'primary'}>{confirmText}</Button>
                </div>
            </div>
        </div>
    );
};

/* Avatar */
export const Avatar = ({ src, alt, fallback, size = 'md', className = '' }) => {
    const sizes = {
        sm: ['h-8 w-8', 'text-sm', 20],
        md: ['h-10 w-10', 'text-base', 24],
        lg: ['h-12 w-12', 'text-lg', 30],
        xl: ['h-16 w-16', 'text-xl', 40],
    };
    const [sizeClass, textClass, iconSize] = sizes[size] || sizes.md;

    return (
        <div className={`relative flex items-center justify-center rounded-full overflow-hidden bg-gray-200 dark:bg-gray-600 text-gray-700 dark:text-gray-300 font-semibold ${sizeClass} ${className}`}>
            {src
                ? <img src={src} alt={alt || 'Avatar'} className="absolute inset-0 object-cover w-full h-full" />
                : <span className={`flex items-center justify-center h-full w-full ${typeof fallback === 'string' ? textClass : ''}`}>
            {typeof fallback === 'string' ? fallback : (fallback || <UserCircle2 size={iconSize} />)}
          </span>
            }
        </div>
    );
};

/* Badge */
export const Badge = ({ children, variant = 'default', className = '' }) => {
    const styles = {
        primary: 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200',
        secondary: 'bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-200',
        success: 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200',
        warning: 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200',
        destructive: 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200',
        default: 'bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-200', // Kept for clarity
    };

    return (
        <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${styles[variant] || styles.default} ${className}`}>
      {children}
    </span>
    );
};

/* Table Components */

export const Table = ({ children, className = '' }) => (
    <div className={`overflow-x-auto rounded-lg border border-gray-200 dark:border-gray-700 shadow-sm ${className}`}>
        <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
            {children}
        </table>
    </div>
);

export const TableHeader = ({ children, className = '' }) => (
    <thead className={`bg-gray-50 dark:bg-gray-700 ${className}`}>
    {children} {/* Expecting <TableRow> here */}
    </thead>
);

export const TableBody = ({ children, className = '' }) => (
    <tbody className={`divide-y divide-gray-200 dark:divide-gray-700 bg-white dark:bg-gray-800 ${className}`}>
    {children}
    </tbody>
);

export const TableRow = ({ children, className = '', onClick }) => (
    <tr
        onClick={onClick}
        className={`
      cursor-pointer 
      transition-all duration-200 ease-out
      hover:shadow-md hover:scale-[1.02] hover:z-10
      hover:bg-white dark:hover:bg-gray-800 
      relative rounded-md overflow-hidden 
      ${className}
    `}
    >
        {children}
    </tr>
);



export const TableHead = ({ children, className = '' }) => (
    <th
        scope="col"
        className={`px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider ${className}`}
    >
        {children}
    </th>
);

export const TableCell = ({ children, className = '' }) => (
    <td className={`px-6 py-4 whitespace-nowrap text-sm text-gray-900 dark:text-gray-100 ${className}`}>
        {children}
    </td>
);