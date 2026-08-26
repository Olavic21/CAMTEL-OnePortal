import { describe, it, expect, vi } from 'vitest'
import { render, screen } from '@testing-library/react'
import '@testing-library/jest-dom'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { MemoryRouter } from 'react-router-dom'

import ClientDashboardPage from '../pages/ClientDashboardPage'

// Mock httpClient used by the component to return zero counts
vi.mock('@/shared/lib/axios', () => ({
  httpClient: {
    get: vi.fn().mockResolvedValue({ data: { total: 0, in_progress: 0, completed: 0, rejected: 0 } }),
  },
}))

describe('ClientDashboardPage empty state', () => {
  it('renders EmptyState when there are no subscriptions', async () => {
    const qc = new QueryClient({ defaultOptions: { queries: { retry: false } } })
    render(
      <MemoryRouter>
        <QueryClientProvider client={qc}>
          <ClientDashboardPage />
        </QueryClientProvider>
      </MemoryRouter>,
    )

    const titles = await screen.findAllByText(/Mon Espace Client|Tableau de bord/i)
    expect(titles.length).toBeGreaterThan(0)
    // The EmptyState component renders a helpful hint when total === 0
    expect(await screen.findByText(/Vous n'avez aucune demande en cours/i)).toBeInTheDocument()
  })
})
