const map = L.map('map', {
  crs: L.CRS.Simple,
  minZoom: -4,
  tap: true,
  tapTolerance: 15
});

const tileSize = 1024;

const bounds = [
  [0, 0],
  [4096, 4096]
];
let coordToMapScalar = 1.75
let s1 = coordToMapScalar;
let s2 = coordToMapScalar;
let b1 = -3100;
let b2 = 1750;

L.imageOverlay('cropped.webp', bounds).addTo(map);

map.fitBounds(bounds);

async function loadData() {
  try {
    const response = await fetch('assets.json');

    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }

    const data = await response.json();

    const layers = {}

    class iconMarker {
      constructor(fargs={}) {
        const factor = 28;
        this.props = {
          'iconUrl': './icons/mapMarker1.png',
          'iconSize': [factor, factor],
          'iconAnchor': [factor/2, factor/2],
          'popupAnchor': [0, -factor/2]
        }
        
        for (const [k, v] of Object.entries(fargs)){
          this.props[k] = v
        }
      }
    }

    class cMarker {
        constructor(fargs={}) {
          this.props = {
              radius: 9,
              fillColor: "#ffa958",
              color: "#ffffff",
              weight: 1.05,
              opacity: 1,
              fillOpacity: 1
            }

            for (const [k, v] of Object.entries(fargs)){
              this.props[k] = v
            }
        }
      }

      class circleArea {
        constructor(fargs={}) {
          this.props = {
            radius: coordToMapScalar*50,
            fillColor: "#ffa958",
            color: "#ffffff",
            weight: 1.05,
            opacity: 1,
            fillOpacity: 1
          }

          for (const [k, v] of Object.entries(fargs)){
            this.props[k] = v
          }
        }
      }

    const stylingDict = {
      'Misc': new cMarker().props,
      'Plants': new cMarker({
            fillColor: "#ee74a3"
          }).props,
      // 'Jump pads': new cMarker({
      //       fillColor: "#00ccff"
      //     }).props,
      'Chests': new cMarker({
            fillColor: "#c68a09",
            color: "#fffb00"
          }).props,
      'Orb Chests': new cMarker({
            fillColor: "#bb5b11",
            color: "#fffb00"
          }).props,
      'Ores': new cMarker({
            fillColor: "#8758d3"
          }).props,
      'NPCs': new cMarker({
            fillColor: "#27ad71"
          }).props,      
      'Obelisks': new cMarker({
            fillColor: "rgb(110, 26, 199)"
          }).props,
      'Mobs': new cMarker({
            fillColor: "#d13a3a",
            radius: 8,
          }).props,
      'Sparkling mobs': new cMarker({
            fillColor: "#eb19c8"
          }).props,
      'Dungeons': new cMarker({
            fillColor: "#430dd8"
          }).props,
      'Checkpoints': new cMarker({
            fillColor: "#4db3db"
          }).props,
      'Minibosses': new cMarker({
            fillColor: "#eb681c"
          }).props,
      'Critters': new cMarker({
            fillColor: "#de58ff"
          }).props,
        'Recipes': new circleArea({
          fillColor: "#9b7700",
        }).props,
    }

    const iconDict = {
      'Obelisks': new iconMarker({
        'iconUrl': './icons/mapMarker5.png'
      }).props,
      'Chests':  new iconMarker({
        'iconUrl': './icons/mapMarker2.png'
      }).props,
      'Orb Chests':  new iconMarker({
        'iconUrl': './icons/mapMarker11.png'
      }).props,
      'NPCs':  new iconMarker({
        'iconUrl': './icons/mapMarker8.png'
      }).props,
      'Dungeons':  new iconMarker({
        'iconUrl': './icons/mapMarker3.png'
      }).props,
      'Checkpoints':  new iconMarker({
        'iconUrl': './icons/mapMarker6.png'
      }).props,
      'Minibosses':  new iconMarker({
        'iconUrl': './icons/mapMarker1.png'
      }).props,
    }

    const circleDict = {
      'Recipes': new circleArea({
          fillColor: "#9b7700",
          radius: coordToMapScalar*80,
          opacity: 0.5,
          fillOpacity: 0.5
        }).props,
    }
    

    // If it's an array:
    data.forEach(item => {
      let a = 4096-item.y;
      let b = item.x;
      let coords = [(s1*(a)+b1), s2*((b)+b2)]
      const category = item.categories?.[0] || 'Misc';
      if (!layers[category]) {
        layers[category] = L.layerGroup();
      }
      let newMarker;
      if(category in iconDict){
        let icon = L.icon(iconDict[category])
        newMarker = L.marker(coords, {'icon': icon})
      } else if(category in circleDict){
        newMarker = L.circle(coords, circleDict[category])
      } else if(category in stylingDict){
        newMarker = L.circleMarker(coords, stylingDict[category])
      } 
      
      else {
        newMarker = L.circleMarker(coords, new cMarker().props)
      }
      newMarker.bindPopup(item.label);
      newMarker.addTo(layers[category]);

      })
    

    // legend code
      
      const returnLegendLabelDiv = () => {

      const div = document.createElement('div');
      div.innerHTML = '';

      const checkedArray = ['Obelisks', 'NPCs', 'Chests'];
      
      Object.keys(layers).forEach(name => {
        const count = layers[name].getLayers().length;
        const colour = stylingDict[name]?.fillColor || stylingDict['Misc'].fillColor
        const isChecked = checkedArray.includes(name) ? 'checked' : '';

        if (isChecked == 'checked'){
          map.addLayer(layers[name])
        }
        div.innerHTML += `
          <label style="color: ${colour}">
            <input type="checkbox" ${isChecked} data-layer="${name}" class="category">
            <span class="check--image"></span><span class="category--text">${name}</span><span class="count">(${count})</span>
          </label>
        `;
      });

      return div;
    };
    
    console.log(layers)
    const legend = document.querySelector('div.legend');
    legend.appendChild(returnLegendLabelDiv())

    L.DomEvent.disableClickPropagation(
      document.querySelector('.legend')
    );

    document
      .querySelectorAll('.legend input[type="checkbox"]')
      .forEach(cb => {
        cb.addEventListener('change', e => {
          const layerName = e.target.dataset.layer;
          const layer = layers[layerName];

          if (e.target.checked) {
            map.addLayer(layer);
          } else {
            map.removeLayer(layer);
          }
        });
      });


  } catch (error) {
    console.error('Failed to load JSON:', error);
  }
}

