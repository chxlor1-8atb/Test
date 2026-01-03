'use client';

import { useState, useEffect, useRef } from 'react';

/**
 * EditableCell - Inline editable table cell component
 * Supports: text, number, select, and date input types
 */
export default function EditableCell({
    value,
    onSave,
    type = 'text', // 'text' | 'number' | 'select' | 'date'
    options = [], // For select type: [{ value: '', label: '' }]
    placeholder = '',
    disabled = false,
    displayValue = null, // Custom display value (e.g., for showing label instead of id)
    className = '',
}) {
    const [isEditing, setIsEditing] = useState(false);
    const [editValue, setEditValue] = useState(value);
    const [isSaving, setIsSaving] = useState(false);
    const inputRef = useRef(null);

    useEffect(() => {
        setEditValue(value);
    }, [value]);

    useEffect(() => {
        if (isEditing && inputRef.current) {
            inputRef.current.focus();
            if (type === 'text' || type === 'number') {
                inputRef.current.select();
            }
        }
    }, [isEditing, type]);

    const handleClick = () => {
        if (!disabled && !isEditing) {
            setIsEditing(true);
            setEditValue(value);
        }
    };

    const handleSave = async () => {
        if (editValue === value) {
            setIsEditing(false);
            return;
        }

        setIsSaving(true);
        try {
            await onSave(editValue);
            setIsEditing(false);
        } catch (error) {
            console.error('Save failed:', error);
            setEditValue(value); // Revert on error
        } finally {
            setIsSaving(false);
        }
    };

    const handleCancel = () => {
        setEditValue(value);
        setIsEditing(false);
    };

    const handleKeyDown = (e) => {
        if (e.key === 'Enter') {
            e.preventDefault();
            handleSave();
        } else if (e.key === 'Escape') {
            handleCancel();
        }
    };

    const handleBlur = (e) => {
        // Don't save on blur if clicking save/cancel buttons
        if (e.relatedTarget?.closest('.editable-cell-actions')) {
            return;
        }
        handleSave();
    };

    const renderInput = () => {
        switch (type) {
            case 'select':
                return (
                    <select
                        ref={inputRef}
                        value={editValue}
                        onChange={(e) => setEditValue(e.target.value)}
                        onKeyDown={handleKeyDown}
                        onBlur={handleBlur}
                        disabled={isSaving}
                        className="editable-cell-select"
                    >
                        {options.map((opt) => (
                            <option key={opt.value} value={opt.value}>
                                {opt.label}
                            </option>
                        ))}
                    </select>
                );
            case 'date':
                return (
                    <input
                        ref={inputRef}
                        type="date"
                        value={editValue || ''}
                        onChange={(e) => setEditValue(e.target.value)}
                        onKeyDown={handleKeyDown}
                        onBlur={handleBlur}
                        disabled={isSaving}
                        className="editable-cell-input"
                    />
                );
            case 'number':
                return (
                    <input
                        ref={inputRef}
                        type="number"
                        value={editValue}
                        onChange={(e) => setEditValue(e.target.value)}
                        onKeyDown={handleKeyDown}
                        onBlur={handleBlur}
                        disabled={isSaving}
                        placeholder={placeholder}
                        className="editable-cell-input"
                    />
                );
            default:
                return (
                    <input
                        ref={inputRef}
                        type="text"
                        value={editValue}
                        onChange={(e) => setEditValue(e.target.value)}
                        onKeyDown={handleKeyDown}
                        onBlur={handleBlur}
                        disabled={isSaving}
                        placeholder={placeholder}
                        className="editable-cell-input"
                    />
                );
        }
    };

    const display = displayValue !== null ? displayValue : (value || '-');

    if (disabled) {
        return <span className={`editable-cell disabled ${className}`}>{display}</span>;
    }

    return (
        <div className={`editable-cell ${isEditing ? 'editing' : ''} ${isSaving ? 'saving' : ''} ${className}`}>
            {isEditing ? (
                <div className="editable-cell-editor">
                    {renderInput()}
                    {isSaving && <span className="editable-cell-spinner"></span>}
                </div>
            ) : (
                <div className="editable-cell-display" onClick={handleClick}>
                    <span className="editable-cell-value">{display}</span>
                    <i className="fas fa-pen editable-cell-icon"></i>
                </div>
            )}
        </div>
    );
}
