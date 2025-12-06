import { Circle as CircleStyle, Fill, Stroke, Style, Text } from 'ol/style';

// Cache styles for better performance
const styleCache = {};

export const clusterStyle = (feature) => {
  // Check if it's a cluster feature or a raw feature
  const features = feature.get('features');
  const size = features ? features.length : 1;

  let style = styleCache[size];
  
  if (!style) {
    if (size > 1) {
      // Cluster style
      style = new Style({
        image: new CircleStyle({
          radius: 10 + Math.min(size, 20), // Dynamic size
          stroke: new Stroke({
            color: '#fff',
          }),
          fill: new Fill({
            color: '#3399CC',
          }),
        }),
        text: new Text({
          text: size.toString(),
          fill: new Fill({
            color: '#fff',
          }),
          scale: 1.2,
        }),
      });
    } else {
      // Single point style (original red point)
      style = new Style({
        image: new CircleStyle({
          radius: 7,
          fill: new Fill({ color: 'red' }),
          stroke: new Stroke({
            color: 'white',
            width: 2,
          }),
        }),
      });
    }
    styleCache[size] = style;
  }
  return style;
};
