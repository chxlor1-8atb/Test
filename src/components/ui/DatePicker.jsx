'use client';
import { useState, useRef, useEffect } from 'react';

const DAYS_TH = ['อา', 'จ', 'อ', 'พ', 'พฤ', 'ศ', 'ส'];
const DAYS_EN = ['Su', 'Mo', 'Tu', 'We', 'Th', 'Fr', 'Sa'];
const MONTHS_TH = ['มกราคม', 'กุมภาพันธ์', 'มีนาคม', 'เมษายน', 'พฤษภาคม', 'มิถุนายน',
    'กรกฎาคม', 'สิงหาคม', 'กันยายน', 'ตุลาคม', 'พฤศจิกายน', 'ธันวาคม'];

export default function DatePicker({
    value,
    onChange,
    name,
    placeholder = 'เลือกวันที่',
    disabled = false,
    lang = 'th', // 'th' or 'en'
    className = '',
    onBlur,
    autoFocus = false
}) {
    const [isOpen, setIsOpen] = useState(false);
    const [viewDate, setViewDate] = useState(value ? new Date(value) : new Date());
    const wrapperRef = useRef(null);

    const selectedDate = value ? new Date(value) : null;
    const DAYS = lang === 'th' ? DAYS_TH : DAYS_EN;

    useEffect(() => {
        if (autoFocus && !disabled) {
            setIsOpen(true);
        }
    }, [autoFocus, disabled]);

    useEffect(() => {
        function handleClickOutside(event) {
            if (wrapperRef.current && !wrapperRef.current.contains(event.target)) {
                setIsOpen(false);
                // Call onBlur when clicking outside if currently open or purely based on focus logic?
                // Actually the onBlur handler on div handles focus loss. 
                // But clicking outside closes the dropdown.
            }
        }
        document.addEventListener("mousedown", handleClickOutside);
        return () => document.removeEventListener("mousedown", handleClickOutside);
    }, []);

    // Handle focus loss
    const handleBlur = (e) => {
        if (onBlur && wrapperRef.current && !wrapperRef.current.contains(e.relatedTarget)) {
            // Delay slightly to allow click events to process
            setTimeout(() => {
                onBlur(e);
            }, 100);
        }
    };

    // Get days in month
    const getDaysInMonth = (year, month) => {
        return new Date(year, month + 1, 0).getDate();
    };

    // Get first day of month (0 = Sunday)
    const getFirstDayOfMonth = (year, month) => {
        return new Date(year, month, 1).getDay();
    };

    // Navigate months
    const prevMonth = () => {
        setViewDate(new Date(viewDate.getFullYear(), viewDate.getMonth() - 1, 1));
    };

    const nextMonth = () => {
        setViewDate(new Date(viewDate.getFullYear(), viewDate.getMonth() + 1, 1));
    };

    // Handle date selection
    const handleSelectDate = (day) => {
        if (disabled) return;

        const newDate = new Date(viewDate.getFullYear(), viewDate.getMonth(), day);
        // Adjust for timezone offset to prevent off-by-one errors when converting to string
        // Actually toISOString() is UTC. We want YYYY-MM-DD in local?
        // Let's use simple formatting to avoid TZ issues
        const year = newDate.getFullYear();
        const month = String(newDate.getMonth() + 1).padStart(2, '0');
        const d = String(day).padStart(2, '0');
        const formattedDate = `${year}-${month}-${d}`;

        const event = {
            target: {
                name: name,
                value: formattedDate
            }
        };

        if (onChange) onChange(event);
        setIsOpen(false);
    };

    // Format display date
    const formatDisplayDate = (dateStr) => {
        if (!dateStr) return '';
        const date = new Date(dateStr);
        return date.toLocaleDateString('th-TH', {
            day: '2-digit',
            month: '2-digit',
            year: 'numeric'
        });
    };

    // Generate calendar days
    const renderCalendar = () => {
        const year = viewDate.getFullYear();
        const month = viewDate.getMonth();
        const daysInMonth = getDaysInMonth(year, month);
        const firstDay = getFirstDayOfMonth(year, month);

        const days = [];

        // Empty cells for days before first day of month
        for (let i = 0; i < firstDay; i++) {
            days.push(<div key={`empty-${i}`} className="datepicker-day empty"></div>);
        }

        // Days of the month
        for (let day = 1; day <= daysInMonth; day++) {
            const isSelected = selectedDate &&
                selectedDate.getDate() === day &&
                selectedDate.getMonth() === month &&
                selectedDate.getFullYear() === year;

            const isToday = new Date().getDate() === day &&
                new Date().getMonth() === month &&
                new Date().getFullYear() === year;

            days.push(
                <div
                    key={day}
                    className={`datepicker-day ${isSelected ? 'selected' : ''} ${isToday ? 'today' : ''}`}
                    onClick={(e) => {
                        e.stopPropagation(); // Prevent bubbling causing issues
                        handleSelectDate(day);
                    }}
                >
                    {day}
                </div>
            );
        }

        return days;
    };

    return (
        <div
            className={`datepicker-wrapper ${disabled ? 'disabled' : ''} ${className}`}
            ref={wrapperRef}
            tabIndex={disabled ? -1 : 0}
            onBlur={handleBlur}
            style={{ outline: 'none' }} // Remove focus outline
        >
            {/* Input Trigger */}
            <div
                className={`datepicker-trigger ${isOpen ? 'open' : ''}`}
                onClick={() => !disabled && setIsOpen(!isOpen)}
            >
                <i className="fas fa-calendar-alt"></i>
                <span className={!value ? 'placeholder' : ''}>
                    {value ? formatDisplayDate(value) : placeholder}
                </span>
                <i className={`fas fa-chevron-down arrow ${isOpen ? 'open' : ''}`}></i>
            </div>

            {/* Calendar Dropdown */}
            {isOpen && (
                <div className="datepicker-dropdown">
                    {/* Header */}
                    <div className="datepicker-header">
                        <button type="button" className="datepicker-nav" onClick={prevMonth}>
                            <i className="fas fa-chevron-left"></i>
                        </button>
                        <span className="datepicker-title">
                            {MONTHS_TH[viewDate.getMonth()]} {viewDate.getFullYear() + 543}
                        </span>
                        <button type="button" className="datepicker-nav" onClick={nextMonth}>
                            <i className="fas fa-chevron-right"></i>
                        </button>
                    </div>

                    {/* Day Headers */}
                    <div className="datepicker-days-header">
                        {DAYS.map((day, i) => (
                            <div key={i} className="datepicker-day-name">{day}</div>
                        ))}
                    </div>

                    {/* Calendar Grid */}
                    <div className="datepicker-days">
                        {renderCalendar()}
                    </div>

                    {/* Footer */}
                    <div className="datepicker-footer">
                        <div className="datepicker-input-display">
                            {value ? formatDisplayDate(value) : '--/--/----'}
                        </div>
                        <button
                            type="button"
                            className="datepicker-set-btn"
                            onClick={(e) => {
                                e.stopPropagation();
                                setIsOpen(false);
                            }}
                        >
                            ตกลง
                        </button>
                    </div>
                </div>
            )}
        </div>
    );
}
