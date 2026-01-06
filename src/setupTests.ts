import '@testing-library/jest-dom'

// Initialize i18n so `useTranslation()` works in tests.
import './lib/i18n'

// Polyfill TextEncoder/TextDecoder for dependencies expecting Web APIs
// (e.g., jose/livekit/retell in the test environment)
// eslint-disable-next-line @typescript-eslint/no-explicit-any
if (typeof (globalThis as any).TextEncoder === 'undefined') {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  ;(globalThis as any).TextEncoder = class TextEncoder {
    encode(input: string = ''): Uint8Array {
      return Uint8Array.from(Buffer.from(input, 'utf-8'))
    }
  }
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
if (typeof (globalThis as any).TextDecoder === 'undefined') {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  ;(globalThis as any).TextDecoder = class TextDecoder {
    decode(input?: ArrayBuffer | ArrayBufferView): string {
      if (!input) return ''
      if (input instanceof ArrayBuffer) return Buffer.from(input).toString('utf-8')
      return Buffer.from(input.buffer, input.byteOffset, input.byteLength).toString('utf-8')
    }
  }
}

// Mock ResizeObserver
class ResizeObserverMock {
  observe() {}
  unobserve() {}
  disconnect() {}
}

global.ResizeObserver = ResizeObserverMock