loadData();

// const STORAGE_KEY = 'selectedCategories';

// function getSelectedCategories() {
//   return JSON.parse(localStorage.getItem(STORAGE_KEY)) || [];
// }

// function saveSelectedCategories(categories) {
//   localStorage.setItem(STORAGE_KEY, JSON.stringify(categories));
// }

// document.querySelectorAll('.category').forEach(cb => {
//   cb.addEventListener('change', () => {
//     const selected = getSelectedCategories();

//     if (cb.checked) {
//       if (!selected.includes(cb.value)) {
//         selected.push(cb.value);
//       }
//     } else {
//       const index = selected.indexOf(cb.value);
//       if (index !== -1) selected.splice(index, 1);
//     }

//     saveSelectedCategories(selected);
//   });
// });

// const selected = getSelectedCategories();

// document.querySelectorAll('.category').forEach(cb => {
//   cb.checked = selected.includes(cb.value);
// });

//up arrow code

const ScrollControl = L.Control.extend({
  options: {
    position: 'topright'
  },

  onAdd: function (map) {
    // Add your custom class here
    const container = L.DomUtil.create(
      'div',
      'leaflet-bar leaflet-control go--to--legend--button'
    );

    L.DomEvent.disableClickPropagation(container);

    container.onclick = function () {
      const target = document.getElementById('legend');
      if (target) {
        target.scrollIntoView({ behavior: 'smooth' });
      }
    };

    return container;
  }
});

map.addControl(new ScrollControl());