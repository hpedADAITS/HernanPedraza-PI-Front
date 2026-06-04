export interface SetCoverCubeTextureOptions {
  frontOnly?: boolean;
}

export type CoverCubeTextureMessageSource =
  | {
      kind: 'url';
      url: string;
    }
  | {
      kind: 'bitmap';
      bitmap: ImageBitmap;
    }
  | null;

export type CoverCubeWorkerMessage =
  | {
      type: 'init';
      canvas: OffscreenCanvas;
      width: number;
      height: number;
      devicePixelRatio: number;
      spillScale: number;
      accentColor: string;
    }
  | {
      type: 'resize';
      width: number;
      height: number;
      devicePixelRatio: number;
      spillScale: number;
    }
  | {
      type: 'setAccentColor';
      accentColor: string;
    }
  | {
      type: 'setTexture';
      requestId: number;
      source: CoverCubeTextureMessageSource;
      options: SetCoverCubeTextureOptions;
    }
  | {
      type: 'pop';
      requestId: number;
    }
  | {
      type: 'pointerDown';
      x: number;
      y: number;
    }
  | {
      type: 'pointerMove';
      x: number;
      y: number;
    }
  | {
      type: 'pointerUp';
    }
  | {
      type: 'destroy';
    };
