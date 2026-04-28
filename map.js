const map = L.map('map', {
  crs: L.CRS.Simple,
  minZoom: -5
});

const tileSize = 1024;

const bounds = [
  [0, 0],
  [4096, 4096]
];
let s1 = 1.75;
let s2 = 1.75;
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
        const factor = 20;
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
              radius: 4,
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
      'Gatherables': new cMarker({
            fillColor: "#a7a042"
          }).props,
      'Misc': new cMarker().props,
      'Plants': new cMarker({
            fillColor: "#44db36"
          }).props,
      // 'Jump pads': new cMarker({
      //       fillColor: "#00ccff"
      //     }).props,
      'Chests': new cMarker({
            fillColor: "#ffc400",
            color: "#fffb00"
          }).props,
      'Recipes': new cMarker({
            fillColor: "#9b7700",
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
            fillColor: "#d13a3a"
          }).props
    }

    const iconDict = {
      'Obelisks': new iconMarker({
        'iconUrl': './icons/mapMarker5.png'
      }).props,
      'Chests':  new iconMarker({
        'iconUrl': './icons/mapMarker2.png'
      }).props,
      'NPCs':  new iconMarker({
        'iconUrl': './icons/mapMarker7.png'
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
      } else if(category in stylingDict){
        newMarker = L.circleMarker(coords, stylingDict[category])
      } else {
        newMarker = L.circleMarker(coords, new cMarker().props)
      }
      newMarker.bindPopup(item.label);
      newMarker.addTo(layers[category]);

      })
    

    // legend code

    const legend = L.control({ position: 'topright' });

    legend.onAdd = function () {
      const div = L.DomUtil.create('div', 'legend');
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
            <input type="checkbox" ${isChecked} data-layer="${name}">
            ${name} <span class="count">(${count})</span>
          </label>
        `;
      });

      return div;
    };

    legend.addTo(map);
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
