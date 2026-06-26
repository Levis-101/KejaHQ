'use client'

import { useState, useEffect } from 'react'
import { createServerSupabaseClient } from '@/lib/supabase-server'
import { getUser } from '@/lib/supabase-server'
import Link from 'next/link'
import { useRouter, usePathname } from 'next/navigation'

interface UnitFormValues {
  unit_number: string
  floor?: number | null
  bedrooms: number
  rent_amount: number
  status: 'vacant' | 'occupied' | 'maintenance'
  notes?: string
}

interface UnitFormProps {
  propertyId?: string
  onSuccess?: () => void
}

export default async function UnitForm({ propertyId, onSuccess }: UnitFormProps) {
  const supabase = await createServerSupabaseClient()
  const user = await getUser()
  const router = useRouter()
  const pathname = usePathname()

  // Extract IDs from path if editing (e.g., /properties/1/units/2/edit)
  const pathParts = pathname.split('/')
  const isEditing = pathParts.includes('edit')
  const unitId = isEditing && pathParts.length >= 4 ? pathParts[pathParts.length - 2] : null
  const inferredPropertyId = isEditing && pathParts.length >= 4 ? pathParts[pathParts.length - 4] : null

  // Use provided propertyId or infer from route
  const actualPropertyId = propertyId || inferredPropertyId

  if (!actualPropertyId && !isEditing) {
    // If we're creating a unit and don't have a property ID, redirect to properties
    router.push('/properties')
    return null
  }

  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [unitData, setUnitData] = useState<UnitFormValues | null>(null)
  const [formValues, setFormValues] = useState<UnitFormValues>({
    unit_number: '',
    floor: null,
    bedrooms: 1,
    rent_amount: 0,
    status: 'vacant',
    notes: '',
  })

  // Fetch unit data if editing
  useEffect(() => {
    if (isEditing && unitId) {
      loadUnitData()
    }
  }, [isEditing, unitId])

  const loadUnitData = async () => {
    setLoading(true)
    try {
      const { data, error } = await supabase
        .from('units')
        .select('*')
        .eq('id', unitId)
        .single()

      if (error) throw error
      if (data) {
        setUnitData({
          unit_number: data.unit_number,
          floor: data.floor ?? null,
          bedrooms: data.bedrooms,
          rent_amount: data.rent_amount,
          status: data.status,
          notes: data.notes ?? undefined,
        })
        setFormValues({
          unit_number: data.unit_number,
          floor: data.floor ?? null,
          bedrooms: data.bedrooms,
          rent_amount: data.rent_amount,
          status: data.status,
          notes: data.notes ?? '',
        })
      }
    } catch (err: any) {
      console.error('Error loading unit data:', err)
      setError(err.message || 'Failed to load unit data')
    } finally {
      setLoading(false)
    }
  }

  const handleChange = (field: keyof UnitFormValues, value: any) => {
    setFormValues(prev => ({
      ...prev,
      [field]: field === 'rent_amount' || field === 'bedrooms' ?
        (value === '' ? null : parseFloat(value)) :
        field === 'floor' ?
          (value === '' ? null : parseInt(value)) :
        value
    }))
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setError(null)

    try {
      // Validate required fields
      if (!formValues.unit_number.trim()) {
        throw new Error('Unit number is required')
      }
      if (formValues.bedrooms === null || formValues.bedrooms < 1) {
        throw new Error('Bedrooms must be at least 1')
      }
      if (formValues.rent_amount === null || formValues.rent_amount < 0) {
        throw new Error('Rent amount must be at least 0')
      }

      let result
      if (isEditing && unitId) {
        // Update existing unit
        result = await supabase
          .from('units')
          .update({
            unit_number: formValues.unit_number,
            floor: formValues.floor,
            bedrooms: formValues.bedrooms,
            rent_amount: formValues.rent_amount,
            status: formValues.status,
            notes: formValues.notes ?? null,
          })
          .eq('id', unitId)
      } else {
        // Create new unit
        if (!actualPropertyId) {
          throw new Error('Property ID is required')
        }
        result = await supabase
          .from('units')
          .insert({
            property_id: actualPropertyId,
            unit_number: formValues.unit_number,
            floor: formValues.floor,
            bedrooms: formValues.bedrooms,
            rent_amount: formValues.rent_amount,
            status: formValues.status,
            notes: formValues.notes ?? null,
          })
      }

      const { error } = result
      if (error) throw error

      // Reset form
      setFormValues({
        unit_number: '',
        floor: null,
        bedrooms: 1,
        rent_amount: 0,
        status: 'vacant',
        notes: '',
      })

      // Call onSuccess callback if provided
      if (onSuccess) {
        onSuccess()
      } else {
        // Default behavior: redirect back to property
        if (actualPropertyId) {
          router.push(`/properties/${actualPropertyId}`)
        }
      }
    } catch (err: any) {
      console.error('Error saving unit:', err)
      setError(err.message || 'Failed to save unit')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="max-w-2xl mx-auto py-8">
      <div className="bg-white/5 backdrop-blur-sm rounded-xl p-8 shadow-lg border border-border">
        <h1 className="mb-6 text-2xl font-bold">
          {isEditing ? 'Edit Unit' : 'Add New Unit'}
        </h1>
        <p className="mb-6 text-muted-foreground">
          {isEditing ? 'Update the details for this unit' : 'Add a new unit to this property'}
        </p>

        {error && (
          <div className="mb-4 p-4 bg-red-50 border border-red-200 rounded-lg text-red-500">
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <label htmlFor="unit_number" className="font-medium">
                Unit Number
              </label>
              <input
                type="text"
                id="unit_number"
                value={formValues.unit_number}
                onChange={(e) => handleChange('unit_number', e.target.value)}
                required
                className={`input-input w-full ${!formValues.unit_number && 'touched' ? 'border-red-500' : ''}`}
                placeholder="e.g., 1A, 3B, Penthouse"
              />
              {!formValues.unit_number && 'touched' && (
                <p className="mt-1 text-sm text-red-500">Unit number is required</p>
              )}
            </div>

            <div className="space-y-2">
              <label htmlFor="floor" className="font-medium">
                Floor Number
              </label>
              <input
                type="number"
                id="floor"
                value={formValues.floor !== null ? formValues.floor : ''}
                onChange={(e) => handleChange('floor', e.target.value)}
                className="input-input w-full"
                min="0"
                placeholder="e.g., 1, 2, 3 (leave blank for ground floor)"
              />
            </div>

            <div className="space-y-2">
              <label htmlFor="bedrooms" className="font-medium">
                Bedrooms
              </label>
              <input
                type="number"
                id="bedrooms"
                value={formValues.bedrooms !== null ? formValues.bedrooms : ''}
                onChange={(e) => handleChange('bedrooms', e.target.value)}
                className={`input-input w-full ${(formValues.bedrooms === null || formValues.bedrooms < 1) && 'touched' ? 'border-red-500' : ''}`}
                min="1"
              />
              {(formValues.bedrooms === null || formValues.bedrooms < 1) && 'touched' && (
                <p className="mt-1 text-sm text-red-500">Must be at least 1 bedroom</p>
              )}
            </div>

            <div className="space-y-2">
              <label htmlFor="rent_amount" className="font-medium">
                Monthly Rent (KES)
              </label>
              <input
                type="number"
                id="rent_amount"
                value={formValues.rent_amount !== null ? formValues.rent_amount : ''}
                onChange={(e) => handleChange('rent_amount', e.target.value)}
                className={`input-input w-full ${(formValues.rent_amount === null || formValues.rent_amount < 0) && 'touched' ? 'border-red-500' : ''}`}
                min="0"
                step="0.01"
              />
              {(formValues.rent_amount === null || formValues.rent_amount < 0) && 'touched' && (
                <p className="mt-1 text-sm text-red-500">Rent must be at least 0</p>
              )}
            </div>
          </div>

          <div className="space-y-2">
            <label htmlFor="status" className="font-medium">
              Unit Status
            </label>
            <select
              id="status"
              value={formValues.status}
              onChange={(e) => handleChange('status', e.target.value as 'vacant' | 'occupied' | 'maintenance')}
              className="select w-full"
            >
              <option value="vacant">Vacant</option>
              <option value="occupied">Occupied</option>
              <option value="maintenance">Under Maintenance</option>
            </select>
          </div>

          <div className="space-y-2">
            <label htmlFor="notes" className="font-medium">
              Notes (optional)
            </label>
            <textarea
              id="notes"
              value={formValues.notes}
              onChange={(e) => setFormValues(prev => ({ ...prev, notes: e.target.value }))}
              rows={4}
              className="textarea w-full"
              placeholder="Any additional details about the unit..."
            />
          </div>

          <div className="flex items-center justify-between">
            <button
              type="submit"
              disabled={loading}
              className={`btn-primary w-full md:w-auto px-6 py-3 ${loading ? 'opacity-50 cursor-not-allowed' : ''}`}
            >
              {loading ? 'Saving...' : isEditing ? 'Update Unit' : 'Create Unit'}
            </button>
            <div className="flex items-center space-x-3">
              <button
                type="button"
                onClick={() => {
                  if (isEditing) {
                    router.push(`/properties/${actualPropertyId}`)
                  } else if (actualPropertyId) {
                    router.push(`/properties/${actualPropertyId}`)
                  } else {
                    router.push('/properties')
                  }
                }}
                className="btn-secondary"
              >
                Cancel
              </button>
              {!isEditing && (
                <button
                  type="button"
                  onClick={() => setFormValues({
                    unit_number: '',
                    floor: null,
                    bedrooms: 1,
                    rent_amount: 0,
                    status: 'vacant',
                    notes: '',
                  })}
                  className="btn-outline"
                >
                  Reset
                </button>
              )}
            </div>
          </div>
        </form>
      </div>
    </div>
  )
}