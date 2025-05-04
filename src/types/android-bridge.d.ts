
declare global {
  interface Window {
    AndroidLogger?: {
      logDebug: (tag: string, message: string) => void;
    };
    AndroidCamera?: {
      takePhoto: (requestId: string) => boolean | Promise<boolean>;
      captureVideo?: (requestId: string) => void;
      openCamera?: () => void;
      checkCameraPermission?: () => boolean;
      requestCameraPermission?: () => Promise<boolean>;
    };
    receiveImageFromAndroid?: (requestId: string, base64Data: string, fileName: string, mimeType: string) => void;
    receiveAndroidCameraError?: (requestId: string, errorCode: string, errorMessage: string) => void;
    androidBridge?: {
      captureRequests: Map<number, (file: File | null) => void>;
      nextRequestId: number;
    };
  }
}

// This is an empty export to make this file a module
export {};
