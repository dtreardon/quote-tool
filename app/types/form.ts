export interface InsuredData {
  uid: number
  insuredType: 'individual' | 'entity'
  // Individual fields
  first: string
  middle: string
  last: string
  suffix: string
  nickname: string
  dob: string
  ssn: string
  marital: string
  occupation: string
  relationship: string
  phone: string
  email: string
  showContact: boolean
  // Entity fields
  entityName: string
  entityType: string
  entityTypeOther: string
  ein: string
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
  mortgagee_open: boolean
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

  // Section 8 flags
  barrier_island: boolean

  // Section 10 - Flood
  flood_zone: string
  lot_height: string
  bfe: string
  firm_panel: string
  firm_eff_date: string
  flood_zone_description: string
  elevation_cert: string
  flood_type: string
  flood_cov_dwelling: string
  flood_cov_contents: string
  flood_quotes: QuoteData[]
}

export const INITIAL_INSURED: InsuredData = {
  uid: 1,
  insuredType: 'individual',
  first: '', middle: '', last: '', suffix: '', nickname: '',
  dob: '', ssn: '', marital: '', occupation: '',
  relationship: '', phone: '', email: '',
  showContact: false,
  entityName: '', entityType: '', entityTypeOther: '', ein: '',
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
  mortgagee_open: false,
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
  tankless: 'no',
  fire_alarm: '',
  burglar_alarm: '',
  sprinklered: 'no',
  sprinkler_floor: '',
  gated: 'no',
  fireplaces: '0',
  pool: 'no',
  pool_diving: false,
  pool_slide: false,
  pool_fenced: false,
  trampoline: 'no',
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
  bankruptcy: 'no',
  has_dogs: 'no',
  num_dogs: '0',
  biting_dogs: 'no',
  has_claims: 'no',
  claims: [],
  protection_class: '',
  territory_code: '',
  fire_dept_over: false,
  miles_fire_dept: '',
  hydrant_over: false,
  feet_hydrant: '',
  miles_coast: '',
  quotes: [{ uid: 1, carrier: '', premium: '' }],
  barrier_island: false,
  flood_zone: '',
  lot_height: '',
  bfe: '',
  firm_panel: '',
  firm_eff_date: '',
  flood_zone_description: '',
  elevation_cert: '',
  flood_type: '',
  flood_cov_dwelling: '',
  flood_cov_contents: '',
  flood_quotes: [{ uid: 1, carrier: '', premium: '' }],
}
