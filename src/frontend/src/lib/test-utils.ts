import { render } from '@testing-library/react'
import type { ReactElement } from 'react'

export const renderWithProviders = (ui: ReactElement) => {
  return render(ui)
}
