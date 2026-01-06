import React from 'react'
import { render, screen } from '@testing-library/react'
import '@testing-library/jest-dom'

import TopBar from '../index'

jest.mock('components/header', () => ({
    __esModule: true,
    default: jest.fn(() => <div data-testid="app-header" />),
}))

describe('TopBar', () => {
    beforeEach(() => {
        jest.clearAllMocks()
    })

    it('renders AppHeader', () => {
        render(<TopBar />)
        const AppHeaderMock = require('components/header').default as jest.Mock
        expect(AppHeaderMock).toHaveBeenCalled()
    })

    it('uses mode="auto" by default', () => {
        render(<TopBar />)
        const AppHeaderMock = require('components/header').default as jest.Mock
        expect(AppHeaderMock.mock.calls[0]?.[0]).toEqual(
            expect.objectContaining({ mode: 'auto', showLogo: false })
        )
    })

    it('maps variant="minimal" to mode="minimal"', () => {
        render(<TopBar variant="minimal" />)
        const AppHeaderMock = require('components/header').default as jest.Mock
        expect(AppHeaderMock.mock.calls[0]?.[0]).toEqual(expect.objectContaining({ mode: 'minimal' }))
    })

    it('passes through showLogo', () => {
        render(<TopBar showLogo />)
        const AppHeaderMock = require('components/header').default as jest.Mock
        expect(AppHeaderMock.mock.calls[0]?.[0]).toEqual(expect.objectContaining({ showLogo: true }))
    })
})