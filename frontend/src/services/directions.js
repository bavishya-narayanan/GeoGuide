export function validCoordinates(latitude, longitude) {
  const hasValue = (value) => value !== null && value !== undefined && value !== '' && Number.isFinite(Number(value));
  return hasValue(latitude) && Number(latitude) >= -90 && Number(latitude) <= 90
    && hasValue(longitude) && Number(longitude) >= -180 && Number(longitude) <= 180;
}

export function buildGoogleMapsDirectionsUrl(destination, origin = null) {
  if (!validCoordinates(destination?.latitude, destination?.longitude)) return null;
  const url = new URL('https://www.google.com/maps/dir/');
  url.searchParams.set('api', '1');
  if (origin && validCoordinates(origin.latitude, origin.longitude)) {
    url.searchParams.set('origin', `${Number(origin.latitude)},${Number(origin.longitude)}`);
  }
  url.searchParams.set('destination', `${Number(destination.latitude)},${Number(destination.longitude)}`);
  url.searchParams.set('travelmode', 'driving');
  return url.toString();
}
