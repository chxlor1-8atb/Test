'use client';
import { useState, useRef, useEffect } from 'react';

export default function CustomSelect({
    value,
    onChange,
    options = [],
    placeholder = 'Select option',
    name,
    className = '',
    style = {},
    icon,
    disabled = false
}) {
    const [isOpen, setIsOpen] = useState(false);
    const wrapperRef = useRef(null);

    const selectedOption = options.find(opt => opt.value == value);

    useEffect(() => {
        function handleClickOutside(event) {
            if (wrapperRef.current && !wrapperRef.current.contains(event.target)) {
                setIsOpen(false);
            }
        }
        document.addEventListener("mousedown", handleClickOutside);
        return () => {
            document.removeEventListener("mousedown", handleClickOutside);
        };
    }, [wrapperRef]);

    const handleSelect = (optionValue) => {
        if (disabled) return;

        // Mimic event object for compatibility
        const event = {
            target: {
                name: name,
                value: optionValue
            }
        };

        if (onChange) onChange(event);
        setIsOpen(false);
    };

    return (
        <div
            className={`custom-select-wrapper ${className} ${disabled ? 'disabled' : ''}`}
            ref={wrapperRef}
            style={style}
        >
            <div
                className={`custom-select-trigger ${isOpen ? 'open' : ''}`}
                onClick={() => !disabled && setIsOpen(!isOpen)}
            >
                <div className="value-container">
                    {icon && <i className={`${icon} mr-2`}></i>}
                    <span className={!selectedOption ? 'placeholder' : ''}>
                        {selectedOption ? selectedOption.label || selectedOption.name : placeholder}
                    </span>
                </div>
                <div className="arrow-container">
                    <i className="fas fa-chevron-down arrow"></i>
                </div>
            </div>

            <div className={`custom-options ${isOpen ? 'show' : ''}`}>
                {options.map((opt, index) => (
                    <div
                        key={index}
                        className={`custom-option ${value == opt.value ? 'selected' : ''}`}
                        onClick={() => handleSelect(opt.value)}
                    >
                        {opt.label || opt.name}
                    </div>
                ))}
                {options.length === 0 && (
                    <div className="custom-option disabled text-center text-muted">No options</div>
                )}
            </div>
        </div>
    );
}
