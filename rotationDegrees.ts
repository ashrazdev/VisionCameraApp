import {Platform} from 'react-native';
import {Frame} from 'react-native-vision-camera';

export const rotationDegrees =
  Platform.OS === 'ios'
    ? () => {
        'worklet';
        return 0;
      }
    : (frame: Frame) => {
        'worklet';
        return __rotationDegrees(frame);
      };
