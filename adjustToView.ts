import {Platform} from 'react-native';

export type Dimensions = {width: number; height: number};
export type Rect = {
  top: number;
  left: number;
  height: number;
  width: number;
};

const adjustToView =
  Platform.OS === 'ios'
    ? (frame: Dimensions, view: Dimensions) => {
        const widthRatio = view.width / frame.width;
        const heightRatio = view.height / frame.height;
        return {
          adjustPoint: (point: {x: number; y: number}) => ({
            x: point.x * widthRatio,
            y: point.y * heightRatio,
          }),
          adjustRect(rect: Rect): Rect {
            return {
              left: rect.left * widthRatio,
              top: rect.top * heightRatio,
              width: rect.width * widthRatio,
              height: rect.height * heightRatio,
            };
          },
        };
      }
    : (frame: Dimensions, view: Dimensions) => {
        'worklet';
        const {width, height} = view;

        const aspectRatio = width / height;

        const frameWidth = frame.width;
        const frameHeight = frame.height;

        const frameAspectRatio = frameWidth / frameHeight;

        let widthRatio: number;
        let heightRatio: number;
        let offsetX = 0;
        let offsetY = 0;
        if (frameAspectRatio < aspectRatio) {
          widthRatio = width / frameWidth;
          const croppedFrameHeight = aspectRatio * frameWidth;
          offsetY = (frameHeight - croppedFrameHeight) / 2;
          heightRatio = height / croppedFrameHeight;
        } else {
          heightRatio = height / frameHeight;
          const croppedFrameWidth = aspectRatio * frameHeight;
          offsetX = (frameWidth - croppedFrameWidth) / 2;
          widthRatio = width / croppedFrameWidth;
        }

        return {
          adjustPoint: (point: {x: number; y: number}) => ({
            x: (point.x - offsetX) * widthRatio,
            y: (point.y - offsetY) * heightRatio,
          }),
          adjustRect: (rect: Rect) => ({
            top: (rect.top - offsetY) * heightRatio,
            left: (rect.left - offsetX) * widthRatio,
            height: rect.height * heightRatio,
            width: rect.width * widthRatio,
          }),
        };
      };

export default adjustToView;
