// What each kind of document is called on the screen. The keys are the server's (src/routes/documents.js).
export const KIND_LABEL = {
  passport: 'Passport',
  id_card: 'Identity card',
  driving_licence: 'Driving licence',
  vehicle_registration: 'Vehicle registration',
  vehicle_inspection: 'Vehicle inspection',
  insurance: 'Insurance',
  warranty: 'Warranty',
  contract: 'Contract',
  subscription: 'Subscription',
  medical: 'Medical',
  other: 'Other',
};

export const REMINDER_DAY_LABEL = {
  0: 'On the last day',
  1: '1 day before',
  3: '3 days before',
  7: '1 week before',
  14: '2 weeks before',
  30: '1 month before',
  60: '2 months before',
  90: '3 months before',
};
