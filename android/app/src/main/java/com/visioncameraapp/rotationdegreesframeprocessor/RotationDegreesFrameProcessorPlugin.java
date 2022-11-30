package com.visioncameraapp.rotationdegreesframeprocessor;

import androidx.camera.core.ImageProxy;
import com.facebook.react.bridge.WritableNativeArray;
import com.mrousavy.camera.frameprocessor.FrameProcessorPlugin;

public class RotationDegreesFrameProcessorPlugin extends FrameProcessorPlugin {
  @Override
  public Object callback(ImageProxy image, Object[] params) {
    // code goes here
    return image.getImageInfo().getRotationDegrees();
  }

  public RotationDegreesFrameProcessorPlugin() {
    super("rotationDegrees");
  }
}