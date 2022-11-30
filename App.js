import {runOnJS, useDerivedValue} from 'react-native-reanimated';

import React, {useCallback, useEffect, useMemo, useRef, useState} from 'react';
import {
  Platform,
  Pressable,
  StyleSheet,
  useWindowDimensions,
  View,
} from 'react-native';

import {
  useCameraDevices,
  Camera,
  useFrameProcessor,
  useCameraFormat,
} from 'react-native-vision-camera';
// import {useIsFocused} from '@react-navigation/native';
import {scanFaces} from 'vision-camera-face-detector';
import IonIcon from 'react-native-vector-icons/Ionicons';
import {CONTENT_SPACING, MAX_ZOOM_FACTOR, SAFE_AREA_PADDING} from './Constants';

import {rotationDegrees} from './rotationDegrees';
import adjustToView from './adjustToView';

import Reanimated, {
  useAnimatedProps,
  useSharedValue,
} from 'react-native-reanimated';

import {useIsForeground} from './hooks/useIsForeground';
import {CaptureButton} from './CaptureButton';

const ReanimatedCamera = Reanimated.createAnimatedComponent(Camera);
Reanimated.addWhitelistedNativeProps({
  zoom: true,
});

const BUTTON_SIZE = 40;

const App = () => {
  const camera = useRef(null);

  const format = useCameraFormat();
  const devices = useCameraDevices('wide-angle-camera');

  const [frameDimensions, setFrameDimensions] = useState();
  const [hasPermission, setHasPermission] = useState(false);
  const [isCameraInitialized, setIsCameraInitialized] = useState(false);
  const [faces, setFaces] = useState();
  const [cameraPosition, setCameraPosition] = useState('front');
  const [flash, setFlash] = useState('off');

  const device = devices[cameraPosition];

  const zoom = useSharedValue(0);
  const isPressingButton = useSharedValue(true);
  const {width, height} = useWindowDimensions();

  const minZoom = device?.minZoom ?? 1;
  const maxZoom = Math.min(device?.maxZoom ?? 1, MAX_ZOOM_FACTOR);
  const supportsFlash = device?.hasFlash ?? false;

  // check if camera page is active
  //const isFocussed = useIsFocused();
  const isForeground = useIsForeground();
  const isActive = true && isForeground;
  const cameraAnimatedProps = useAnimatedProps(() => {
    const z = Math.max(Math.min(zoom.value, maxZoom), minZoom);
    return {
      zoom: z,
    };
  }, [maxZoom, minZoom, zoom]);

  const supportsCameraFlipping = useMemo(
    () => devices.back != null && devices.front != null,
    [devices.back, devices.front],
  );
  const style = useMemo(
    () => ({position: 'absolute', top: 0, left: 0, width, height}),
    [width, height],
  );

  useEffect(() => {
    (async () => {
      const status = await Camera.requestCameraPermission();
      setHasPermission(status === 'authorized');
    })();
  }, []);

  const onFlipCameraPressed = useCallback(() => {
    setCameraPosition(p => (p === 'back' ? 'front' : 'back'));
  }, []);
  const onFlashPressed = useCallback(() => {
    setFlash(f => (f === 'off' ? 'on' : 'off'));
  }, []);
  const onError = useCallback(error => {
    console.error(error);
  }, []);
  const onInitialized = useCallback(() => {
    console.log('Camera initialized!');
    setIsCameraInitialized(true);
  }, []);
  const handleScan = useCallback((frame, rotationDegrees$, newFaces) => {
    const isRotated = rotationDegrees$ === 90 || rotationDegrees$ === 270;
    setFrameDimensions(
      isRotated
        ? {
            width: frame.height,
            height: frame.width,
          }
        : {
            width: frame.width,
            height: frame.height,
          },
    );
    setFaces(newFaces);
  }, []);
  const frameProcessor = useFrameProcessor(frame => {
    'worklet';

    const rotation = rotationDegrees(frame);

    const scanface = scanFaces(frame);

    runOnJS(handleScan)(frame, rotation, scanface);
  }, []);
  const onMediaCaptured = useCallback(media => {
    console.log(`Media captured! ${JSON.stringify(media)}`);
    // navigation.navigate('MediaPage', {
    //   path: media.path,
    //   type: type,
    // });
  }, []);
  const setIsPressingButton = useCallback(
    _isPressingButton => {
      isPressingButton.value = _isPressingButton;
    },
    [isPressingButton],
  );

  return (
    <View style={styles.container}>
      {device != null && (
        <Reanimated.View style={StyleSheet.absoluteFill}>
          <ReanimatedCamera
            ref={camera}
            format={format}
            style={StyleSheet.absoluteFill}
            device={device}
            fps={30}
            hdr={true}
            photo={true}
            enableZoomGesture={true}
            isActive={isActive}
            onInitialized={onInitialized}
            onError={onError}
            animatedProps={cameraAnimatedProps}
            frameProcessor={frameProcessor}
            // frameProcessor={() => {
            //   randomWidth.value = Math.round(Math.random() * 350);
            // }}
            orientation="portrait"
            frameProcessorFps={30}
          />
        </Reanimated.View>
      )}

      <View style={style}>
        {frameDimensions &&
          (() => {
            const mirrored =
              Platform.OS === 'android' && cameraPosition === 'front';
            const {adjustRect} = adjustToView(frameDimensions, {width, height});

            return faces?.map((i, index) => {
              const {left, ...others} = adjustRect(i.bounds);

              return (
                <View
                  key={index}
                  style={[
                    styles.boundingBox,
                    {
                      ...others,
                      [mirrored ? 'right' : 'left']: left,
                    },
                  ]}
                />
              );
            });
          })()}
      </View>

      <CaptureButton
        style={styles.captureButton}
        camera={camera}
        onMediaCaptured={onMediaCaptured}
        cameraZoom={zoom}
        minZoom={minZoom}
        maxZoom={maxZoom}
        flash={supportsFlash ? flash : 'off'}
        enabled={isCameraInitialized && isActive}
        setIsPressingButton={setIsPressingButton}
      />

      <View style={styles.rightButtonRow}>
        {supportsCameraFlipping && (
          <Pressable
            style={styles.button}
            onPress={onFlipCameraPressed}
            disabledOpacity={0.4}>
            <IonIcon name="camera-reverse" color="white" size={24} />
          </Pressable>
        )}
        {supportsFlash && (
          <Pressable
            style={styles.button}
            onPress={onFlashPressed}
            disabledOpacity={0.4}>
            <IonIcon
              name={flash === 'on' ? 'flash' : 'flash-off'}
              color="white"
              size={24}
            />
          </Pressable>
        )}
      </View>
    </View>
  );
};

export default App;

const styles = StyleSheet.create({
  boundingBox: {
    position: 'absolute',
    borderColor: '#fff',
    borderWidth: 1,
  },
  container: {
    flex: 1,
    backgroundColor: 'black',
  },
  captureButton: {
    position: 'absolute',
    alignSelf: 'center',
    bottom: SAFE_AREA_PADDING.paddingBottom,
  },
  button: {
    marginBottom: CONTENT_SPACING,
    width: BUTTON_SIZE,
    height: BUTTON_SIZE,
    borderRadius: BUTTON_SIZE / 2,
    backgroundColor: 'rgba(140, 140, 140, 0.3)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  rightButtonRow: {
    position: 'absolute',
    right: SAFE_AREA_PADDING.paddingRight,
    top: SAFE_AREA_PADDING.paddingTop,
  },
  text: {
    color: 'white',
    fontSize: 11,
    fontWeight: 'bold',
    textAlign: 'center',
  },
});
