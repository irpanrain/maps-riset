import GeoJSON from 'ol/format/GeoJSON';
import Map from 'ol/Map';
import View from 'ol/View';
import {Circle as CircleStyle, Fill, Stroke, Style} from 'ol/style';
import {OSM, Vector as VectorSource} from 'ol/source';
import {Tile as TileLayer, Vector as VectorLayer} from 'ol/layer';
import WebGLPointsLayer from "ol/layer/WebGLPoints";
import { fromLonLat } from "ol/proj";

/** @type {VectorSource<import("../src/ol/geom/SimpleGeometry.js").default>} */
let limit = 100;

let source = new VectorSource({
  url: 'http://127.0.0.1:8000/api/previous_position?limit='+limit, //you can change this url for load your geojson data
  format: new GeoJSON(),
});

let secondSource = new VectorSource({
  url: 'http://127.0.0.1:8000/api/latest_position?limit='+limit, //you can change this url for load your geojson data
  format: new GeoJSON(),
});

function setStyle(color) {
  const style = new Style({
    fill: new Fill({
      color: 'rgba(255, 255, 255, 0.6)',
    }),
    stroke: new Stroke({
      color: '#319FD3',
      width: 1,
    }),
    image: new CircleStyle({
      radius: 5,
      fill: new Fill({
        color: color,
      }),
      stroke: new Stroke({
        color: color,
        width: 1,
      }),
    }),
  });

  return style;
}

function setStyleGl(color, size) {
  let circleStyle = {
    symbol: {
      symbolType: "circle",
      size: size,
      color: color,
      rotateWithView: false,
    }
  };
  return circleStyle;
}


//with vector layer
// let pointsLayer = new VectorLayer({
//   source: source,
//   style: setStyle('#35b82e'),
// });
// let secondPointsLayer = new VectorLayer({
//   source: secondSource,
//   style: setStyle('#f7993b'),
// })

//with WebGLPointLayer
let pointsLayer = new WebGLPointsLayer({
  source: source,
  style: setStyleGl('red', 10),
  disableHitDetection: true
});

let secondPointsLayer = new WebGLPointsLayer({
  source: secondSource,
  style: setStyleGl('blue', 7),
  disableHitDetection: true
});

if (navigator.geolocation) {
  navigator.geolocation.getCurrentPosition(position => {
    console.log(position)
    const view = new View({
      center: fromLonLat([position.coords.longitude, position.coords.latitude]),
      zoom: 5,
    });
    
    let map = new Map({
      layers: [
        new TileLayer({
          source: new OSM(),
          maxZoom: 10
        }),
      ],
      target: 'map',
      view: view,
    });

    map.addLayer(pointsLayer)
    map.addLayer(secondPointsLayer)

    let currZoom = map.getView().getZoom();
    console.log(currZoom);
    map.on('moveend', function(e) {
      let newZoom = map.getView().getZoom();
      if (currZoom != newZoom) {
        //set the limit data
        let limitZoom = Math.round(newZoom);
        switch (limitZoom) {
          case 5:
            limit = 100;
            break;
          case 6:
            limit = 80;
            break;
          case 7:
            limit = 60;
            break;
          case 8:
            limit = 40;
            break;
          case 9:
            limit = 20;
            break;
          case 10:
            limit = 10;
            break;
          default:
            if (limitZoom < 5) {
              limit = 100
            } else if (limitZoom > 10) {
              limit = 10;
            }
            break;
        }


        currZoom = newZoom;
        source.setUrl('http://127.0.0.1:8000/api/previous_position?limit='+limit);
        secondSource.setUrl('http://127.0.0.1:8000/api/latest_position?limit='+limit);

        //set new request limit source
        pointsLayer.setSource(source);
        secondPointsLayer.setSource(secondSource);
        
        //refresh new layers source
        pointsLayer.getSource().refresh();
        secondPointsLayer.getSource().refresh();
        
        //render maps with new resource
        map.renderSync();
      }
    });
  });
} else {
  console.log('access geolocation blocked')
  let view = new View({
    center: [0, 0],
    zoom: 5,
  });
  
  let map = new Map({
    layers: [
      new TileLayer({
        source: new OSM(),
        maxZoom: 15
      }),
    ],
    target: 'map',
    view: view,
  });

  map.addLayer(pointsLayer)
}


