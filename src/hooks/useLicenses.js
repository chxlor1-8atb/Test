/**
 * @deprecated This file is deprecated as of 2026-01-08
 * Please use useLicenses from '@/hooks/useData' instead.
 * The SWR-based version provides better caching and deduplication.
 * 
 * This file will be removed in a future update.
 */

'use client';

import { useState, useCallback, useEffect } from 'react';
import { API_ENDPOINTS } from '@/constants';
import { showSuccess, showError, confirmDelete } from '@/utils/alerts';
import { toInputDateFormat } from '@/utils/formatters';

/**
 * Custom hook for license CRUD operations
 * Encapsulates all license-related data fetching and mutations
 * 
 * @param {Object} params - Hook parameters
 * @returns {Object} License data and handlers
 */
export function useLicenses({ page, limit, search, filterType, filterStatus }) {
    const [licenses, setLicenses] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);

    /**
     * Fetches licenses from API
     */
    const fetchLicenses = useCallback(async () => {
        setLoading(true);
        setError(null);

        try {
            const params = new URLSearchParams({
                page,
                limit,
                search: search || '',
                license_type: filterType || '',
                status: filterStatus || ''
            });

            const response = await fetch(`${API_ENDPOINTS.LICENSES}?${params}`);
            const data = await response.json();

            if (data.success) {
                setLicenses(data.licenses);
                return data.pagination;
            } else {
                throw new Error(data.message || 'Failed to fetch licenses');
            }
        } catch (err) {
            setError(err.message);
            return null;
        } finally {
            setLoading(false);
        }
    }, [page, limit, search, filterType, filterStatus]);

    /**
     * Creates a new license
     */
    const createLicense = useCallback(async (formData) => {
        try {
            const response = await fetch(API_ENDPOINTS.LICENSES, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(formData)
            });
            const data = await response.json();

            if (data.success) {
                showSuccess(data.message);
                return true;
            } else {
                showError(data.message);
                return false;
            }
        } catch (err) {
            showError(err.message);
            return false;
        }
    }, []);

    /**
     * Updates a license field inline
     */
    const updateLicenseField = useCallback(async (licenseId, field, value) => {
        const license = licenses.find(l => l.id === licenseId);
        if (!license) throw new Error('License not found');

        const updateData = {
            id: licenseId,
            shop_id: license.shop_id,
            license_type_id: license.license_type_id,
            license_number: license.license_number,
            issue_date: toInputDateFormat(license.issue_date),
            expiry_date: toInputDateFormat(license.expiry_date),
            status: license.status,
            notes: license.notes || '',
            [field]: value
        };

        const response = await fetch(API_ENDPOINTS.LICENSES, {
            method: 'PUT',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(updateData)
        });
        const data = await response.json();

        if (data.success) {
            // Optimistic update
            setLicenses(prev => prev.map(l =>
                l.id === licenseId ? { ...l, [field]: value } : l
            ));
            return true;
        } else {
            throw new Error(data.message);
        }
    }, [licenses]);

    /**
     * Deletes a license with confirmation
     */
    const deleteLicense = useCallback(async (id) => {
        const confirmed = await confirmDelete('ข้อมูลใบอนุญาต');
        if (!confirmed) return false;

        try {
            const response = await fetch(`${API_ENDPOINTS.LICENSES}?id=${id}`, {
                method: 'DELETE'
            });
            const data = await response.json();

            if (data.success) {
                showSuccess(data.message);
                return true;
            } else {
                showError(data.message);
                return false;
            }
        } catch (err) {
            showError(err.message);
            return false;
        }
    }, []);

    return {
        licenses,
        loading,
        error,
        fetchLicenses,
        createLicense,
        updateLicenseField,
        deleteLicense,
        refetch: fetchLicenses
    };
}

export default useLicenses;
