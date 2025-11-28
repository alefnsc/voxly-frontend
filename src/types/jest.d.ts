/// <reference types="jest" />
/// <reference types="@testing-library/jest-dom" />

import '@testing-library/jest-dom';

declare global {
    const jest: {
        fn: () => jest.Mock;
        mock: (moduleName: string, factory?: () => unknown) => void;
        clearAllMocks: () => void;
    };

    namespace jest {
        interface Mock<T = any, Y extends any[] = any> {
            (...args: Y): T;
            mockImplementation: (fn: (...args: Y) => T) => Mock<T, Y>;
            mockReturnValue: (value: T) => Mock<T, Y>;
        }

        interface Matchers<R> {
            toBeInTheDocument(): R;
            toHaveStyle(style: Record<string, any>): R;
            toHaveAttribute(attr: string, value?: string): R;
            toHaveLength(length: number): R;
            toBeLessThan(expected: number): R;
            toBe(expected: any): R;
            toHaveClass(...classNames: string[]): R;
            toBeVisible(): R;
            toContainElement(element: HTMLElement | null): R;
            toHaveTextContent(text: string | RegExp): R;
            toBeNull(): R;
            toBeInTheDocument(): R;
            toHaveValue(value: string | number | string[]): R;
            toBeDisabled(): R;
            toBeEnabled(): R;
            toBeChecked(): R;
            toBeEmpty(): R;
            toBeEmptyDOMElement(): R;
            toBePartiallyChecked(): R;
            toBeRequired(): R;
            toBeValid(): R;
            toBeInvalid(): R;
            toHaveFocus(): R;
            toHaveFormValues(values: Record<string, any>): R;
            toHaveDescription(text: string | RegExp): R;
            toHaveDisplayValue(value: string | RegExp | (string | RegExp)[]): R;
            toBeInstanceOf(expected: any): R;
            toMatchSnapshot(): R;
            toThrow(error?: string | RegExp | Error): R;
            toThrowError(error?: string | RegExp | Error): R;
            toHaveBeenCalled(): R;
            toHaveBeenCalledTimes(times: number): R;
            toHaveBeenCalledWith(...args: any[]): R;
            toHaveBeenLastCalledWith(...args: any[]): R;
            toHaveBeenNthCalledWith(nth: number, ...args: any[]): R;
            toHaveReturned(): R;
            toHaveReturnedTimes(times: number): R;
            toHaveReturnedWith(value: any): R;
            toHaveLastReturnedWith(value: any): R;
            toHaveNthReturnedWith(nth: number, value: any): R;
            toSatisfy(matcher: (received: any) => boolean): R;
            toContain(item: any): R;
            toContainEqual(item: any): R;
            toEqual(expected: any): R;
            toMatch(expected: string | RegExp): R;
            toMatchObject(object: Record<string, any>): R;
            toMatchInlineSnapshot(snapshot?: string): R;
            toStrictEqual(expected: any): R;
            toBeCloseTo(expected: number, precision?: number): R;
            toBeGreaterThan(expected: number): R;
            toBeGreaterThanOrEqual(expected: number): R;
            toBeLessThanOrEqual(expected: number): R;
            toBeNaN(): R;
            toBeNull(): R;
            toBeTruthy(): R;
            toBeFalsy(): R;
            toBeUndefined(): R;
            toBeDefined(): R;
            toBeInstanceOf(expected: any): R;
            toHaveProperty(keyPath: string | string[], value?: any): R;
        }
    }
}

declare namespace jest {
    interface Expect {
        <T = any>(actual: T): jest.Matchers<void>;
    }

    interface Matchers<R> {
        toBeInTheDocument(): R;
        toHaveStyle(style: Record<string, any>): R;
        toHaveAttribute(attr: string, value?: string): R;
        toHaveLength(length: number): R;
    }
}

export {}; 