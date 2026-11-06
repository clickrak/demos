[out:json][timeout:120][bbox:50.140,19.750,50.190,19.830];
(
  way["building"]; way["highway"]; way["waterway"];
  way["landuse"]; way["natural"]; relation["natural"]; relation["landuse"];
  node["natural"~"peak|cave_entrance|rock|stone|spring|cliff"];
  way["natural"~"cliff|bare_rock"];
  node["tourism"]; node["historic"]; way["historic"]; node["amenity"="place_of_worship"]; node["place"];
  relation["route"~"hiking|bicycle"];
);
out geom;
