import '@testing-library/jest-dom';

declare global {
    namespace jest {
        interface Matchers<R> {
            toBeInTheDocument(): R;
            toHaveBeenCalledTimes(times: number): R;
            toHaveBeenCalledWith(...args: any[]): R;
        }
    }
} 