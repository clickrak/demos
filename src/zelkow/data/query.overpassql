[out:json][timeout:180][bbox:50.100,19.730,50.215,19.840];
(
  way["building"](50.140,19.750,50.190,19.830); way["highway"]; way["waterway"];
  way["landuse"]; way["natural"]; relation["natural"]; relation["landuse"];
  node["natural"~"peak|cave_entrance|rock|stone|spring|cliff"];
  way["natural"~"cliff|bare_rock"];
  node["tourism"]; node["historic"]; way["historic"]; node["amenity"="place_of_worship"]; node["place"];
  relation["route"~"hiking|bicycle"];
  nwr["amenity"~"school|kindergarten|townhall|community_centre|library|fire_station"];
  nwr["amenity"~"restaurant|cafe|pub|bar|fast_food|ice_cream"];
  nwr["leisure"~"pitch|playground|stadium|sports_centre|park|track|fitness_station"];
  nwr["highway"="bus_stop"]; nwr["public_transport"~"platform|stop_position"];
  relation["route"="bus"];
);
out geom;
