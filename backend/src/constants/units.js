// Allowed medication measure units. Keep this in sync with the identical
// list in frontend/src/constants/units.js (no shared package between the
// two apps, so it's duplicated deliberately). No default here on purpose:
// unit is a required field, callers must always supply one explicitly.
const MEDICATION_UNITS = ['tablets', 'capsules', 'vials', 'ampoules', 'mg', 'ml', 'units', 'boxes'];

module.exports = { MEDICATION_UNITS };
