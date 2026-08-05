declare module 'qrcode' {
  export interface QRCodeColorOptions {
    dark?: string;
    light?: string;
  }

  export interface ToDataURLOptions {
    errorCorrectionLevel?: 'low' | 'medium' | 'quartile' | 'high';
    margin?: number;
    width?: number;
    color?: QRCodeColorOptions;
    scale?: number;
    type?: string;
  }

  export function toDataURL(text: string, options?: ToDataURLOptions): Promise<string>;
  export function toDataURL(text: string, callback: (error: Error | null, url: string) => void): void;
  export function toCanvas(
    text: string,
    options?: ToDataURLOptions,
    callback?: (error: Error | null, canvas: HTMLCanvasElement) => void
  ): Promise<HTMLCanvasElement> | void;
  export function toString(
    text: string,
    options?: ToDataURLOptions,
    callback?: (error: Error | null, stringValue: string) => void
  ): Promise<string> | void;
}
