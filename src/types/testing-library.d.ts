import '@testing-library/jest-dom';

declare global {
  namespace jest {
    interface Matchers<R> {
      toBeInTheDocument(): R;
      toHaveBeenCalledWith(...args: any[]): R;
      toHaveValue(value: string): R;
      toBeChecked(): R;
      toBe(value: any): R;
      toBeTruthy(): R;
    }
    
    interface Mock<T = any, Y extends any[] = any> {
      mockResolvedValueOnce(value: T): Mock<T, Y>;
      mockRejectedValueOnce(reason: any): Mock<T, Y>;
    }
  }
} 