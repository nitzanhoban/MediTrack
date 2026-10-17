// Allowed medication measure units. Keep this in sync with the identical
// list in backend/src/constants/units.js (no shared package between the
// two apps, so it's duplicated deliberately). No default here on purpose:
// unit is a required field, the create form forces an explicit choice.
export const MEDICATION_UNITS = ['tablets', 'capsules', 'vials', 'ampoules', 'mg', 'ml', 'units', 'boxes'];
