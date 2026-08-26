import { describe, it, expect, vi } from 'vitest'
import { render, screen } from '@testing-library/react'
import '@testing-library/jest-dom'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { MemoryRouter } from 'react-router-dom'

import ClientDashboardPage from '../pages/ClientDashboardPage'

// Mock httpClient used by the component
vi.mock('@/shared/lib/axios', () => ({
  httpClient: {
    get: vi.fn().mockResolvedValue({ data: { total: 0, in_progress: 0, completed: 0, rejected: 0 } }),
  },
}))

describe('ClientDashboardPage', () => {
  it('renders dashboard header and KPI placeholders', async () => {
    const qc = new QueryClient({ defaultOptions: { queries: { retry: false } } })
    render(
      <MemoryRouter>
        <QueryClientProvider client={qc}>
          <ClientDashboardPage />
        </QueryClientProvider>
      </MemoryRouter>,
    )

    const headings = await screen.findAllByText(/Mon Espace Client|Tableau de bord/i)
    expect(headings.length).toBeGreaterThan(0)
    expect(screen.getByText(/Total|total/i)).toBeInTheDocument()
  })
})
