export interface InsuredData {
  uid: number
  first: string
  middle: string
  last: string
  suffix: string
  dob: string
  ssn: string
  marital: string
  occupation: string
  relationship: string
  phone: string
  email: string
  showContact: boolean
}

export interface ClaimData {
  uid: number
  date: string
  type: string
  amount: string
  carrier: string
  status: string
}

export interface QuoteData {
  uid: number
  carrier: string
  premium: string
}

export interface FormState {
  // Banner
  policy_type: string
  occupancy: string
  rental_term: string
  flood_quote: string

  // Notes
  notes: string

  // Section 1 - File & Referral
  agent: string
  referred_by_name: string
  referred_by_company: string
  new_purchase: string
  closing_date: string
  sales_price: string
  closing_contact: string
  purchase_year: string
  current_carrier: string
  premium: string
  mortgagee_name: string
  mortgagee_street: string
  mortgagee_city: string
  mortgagee_state: string
  mortgagee_zip: string
  loan_number: string

  // Section 2 - Insured
  insureds: InsuredData[]

  // Section 3 - Subject Property
  prop_street: string
  prop_city: string
  prop_state: string
  prop_zip: string
  prop_county: string
  prop_lat: number | null
  prop_lng: number | null

  // Section 4 - Other Addresses
  mail_same_as_subject: boolean
  mail_street: string
  mail_city: string
  mail_state: string
  mail_zip: string
  prev_street: string
  prev_city: string
  prev_state: string
  prev_zip: string

  // Section 5 - Property Details
  year_built: string
  num_stories: string
  sqft: string
  beds: string
  full_baths: string
  half_baths: string
  construction_type: string
  foundation_type: string
  garage_type: string
  garage_cars: string
  heat_air: string
  laundry_floor: string
  mh_make: string
  mh_model: string
  mh_config: string
  mh_location: string
  mh_length: string
  mh_width: string
  mh_serial: string
  reno_roof: string
  roof_shape: string
  roof_type: string
  reno_roof_scope: string
  reno_elec: string
  reno_elec_scope: string
  reno_hvac: string
  reno_hvac_scope: string
  reno_plum: string
  reno_plum_scope: string
  water_heater: string
  tankless: string
  fire_alarm: string
  burglar_alarm: string
  sprinklered: string
  sprinkler_floor: string
  gated: string
  fireplaces: string
  pool: string
  pool_diving: boolean
  pool_slide: boolean
  pool_fenced: boolean
  trampoline: string

  // Section 6 - Coverage
  cov_dwelling: string
  cov_other_structures: string
  cov_contents: string
  cov_loss_of_use: string
  cov_liability: string
  cov_med_payments: string
  cov_aop_ded: string
  aop_ded_mode: '$' | '%'
  cov_hurricane_ded: string
  hur_ded_mode: '$' | '%'
  hur_type: 'Hurricane' | 'Wind/Hail'

  // Section 7 - Underwriting
  bankruptcy: string
  has_dogs: string
  num_dogs: string
  biting_dogs: string
  has_claims: string
  claims: ClaimData[]

  // Section 8 - Rating
  protection_class: string
  territory_code: string
  fire_dept_over: boolean
  miles_fire_dept: string
  hydrant_over: boolean
  feet_hydrant: string
  miles_coast: string

  // Section 9 - Quotes
  quotes: QuoteData[]

  // Section 10 - Flood
  flood_zone: string
  lot_height: string
  elevation_cert: string
  flood_type: string
  flood_cov_dwelling: string
  flood_cov_contents: string
  flood_quotes: QuoteData[]
}

export const INITIAL_INSURED: InsuredData = {
  uid: 1,
  first: '', middle: '', last: '', suffix: '',
  dob: '', ssn: '', marital: '', occupation: '',
  relationship: '', phone: '', email: '',
  showContact: false,
}

export const INITIAL_FORM: FormState = {
  policy_type: '',
  occupancy: '',
  rental_term: '',
  flood_quote: '',
  notes: '',
  agent: '',
  referred_by_name: '',
  referred_by_company: '',
  new_purchase: '',
  closing_date: '',
  sales_price: '',
  closing_contact: '',
  purchase_year: '',
  current_carrier: '',
  premium: '',
  mortgagee_name: '',
  mortgagee_street: '',
  mortgagee_city: '',
  mortgagee_state: '',
  mortgagee_zip: '',
  loan_number: '',
  insureds: [{ ...INITIAL_INSURED }],
  prop_street: '',
  prop_city: '',
  prop_state: '',
  prop_zip: '',
  prop_county: '',
  prop_lat: null,
  prop_lng: null,
  mail_same_as_subject: false,
  mail_street: '',
  mail_city: '',
  mail_state: '',
  mail_zip: '',
  prev_street: '',
  prev_city: '',
  prev_state: '',
  prev_zip: '',
  year_built: '',
  num_stories: '',
  sqft: '',
  beds: '',
  full_baths: '',
  half_baths: '',
  construction_type: '',
  foundation_type: '',
  garage_type: '',
  garage_cars: '0',
  heat_air: '',
  laundry_floor: '',
  mh_make: '',
  mh_model: '',
  mh_config: '',
  mh_location: '',
  mh_length: '',
  mh_width: '',
  mh_serial: '',
  reno_roof: '',
  roof_shape: '',
  roof_type: '',
  reno_roof_scope: '',
  reno_elec: '',
  reno_elec_scope: '',
  reno_hvac: '',
  reno_hvac_scope: '',
  reno_plum: '',
  reno_plum_scope: '',
  water_heater: '',
  tankless: '',
  fire_alarm: '',
  burglar_alarm: '',
  sprinklered: '',
  sprinkler_floor: '',
  gated: '',
  fireplaces: '0',
  pool: '',
  pool_diving: false,
  pool_slide: false,
  pool_fenced: false,
  trampoline: '',
  cov_dwelling: '',
  cov_other_structures: '',
  cov_contents: '',
  cov_loss_of_use: '',
  cov_liability: '',
  cov_med_payments: '',
  cov_aop_ded: '',
  aop_ded_mode: '$',
  cov_hurricane_ded: '',
  hur_ded_mode: '%',
  hur_type: 'Hurricane',
  bankruptcy: '',
  has_dogs: '',
  num_dogs: '0',
  biting_dogs: '',
  has_claims: '',
  claims: [],
  protection_class: '',
  territory_code: '',
  fire_dept_over: false,
  miles_fire_dept: '',
  hydrant_over: false,
  feet_hydrant: '',
  miles_coast: '',
  quotes: [{ uid: 1, carrier: '', premium: '' }],
  flood_zone: '',
  lot_height: '',
  elevation_cert: '',
  flood_type: '',
  flood_cov_dwelling: '',
  flood_cov_contents: '',
  flood_quotes: [{ uid: 1, carrier: '', premium: '' }],
}
