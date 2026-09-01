
// Fetch a walking route from Point A to Point B
const getRoute = async (start, end) => {
    const response = await fetch(`https://router.project-osrm.org/route/v1/walking/${start.lon},${start.lat};${end.lon},${end.lat}?geometries=geojson`);
    const data = await response.json();
    return data.routes[0].geometry.coordinates; // Returns [[lon, lat], [lon, lat]...]
  };



