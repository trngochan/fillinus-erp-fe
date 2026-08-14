import { describe, expect, it } from 'vitest'
import { getApiErrorMessage, matchErrorField, parseApiFieldErrors } from './axios'

function withResponseData(data: { error?: string; message?: string }) {
  return { response: { data } }
}

describe('getApiErrorMessage', () => {
  it('prefers response.data.error over data.message', () => {
    expect(getApiErrorMessage(withResponseData({ error: 'boom', message: 'ignored' }), 'fallback')).toBe('boom')
  })

  it('falls back to response.data.message when no error field', () => {
    expect(getApiErrorMessage(withResponseData({ message: 'nice message' }), 'fallback')).toBe('nice message')
  })

  it('falls back to the caller-supplied fallback when neither field is present', () => {
    expect(getApiErrorMessage(withResponseData({}), 'fallback')).toBe('fallback')
  })

  it('falls back when the error has no response at all (e.g. network error)', () => {
    expect(getApiErrorMessage(new Error('Network Error'), 'fallback')).toBe('fallback')
  })
})

describe('parseApiFieldErrors', () => {
  it('parses a single flat field error', () => {
    const result = parseApiFieldErrors(withResponseData({ error: 'leadName: Lead name is required' }))
    expect(result).toEqual({ flat: { leadName: 'Lead name is required' }, detail: {} })
  })

  it('parses multiple flat field errors separated by "; "', () => {
    const result = parseApiFieldErrors(
      withResponseData({ error: 'phone: Invalid phone; email: Invalid email format' })
    )
    expect(result).toEqual({
      flat: { phone: 'Invalid phone', email: 'Invalid email format' },
      detail: {},
    })
  })

  it('parses nested list-item field errors (details[0].field: message)', () => {
    const result = parseApiFieldErrors(
      withResponseData({ error: 'details[0].serviceProduct: Service/Product is required' })
    )
    expect(result).toEqual({
      flat: {},
      detail: { 0: { serviceProduct: 'Service/Product is required' } },
    })
  })

  it('merges multiple sub-field errors for the same list index', () => {
    const result = parseApiFieldErrors(
      withResponseData({
        error: 'details[0].serviceProduct: is required; details[0].quantity: must be positive',
      })
    )
    expect(result).toEqual({
      flat: {},
      detail: { 0: { serviceProduct: 'is required', quantity: 'must be positive' } },
    })
  })

  it('handles a mix of flat and nested errors in the same message', () => {
    const result = parseApiFieldErrors(
      withResponseData({ error: 'leadName: is required; details[1].unit: too long' })
    )
    expect(result).toEqual({
      flat: { leadName: 'is required' },
      detail: { 1: { unit: 'too long' } },
    })
  })

  it('returns null for a plain business-rule message not in "field: message" shape', () => {
    const result = parseApiFieldErrors(
      withResponseData({ error: 'Please enter at least one contact method.' })
    )
    expect(result).toBeNull()
  })

  it('returns null when there is no response data at all', () => {
    expect(parseApiFieldErrors(new Error('Network Error'))).toBeNull()
  })
})

describe('matchErrorField', () => {
  it('returns the field for the first matching rule', () => {
    const field = matchErrorField('An Opportunity named "Foo" already exists.', [
      [/already exists/, 'opportunityName'],
      [/at least one contact/, 'phone'],
    ])
    expect(field).toBe('opportunityName')
  })

  it('returns null when no rule matches', () => {
    const field = matchErrorField('Some unrelated error', [[/already exists/, 'opportunityName']])
    expect(field).toBeNull()
  })
})
